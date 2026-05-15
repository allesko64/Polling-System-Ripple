
import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../lib/api'

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



export default function PublishedResults() {
  const { pollId } = useParams()
  const [data, setData] = useState<StatsData | null>(null)
  const [barsVisible, setBarsVisible] = useState(false)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)
  const [poll, setPoll] = useState<{ title: string; status: string } | null>(null)

  useEffect(() => {
    const fetchResults = async () => {
      try {
    const [statsRes, pollRes] = await Promise.all([
      api.get(`/polls/${pollId}/stats?visitorId=published`),
      api.get(`/polls/${pollId}`)
    ])
    setData(statsRes.data)
    setPoll(pollRes.data)
    setTimeout(() => setBarsVisible(true), 400)
  } catch {
    console.error('Failed to load results')
  } finally {
    setLoading(false)
  }
    }
    void fetchResults()
  }, [pollId])

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return <div style={{ padding: '40px' }}>Loading results...</div>
  if (!data) return <div style={{ padding: '40px' }}>Results not found</div>

  const totalVotes = data.totalResponses

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FAFAF9' }}>
      {/* Banner */}
      <div style={{
        backgroundColor: 'rgba(28,25,23,0.06)',
        borderBottom: '1px solid #E7E5E4',
        padding: '14px 24px',
        textAlign: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1C1917" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#1C1917' }}>
          This poll has ended. Results are now public.
        </span>
      </div>

      <div style={{
        maxWidth: '720px',
        margin: '0 auto',
        padding: '48px 24px 80px',
      }}>
        {/* Header */}
        <div className="animate-fade-in-up" style={{ marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1 }}>
              <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none', marginBottom: '20px' }}>
                <div style={{
                  width: '24px', height: '24px', borderRadius: '6px', backgroundColor: '#1C1917',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="3" fill="#EA7C2B"/>
                    <circle cx="8" cy="8" r="6" stroke="#EA7C2B" strokeWidth="1.5" strokeOpacity="0.4" fill="none"/>
                  </svg>
                </div>
                <span style={{ fontWeight: 800, color: '#1C1917', fontSize: '0.9rem' }}>Ripple</span>
              </Link>
              <h1 style={{
                fontSize: 'clamp(1.4rem, 3.5vw, 2rem)',
                fontWeight: 800,
                color: '#1C1917',
                letterSpacing: '-0.02em',
                marginBottom: '12px',
                lineHeight: 1.2,
              }}>
                {poll?.title}
              </h1>
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: '#57534E' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 00-3-3.87"/>
                    <path d="M16 3.13a4 4 0 010 7.75"/>
                  </svg>
                  <strong style={{ color: '#1C1917' }}>{totalVotes.toLocaleString()}</strong> total votes
                </span>
                <span style={{ fontSize: '0.85rem', color: '#57534E' }}>3 questions</span>
                <span style={{ padding: '2px 10px', borderRadius: '999px', backgroundColor: 'rgba(28,25,23,0.08)', color: '#1C1917', fontSize: '0.75rem', fontWeight: 700 }}>
                  Closed
                </span>
              </div>
            </div>

            <button
              onClick={handleShare}
              className="btn-coral"
              style={{
                fontWeight: 600,
                fontSize: '0.87rem',
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                flexShrink: 0,
              }}
            >
              {copied ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                  </svg>
                  Share results
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {data.questions.map((qr, qi) => (
            <div
              key={qi}
              className="animate-fade-in-up"
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '18px',
                padding: '26px 30px',
                boxShadow: '0 2px 14px rgba(28,25,23,0.07)',
                animationDelay: `${qi * 0.1}s`,
              }}
            >
              <div style={{ marginBottom: '20px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#57534E', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
                  Question {qi + 1}
                </span>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1C1917', marginTop: '6px', lineHeight: 1.4 }}>
                  {qr.questionText}
                </h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {qr.options.map((opt, oi) => {
                  const isTop = Math.round((opt.count / data.totalResponses) * 100) === Math.max(...qr.options.map(o => Math.round((o.count / data.totalResponses) * 100)))
                  return (
                    <div key={oi}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {isTop && (
                            <span style={{
                              padding: '1px 7px', borderRadius: '999px',
                              backgroundColor: 'rgba(234,124,43,0.1)', color: '#EA7C2B',
                              fontSize: '0.68rem', fontWeight: 700,
                            }}>Top</span>
                          )}
                          <span style={{
                            fontSize: '0.88rem',
                            color: isTop ? '#1C1917' : '#57534E',
                            fontWeight: isTop ? 600 : 400,
                          }}>
                            {opt.optionText}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.8rem', color: '#57534E' }}>{opt.count} votes</span>
                          <span style={{ fontSize: '0.88rem', fontWeight: 700, color: isTop ? '#EA7C2B' : '#57534E', minWidth: '38px', textAlign: 'right' }}>
                            {Math.round((opt.count / data.totalResponses) * 100)}%
                          </span>
                        </div>
                      </div>
                      <div style={{ height: '10px', backgroundColor: '#F5F5F4', borderRadius: '999px', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', borderRadius: '999px',
                          backgroundColor: isTop ? '#EA7C2B' : 'rgba(28,25,23,0.15)',
                          width: barsVisible ? `${Math.round((opt.count / data.totalResponses) * 100)}%` : '0%',
                          transition: `width 0.7s cubic-bezier(0.4,0,0.2,1) ${(qi * 4 + oi) * 0.09}s`,
                        }} />
                      </div>
                    </div>
                  )
                })}
              </div>

              <p style={{ fontSize: '0.78rem', color: '#57534E', marginTop: '16px', textAlign: 'right' }}>
                {data.totalResponses.toLocaleString()} responses
              </p>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '48px', textAlign: 'center' }}>
          <p style={{ color: '#57534E', fontSize: '0.88rem', marginBottom: '16px' }}>
            Want to run your own poll?
          </p>
          <Link
            to="/register"
            className="btn-coral"
            style={{ fontWeight: 700, textDecoration: 'none' }}
          >
            Create a free account
          </Link>
        </div>
      </div>
    </div>
  )
}
