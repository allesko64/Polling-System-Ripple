import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { parsePollIdFromInput } from '../lib/pollUrl'

const features = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/>
        <polyline points="16 6 12 2 8 6"/>
        <line x1="12" y1="2" x2="12" y2="15"/>
      </svg>
    ),
    title: 'Share instantly',
    desc: 'Get a unique link the moment your poll is live. Share anywhere — no sign-up required for responders.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
    title: 'Real-time results',
    desc: 'Watch responses flow in live. Every answer updates your dashboard the instant it arrives.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/>
        <line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
    ),
    title: 'Beautiful analytics',
    desc: 'Charts that actually make sense. Understand your audience without spreadsheet headaches.',
  },
]

export default function Home() {
  const navigate = useNavigate()
  const [pollInput, setPollInput] = useState('')
  const [inputError, setInputError] = useState('')

  const openPoll = () => {
    const pollId = parsePollIdFromInput(pollInput)
    if (!pollId) {
      setInputError('Paste a valid poll link')
      return
    }
    setInputError('')
    navigate(`/poll/${pollId}`)
  }

  return (
    <>
      <Navbar />
      <main style={{ backgroundColor: '#FAFAF9', minHeight: '100vh', paddingTop: '64px' }}>

        {/* Hero */}
        <section style={{
          maxWidth: '1100px',
          margin: '0 auto',
          padding: '100px 2rem 80px',
          textAlign: 'center',
        }}>
          <div className="animate-fade-in-up" style={{ animationDelay: '0s' }}>
            <span style={{
              display: 'inline-block',
              padding: '6px 16px',
              borderRadius: '999px',
              backgroundColor: 'rgba(234,124,43,0.1)',
              color: '#EA7C2B',
              fontSize: '0.82rem',
              fontWeight: 600,
              marginBottom: '28px',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}>
              Polls, redesigned
            </span>
          </div>

          <h1 className="animate-fade-in-up delay-100" style={{
            fontSize: 'clamp(2.4rem, 5.5vw, 4.2rem)',
            fontWeight: 800,
            color: '#1C1917',
            letterSpacing: '-0.03em',
            lineHeight: 1.12,
            margin: '0 auto 24px',
            maxWidth: '820px',
          }}>
            Polls that work as fast as you think.
          </h1>

          <p className="animate-fade-in-up delay-200" style={{
            fontSize: '1.15rem',
            color: '#57534E',
            maxWidth: '560px',
            margin: '0 auto 48px',
            lineHeight: 1.75,
          }}>
            Create in seconds. Share instantly. Watch responses roll in live.
          </p>

          <div className="animate-fade-in-up delay-300" style={{
            display: 'flex',
            gap: '14px',
            justifyContent: 'center',
            flexWrap: 'wrap',
            marginBottom: '40px',
          }}>
            <Link
              to="/polls/create"
              className="btn-coral"
              style={{
                fontWeight: 700,
                fontSize: '1rem',
                textDecoration: 'none',
              }}
            >
              Create a Poll
            </Link>
            <button
              className="btn-ghost"
              style={{
                fontWeight: 600,
                fontSize: '1rem',
              }}
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
            >
              See How It Works
            </button>
          </div>

          {/* Open a shared poll */}
          <div
            className="animate-fade-in-up delay-400"
            style={{
              maxWidth: '520px',
              margin: '0 auto',
              textAlign: 'left',
            }}
          >
            <p style={{
              fontSize: '0.82rem',
              fontWeight: 600,
              color: '#57534E',
              marginBottom: '10px',
              textAlign: 'center',
            }}>
              Have a poll link? Paste it to respond
            </p>
            <div style={{
              display: 'flex',
              gap: '10px',
              flexWrap: 'wrap',
            }}>
              <input
                type="text"
                value={pollInput}
                onChange={(e) => {
                  setPollInput(e.target.value)
                  if (inputError) setInputError('')
                }}
                onKeyDown={(e) => e.key === 'Enter' && openPoll()}
                placeholder="Paste poll link…"
                className="input-field"
                aria-label="Poll link"
                style={{
                  flex: '1 1 200px',
                  borderRadius: '999px',
                  padding: '12px 18px',
                  fontSize: '0.9rem',
                }}
              />
              <button
                type="button"
                className="btn-coral"
                onClick={openPoll}
                style={{ fontWeight: 600, fontSize: '0.9rem', flexShrink: 0 }}
              >
                Open poll
              </button>
            </div>
            {inputError ? (
              <p style={{ color: '#EF4444', fontSize: '0.8rem', marginTop: '8px', textAlign: 'center' }}>
                {inputError}
              </p>
            ) : null}
          </div>
        </section>

        {/* Decorative divider */}
        <div style={{
          maxWidth: '1100px',
          margin: '0 auto',
          padding: '0 2rem',
        }}>
          <div style={{ height: '1px', backgroundColor: '#E7E5E4' }} />
        </div>

        {/* Feature Cards */}
        <section id="features" style={{
          maxWidth: '1100px',
          margin: '0 auto',
          padding: '80px 2rem 120px',
        }}>
          <div style={{
            textAlign: 'center',
            marginBottom: '56px',
          }}>
            <h2 style={{
              fontSize: '1.75rem',
              fontWeight: 700,
              color: '#1C1917',
              letterSpacing: '-0.02em',
              marginBottom: '12px',
            }}>
              Everything you need, nothing you don't.
            </h2>
            <p style={{ color: '#57534E', fontSize: '1rem', lineHeight: 1.6 }}>
              Ripple keeps it simple so you can focus on your questions, not your tools.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px',
          }}>
            {features.map((f, i) => (
              <div
                key={i}
                className="card-hover animate-fade-in-up"
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '20px',
                  padding: '40px 36px',
                  boxShadow: '0 2px 12px rgba(28,25,23,0.08)',
                  animationDelay: `${0.1 + i * 0.1}s`,
                }}
              >
                <div style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '14px',
                  backgroundColor: 'rgba(234,124,43,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#EA7C2B',
                  marginBottom: '24px',
                }}>
                  {f.icon}
                </div>
                <h3 style={{
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  color: '#1C1917',
                  marginBottom: '10px',
                }}>
                  {f.title}
                </h3>
                <p style={{
                  color: '#57534E',
                  lineHeight: 1.72,
                  fontSize: '0.92rem',
                  margin: 0,
                }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Banner */}
        <section style={{
          backgroundColor: '#1C1917',
          padding: '80px 2rem',
        }}>
          <div style={{ maxWidth: '700px', margin: '0 auto', textAlign: 'center' }}>
            <h2 style={{
              fontSize: '2rem',
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: '-0.02em',
              marginBottom: '16px',
            }}>
              Ready to hear what people think?
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1.05rem', marginBottom: '36px', lineHeight: 1.7 }}>
              Your first poll is just a few clicks away. No credit card needed.
            </p>
            <Link
              to="/register"
              className="btn-coral"
              style={{
                fontWeight: 700,
                fontSize: '1rem',
                textDecoration: 'none',
              }}
            >
              Get started free
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer style={{
          backgroundColor: '#FAFAF9',
          padding: '32px 2rem',
          borderTop: '1px solid #E7E5E4',
          textAlign: 'center',
        }}>
          <p style={{ color: '#57534E', fontSize: '0.85rem', margin: 0 }}>
            © 2026 Ripple. Polls that resonate.
          </p>
        </footer>
      </main>
    </>
  )
}
