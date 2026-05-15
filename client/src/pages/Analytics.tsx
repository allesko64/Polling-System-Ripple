import { useState, useEffect, useRef, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { io, Socket } from 'socket.io-client'
import Sidebar from '../components/Sidebar'
import api from '../lib/api'
import toast from 'react-hot-toast'
import { useAuthStore } from '../lib/store'

interface AnalyticsData {
  totalResponses: number
  questionStats: {
    id: string
    questionText: string
    isMandatory: boolean
    options: {
      id: string
      optionText: string
      count: number
      percentage: number
    }[]
  }[]
  timeline: {
    hour: string
    count: number
  }[]
}

function parseNumericStat(value: string): { target: number; suffix: string } | null {
  if (/^\d+$/.test(value)) return { target: parseInt(value, 10), suffix: '' }
  if (/^\d+%$/.test(value)) return { target: parseInt(value, 10), suffix: '%' }
  return null
}

function StatCardValue({ value, color, active }: { value: string; color: string; active: boolean }) {
  const parsed = useMemo(() => parseNumericStat(value), [value])
  const [display, setDisplay] = useState('')

  useEffect(() => {
  if (!active) {
    const t = window.setTimeout(() => {
      setDisplay(parsed ? (parsed.suffix === '%' ? '0%' : '0') : '')
    }, 0)
    return () => clearTimeout(t)
  }
  if (!parsed) {
    const t = window.setTimeout(() => setDisplay(value), 120)
    return () => clearTimeout(t)
  }
  const { target, suffix } = parsed
  const t0 = window.setTimeout(() => setDisplay('0' + suffix), 0)
  const start = performance.now()
  const dur = 880
  const ease = (p: number) => 0.5 - 0.5 * Math.cos(Math.PI * p)
  let raf = 0
  const run = (now: number) => {
    const p = Math.min(1, (now - start) / dur)
    setDisplay(`${Math.round(target * ease(p))}${suffix}`)
    if (p < 1) raf = requestAnimationFrame(run)
  }
  raf = requestAnimationFrame(run)
  return () => {
    clearTimeout(t0)
    cancelAnimationFrame(raf)
  }
}, [active, value, parsed])
  return (
    <p style={{
      fontSize: '1.8rem', fontWeight: 800, color,
      letterSpacing: '-0.03em', lineHeight: 1,
      marginBottom: '6px', minHeight: '2.2rem',
    }}>
      {display}
    </p>
  )
}

export default function Analytics() {
  const { pollId } = useParams()
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [barsVisible, setBarsVisible] = useState(false)
  const [statActive, setStatActive] = useState(false)
  const [livePulsed, setLivePulsed] = useState(false)
  const socketRef = useRef<Socket | null>(null)
  const mountedRef = useRef(true)
  const accessToken = useAuthStore((s) => s.accessToken)

  const socketUrl =
    import.meta.env.VITE_SOCKET_URL ||
    (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api').replace(/\/api\/?$/, '')

  useEffect(() => {
    mountedRef.current = true

    let timeout: ReturnType<typeof setTimeout>
    const loadAnalytics = async () => {
      try {
        const { data: d } = await api.get(`/polls/${pollId}/analytics`)

        if (!mountedRef.current) return

        setData(d)

        timeout = setTimeout(() => {
          if (!mountedRef.current) return
          setBarsVisible(true)
          setStatActive(true)
        }, 300)
      } catch {
        toast.error('Failed to load analytics')
      } finally {
        if (mountedRef.current) {
          setLoading(false)
        }
      }
    }

    void loadAnalytics()

    const socket = io(socketUrl, { withCredentials: true })
    socketRef.current = socket

    const onResponseEvent = (_payload: { totalResponses?: number; pollId?: string }) => {
      setLivePulsed(true)
      window.setTimeout(() => {
        if (mountedRef.current) setLivePulsed(false)
      }, 600)
      void loadAnalytics()
    }

    socket.on('connect', () => {
      // Pass the access token so the server can verify the creator
      socket.emit('join:creator', pollId, accessToken ?? '')
    })

    socket.on('poll:response_received', onResponseEvent)

    return () => {
      mountedRef.current = false
      clearTimeout(timeout)
      socket.off('poll:response_received', onResponseEvent)
      socket.disconnect()
    }
  }, [pollId, socketUrl, accessToken])
  const maxTimeline = data?.timeline.length
    ? Math.max(...data.timeline.map(t => Number(t.count)))
    : 1

  if (loading) return <div style={{ padding: '40px' }}>Loading analytics...</div>
  if (!data) return <div style={{ padding: '40px' }}>No data found</div>

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#FAFAF9' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '40px 48px', overflow: 'auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '36px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1C1917', letterSpacing: '-0.02em', margin: 0 }}>
                Analytics
              </h1>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="animate-pulse-dot" style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#EA7C2B' }} />
              <span style={{ fontSize: '0.82rem', color: '#57534E', fontWeight: 500 }}>Live</span>
            </div>
          </div>
        </div>

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '22px 24px', boxShadow: '0 2px 10px rgba(28,25,23,0.07)' }}>
            <p style={{ fontSize: '0.78rem', fontWeight: 600, color: '#57534E', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>Total Responses</p>
            <StatCardValue value={String(data.totalResponses)} color="#EA7C2B" active={statActive} />
          </div>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '22px 24px', boxShadow: '0 2px 10px rgba(28,25,23,0.07)' }}>
            <p style={{ fontSize: '0.78rem', fontWeight: 600, color: '#57534E', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>Questions</p>
            <StatCardValue value={String(data.questionStats.length)} color="#1C1917" active={statActive} />
          </div>
        </div>

        {/* Charts row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
          {/* Timeline */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 10px rgba(28,25,23,0.07)' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1C1917', marginBottom: '20px' }}>Response Timeline</h3>
            {data.timeline.length === 0 ? (
              <p style={{ color: '#57534E', fontSize: '0.85rem' }}>No timeline data yet</p>
            ) : (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px', height: '120px' }}>
                {data.timeline.map((t, i) => (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', height: '100%', justifyContent: 'flex-end' }}>
                    <div style={{
                      width: '100%', borderRadius: '6px 6px 0 0',
                      backgroundColor: '#EA7C2B',
                      height: barsVisible ? `${(Number(t.count) / maxTimeline) * 100}%` : '0%',
                      transition: `height 0.6s cubic-bezier(0.4,0,0.2,1) ${i * 0.07}s`,
                      minHeight: '2px',
                    }} />
                    <span style={{ fontSize: '0.68rem', color: '#57534E' }}>
                      {new Date(t.hour).getHours()}h
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Live counter */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 10px rgba(28,25,23,0.07)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1C1917', margin: 0 }}>Live Responses</h3>
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <span
                className={livePulsed ? 'animate-socket-pulse' : ''}
                style={{ fontSize: '3.5rem', fontWeight: 800, color: '#EA7C2B', letterSpacing: '-0.04em', display: 'block' }}
              >
                {data.totalResponses.toLocaleString()}
              </span>
              <span style={{ fontSize: '0.85rem', color: '#57534E', fontWeight: 500 }}>total responses</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
              <div className="animate-pulse-dot" style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#10B981' }} />
              <span style={{ fontSize: '0.8rem', color: '#10B981', fontWeight: 600 }}>Updating in real time</span>
            </div>
          </div>
        </div>

        {/* Question breakdowns */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1C1917', margin: 0 }}>Question Breakdown</h3>
          {data.questionStats.map((q, qi) => (
            <div key={q.id} style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px 28px', boxShadow: '0 2px 10px rgba(28,25,23,0.07)' }}>
              <p style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1C1917', marginBottom: '20px', lineHeight: 1.4 }}>
                {q.questionText}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {q.options.map((opt, oi) => {
                  const isTop = opt.count === Math.max(...q.options.map(o => o.count))
                  return (
                    <div key={opt.id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                        <span style={{ fontSize: '0.85rem', color: '#57534E', fontWeight: isTop ? 600 : 400 }}>{opt.optionText}</span>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.8rem', color: '#57534E' }}>{opt.count} votes</span>
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: isTop ? '#EA7C2B' : '#57534E', minWidth: '38px', textAlign: 'right' }}>
                            {opt.percentage}%
                          </span>
                        </div>
                      </div>
                      <div style={{ height: '8px', backgroundColor: '#F5F5F4', borderRadius: '999px', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', borderRadius: '999px',
                          backgroundColor: isTop ? '#EA7C2B' : 'rgba(28,25,23,0.15)',
                          width: barsVisible ? `${opt.percentage}%` : '0%',
                          transition: `width 0.7s cubic-bezier(0.4,0,0.2,1) ${(qi * 4 + oi) * 0.08}s`,
                        }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Publish button */}
        <div style={{ marginTop: '32px' }}>
          <button
            className="btn-coral"
            onClick={async () => {
              try {
                await api.post(`/polls/${pollId}/publish`)
                toast.success('Results published!')
              } catch {
                toast.error('Failed to publish — poll must be closed first')
              }
            }}
            style={{ width: '100%', fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            Publish Results →
          </button>
        </div>

      </main>
    </div>
  )
}