import { useState, useEffect, useRef } from 'react'
import { Link, useParams } from 'react-router-dom'
import { io, Socket } from 'socket.io-client'
import api from '../lib/api'
import { getVisitorId } from '../lib/fingerprint'

const socketUrl =
  import.meta.env.VITE_SOCKET_URL ||
  (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api').replace(/\/api\/?$/, '')

interface StatsData {
  totalResponses: number
  questions: {
    id: string
    questionText: string
    options: {
      id: string
      optionText: string
      count: number
    }[]
  }[]
}

export default function ThankYou() {
  const { pollId } = useParams()
  const [data, setData] = useState<StatsData | null>(null)
  const [barsVisible, setBarsVisible] = useState(false)
  const [pulsed, setPulsed] = useState(false)
  const socketRef = useRef<Socket | null>(null)
  const mountedRef = useRef(true)

  

  useEffect(() => {
    mountedRef.current = true

    const fetchStats = async () => {
      try {
        const visitorId = await getVisitorId()
        const { data: stats } = await api.get(
          `/polls/${pollId}/stats?visitorId=${visitorId}`
        )
        if (mountedRef.current) setData(stats)
      } catch (err) {
        console.error('Failed to load stats:', err)
      }
    }

    void fetchStats()
    setTimeout(() => { if (mountedRef.current) setBarsVisible(true) }, 600)

    const socket = io(socketUrl, { withCredentials: true })
    socketRef.current = socket

    socket.on('connect', () => socket.emit('join:thankyou', pollId))
    socket.on('poll:stats_update', () => {
      void fetchStats()
      setPulsed(true)
      setTimeout(() => { if (mountedRef.current) setPulsed(false) }, 400)
    })

    return () => {
      mountedRef.current = false
      socket.disconnect()
    }
  }, [pollId])

  if (!data) return <div style={{ padding: '40px' }}>Loading results...</div>

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#FAFAF9',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '60px 24px 80px',
    }}>
      {/* Checkmark hero */}
      <div className="animate-fade-in-up" style={{ textAlign: 'center', marginBottom: '64px' }}>
        <div style={{ position: 'relative', display: 'inline-block', marginBottom: '32px' }}>
          <svg width="96" height="96" viewBox="0 0 100 100" fill="none">
            <circle className="check-circle-path" cx="50" cy="50" r="45" stroke="#EA7C2B" strokeWidth="4" fill="rgba(234,124,43,0.06)" />
            <path className="check-mark-path" d="M28 52 L43 67 L72 36" stroke="#EA7C2B" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 800, color: '#1C1917', letterSpacing: '-0.02em', marginBottom: '12px' }}>
          Thank you for responding!
        </h1>
        <p style={{ color: '#57534E', fontSize: '1.05rem', lineHeight: 1.7, maxWidth: '420px', margin: '0 auto' }}>
          Your voice matters. Here's how the community voted so far.
        </p>
      </div>

      {/* Live stats */}
      <div style={{ width: '100%', maxWidth: '680px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '12px' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1C1917', margin: 0 }}>
            Here's how others voted so far:
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="animate-pulse-dot" style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#EA7C2B' }} />
            <span
              className={pulsed ? 'animate-count-pulse' : ''}
              key={data.totalResponses}
              style={{ fontSize: '1rem', fontWeight: 700, color: '#1C1917' }}
            >
              {data.totalResponses.toLocaleString()} total responses
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {data.questions.map((q, qi) => {
            const maxCount = Math.max(...q.options.map(o => o.count))
            return (
              <div key={q.id} className="animate-fade-in-up" style={{
                backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px 28px',
                boxShadow: '0 2px 12px rgba(28,25,23,0.07)',
                animationDelay: `${0.2 + qi * 0.15}s`,
              }}>
                <p style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1C1917', marginBottom: '20px', lineHeight: 1.4 }}>
                  {q.questionText}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {q.options.map((opt) => {
                    const total = q.options.reduce((sum, o) => sum + o.count, 0)
                    const pct = total > 0 ? Math.round((opt.count / total) * 100) : 0
                    const isTop = opt.count === maxCount && opt.count > 0
                    return (
                      <div key={opt.id}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                          <span style={{ fontSize: '0.85rem', color: isTop ? '#1C1917' : '#57534E', fontWeight: isTop ? 600 : 400 }}>
                            {opt.optionText}
                          </span>
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: isTop ? '#EA7C2B' : '#57534E' }}>
                            {pct}%
                          </span>
                        </div>
                        <div style={{ height: '8px', backgroundColor: '#F5F5F4', borderRadius: '999px', overflow: 'hidden' }}>
                          <div style={{
                            height: '100%', borderRadius: '999px',
                            backgroundColor: isTop ? '#EA7C2B' : 'rgba(28,25,23,0.15)',
                            width: barsVisible ? `${pct}%` : '0%',
                            transition: `width 0.7s cubic-bezier(0.4,0,0.2,1)`,
                          }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        <div style={{ textAlign: 'center', marginTop: '48px' }}>
          <Link to="/" className="btn-ghost" style={{ fontWeight: 600, textDecoration: 'none', marginRight: '12px' }}>
            Go home
          </Link>
          <Link to="/polls/create" className="btn-coral" style={{ fontWeight: 600, textDecoration: 'none' }}>
            Create your own poll
          </Link>
        </div>
      </div>
    </div>
  )
}