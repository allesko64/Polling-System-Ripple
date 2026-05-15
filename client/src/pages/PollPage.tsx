import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link, Navigate } from 'react-router-dom'
import api from '../lib/api'
import { toast } from 'react-hot-toast'
import { getVisitorId } from '../lib/fingerprint'
import { createSocket } from '../lib/socket'

interface Option {
  id: string
  questionId: string
  optionText: string
  orderIndex: number
}

interface Question {
  id: string
  pollId: string
  questionText: string
  isMandatory: boolean
  orderIndex: number
  options: Option[]
}


export default function PollPage() {
  const { pollId } = useParams()
  const navigate = useNavigate()
  const [poll, setPoll] = useState<{
  id: string
  title: string
  status: 'active' | 'closed' | 'published'
  questions: Question[]
  isAnonymous: boolean
  } | null>(null)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [direction, setDirection] = useState<'forward' | 'back'>('forward')
  const [animKey, setAnimKey] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPoll = async () => {
    try {
      const { data } = await api.get(`/polls/${pollId}`)
      if (data.status === 'closed') {
        setPoll(data)
        setLoading(false)
        return
      }
      if (data.status === 'published') {
        setPoll(data)
        setLoading(false)
        return
      }
      setPoll(data)
    } catch (error) {
      console.error('Error fetching poll:', error)
      toast.error('Failed to load poll. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

    void fetchPoll()
    const socket = createSocket()
    socket.on('connect', () => socket.emit('join:poll', pollId))
    socket.on('poll:status_changed', ({ status }) => {
    if (status === 'closed') {
      setPoll(prev => prev ? { ...prev, status: 'closed' } : prev)
    }
    if (status === 'published') {
      navigate(`/polls/${pollId}/results`)
    }
  })

  return () => {socket.disconnect()}
  
  }, [pollId , navigate])

  if (loading) {
    return (
      <PollStatusShell>
        <PollLoadingState />
      </PollStatusShell>
    )
  }
  if (!poll) {
    return (
      <PollStatusShell>
        <PollNotFoundState />
      </PollStatusShell>
    )
  }
  if (poll.status === 'closed') {
    const closedPoll = poll as { title?: string; message?: string }
    return (
      <PollStatusShell>
        <PollClosedState
          pollId={pollId}
          title={closedPoll.title}
          message={closedPoll.message || 'This poll is no longer accepting responses.'}
        />
      </PollStatusShell>
    )
  }
  if (poll.status === 'published') {
    return <Navigate to={`/polls/${pollId}/results`} replace />
  }

  

  const question = poll?.questions[currentIdx]
  const total = poll.questions.length
  const progress = total ? ((currentIdx + 1) / total) * 100 : 0
  const selected = answers[question?.id]
  const isLast = currentIdx === (total ? total - 1 : -1)    

  const go = (dir: 'forward' | 'back') => {
    setDirection(dir)
    setAnimKey((k) => k + 1)
    if (dir === 'forward') setCurrentIdx((i) => i + 1)
    else setCurrentIdx((i) => i - 1)
  }

  const handleSubmit = async () => {
  try {
    const visitorId = await getVisitorId()
    
    const formattedAnswers = Object.entries(answers).map(
      ([questionId, optionId]) => ({ questionId, optionId })
    )
    
    await api.post(`/polls/${pollId}/respond`, {
      visitorId,
      answers: formattedAnswers
    })
    navigate(`/poll/${pollId}/thank-you`)
  } catch (error: unknown) {
      
     // ← add this
    console.error('submit error:', JSON.stringify((error as {response?: {data?: unknown}}).response?.data))
    toast.error('Failed to submit response')
  }
}

  

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#FAFAF9',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: '3px', backgroundColor: '#E7E5E4', zIndex: 100 }}>
        <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
      </div>

      <header style={{
        padding: '24px 40px 0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '7px', backgroundColor: '#1C1917',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="3" fill="#EA7C2B"/>
              <circle cx="8" cy="8" r="6" stroke="#EA7C2B" strokeWidth="1.5" strokeOpacity="0.4" fill="none"/>
            </svg>
          </div>
          <span style={{ fontWeight: 800, color: '#1C1917', fontSize: '1rem' }}>Ripple</span>
        </div>
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#57534E' }}>
          Question {currentIdx + 1} of {total}
        </span>
      </header>

      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 24px',
      }}>
        <div
          key={animKey}
          className={direction === 'forward' ? 'animate-slide-right' : 'animate-slide-left'}
          style={{ width: '100%', maxWidth: '600px' }}
        >
          <p style={{
            fontSize: '0.82rem',
            fontWeight: 700,
            color: '#57534E',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: '16px',
          }}>
            Question {currentIdx + 1}
          </p>
          <h1 style={{
            fontSize: 'clamp(1.4rem, 3.5vw, 2rem)',
            fontWeight: 800,
            color: '#1C1917',
            letterSpacing: '-0.02em',
            lineHeight: 1.25,
            marginBottom: '36px',
          }}>
            {question.questionText}
          </h1>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {question.options.map((opt) => {
              const isSelected = selected === opt.id
              return (
                <OptionCard
                  key={opt.id}
                  option={opt}
                  selected={isSelected}
                  onSelect={() => setAnswers({ ...answers, [question.id]: opt.id })}
                />
              )
            })}
          </div>
        </div>
      </main>

      <footer style={{
        padding: '24px 40px 36px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        maxWidth: '680px',
        margin: '0 auto',
        width: '100%',
      }}>
        {currentIdx > 0 ? (
          <button
            onClick={() => go('back')}
            className="btn-ghost"
            style={{ fontWeight: 600, fontSize: '0.9rem' }}
          >
            Back
          </button>
        ) : <div />}

        {isLast ? (
          <button
            onClick={handleSubmit}
            disabled={!selected}
            className="btn-coral"
            style={{
              fontWeight: 700,
              fontSize: '0.95rem',
              opacity: selected ? 1 : 0.45,
              transition: 'opacity 0.25s ease',
            }}
          >
            Submit my answers →
          </button>
        ) : (
          <button
            onClick={() => selected && go('forward')}
            className="btn-coral"
            style={{
              fontWeight: 700,
              fontSize: '0.9rem',
              opacity: selected ? 1 : 0.45,
              cursor: selected ? 'pointer' : 'default',
              transition: 'opacity 0.25s ease',
            }}
          >
            Next
          </button>
        )}
      </footer>
    </div>
  )
}

function PollStatusShell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#FAFAF9',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <header style={{ padding: '24px 40px' }}>
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '7px', backgroundColor: '#1C1917',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="3" fill="#EA7C2B"/>
              <circle cx="8" cy="8" r="6" stroke="#EA7C2B" strokeWidth="1.5" strokeOpacity="0.4" fill="none"/>
            </svg>
          </div>
          <span style={{ fontWeight: 800, color: '#1C1917', fontSize: '1rem' }}>Ripple</span>
        </Link>
      </header>
      <main style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px 80px',
      }}>
        {children}
      </main>
    </div>
  )
}

function PollLoadingState() {
  return (
    <div className="animate-fade-in-up" style={{ textAlign: 'center' }}>
      <div className="animate-pulse-dot" style={{
        width: '10px', height: '10px', borderRadius: '50%',
        backgroundColor: '#EA7C2B', margin: '0 auto 20px',
      }} />
      <p style={{ color: '#57534E', fontSize: '0.95rem', fontWeight: 500 }}>Loading poll…</p>
    </div>
  )
}

function PollNotFoundState() {
  return (
    <StatusCard
      icon="not_found"
      title="Poll not found"
      description="This link may be invalid or the poll was removed. Check the URL from your organizer or open it from the home page."
      primary={{ label: 'Go to home', to: '/' }}
    />
  )
}

function PollClosedState({
  pollId,
  title,
  message,
}: {
  pollId?: string
  title?: string
  message: string
}) {
  return (
    <StatusCard
      icon="closed"
      title={title ? `${title} has ended` : 'This poll has ended'}
      description={message}
      badge="Closed"
      primary={{ label: 'Back to home', to: '/' }}
      secondary={pollId ? { label: 'View published results', to: `/polls/${pollId}/results` } : undefined}
    />
  )
}

function StatusCard({
  icon,
  title,
  description,
  badge,
  primary,
  secondary,
}: {
  icon: 'closed' | 'not_found' | 'published'
  title: string
  description: string
  badge?: string
  primary: { label: string; to: string }
  secondary?: { label: string; to: string }
}) {
  const iconBg = icon === 'closed' ? 'rgba(28,25,23,0.08)' : 'rgba(234,124,43,0.1)'
  const iconColor = icon === 'closed' ? '#1C1917' : '#EA7C2B'

  return (
    <div
      className="animate-fade-in-up"
      style={{
        width: '100%',
        maxWidth: '480px',
        backgroundColor: '#ffffff',
        borderRadius: '20px',
        padding: '40px 36px',
        boxShadow: '0 4px 24px rgba(28,25,23,0.08)',
        border: '1px solid #E7E5E4',
        textAlign: 'center',
      }}
    >
      {badge ? (
        <span style={{
          display: 'inline-block',
          padding: '4px 12px',
          borderRadius: '999px',
          backgroundColor: 'rgba(28,25,23,0.08)',
          color: '#1C1917',
          fontSize: '0.75rem',
          fontWeight: 700,
          marginBottom: '20px',
        }}>
          {badge}
        </span>
      ) : null}
      <div style={{
        width: '64px', height: '64px', borderRadius: '50%',
        backgroundColor: iconBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 24px', color: iconColor,
      }}>
        {icon === 'closed' ? (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
        ) : (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        )}
      </div>
      <h1 style={{
        fontSize: '1.35rem',
        fontWeight: 800,
        color: '#1C1917',
        letterSpacing: '-0.02em',
        marginBottom: '12px',
        lineHeight: 1.3,
      }}>
        {title}
      </h1>
      <p style={{ color: '#57534E', fontSize: '0.95rem', lineHeight: 1.65, marginBottom: '28px' }}>
        {description}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
        <Link to={primary.to} className="btn-coral" style={{ fontWeight: 700, textDecoration: 'none', width: '100%', textAlign: 'center' }}>
          {primary.label}
        </Link>
        {secondary ? (
          <Link to={secondary.to} className="btn-ghost" style={{ fontWeight: 600, textDecoration: 'none', width: '100%', textAlign: 'center' }}>
            {secondary.label}
          </Link>
        ) : null}
      </div>
    </div>
  )
}

function OptionCard({ option, selected, onSelect }: { option: Option; selected: boolean; onSelect: () => void }) {
  const [hovered, setHovered] = useState(false)

  return (
    <button
      type="button"
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`option-card ${selected ? 'option-card--selected' : ''}`}
      style={{
        width: '100%',
        padding: 0,
        borderRadius: '12px',
        border: selected ? '2px solid #EA7C2B' : '2px solid #E7E5E4',
        backgroundColor: hovered && !selected ? 'rgba(28,25,23,0.03)' : '#ffffff',
        cursor: 'pointer',
        transition: 'border-color 0.2s ease, background-color 0.2s ease',
        textAlign: 'left',
      }}
    >
      <span className="option-card__fill" aria-hidden />
      <span className="option-card__inner" style={{ padding: '16px 20px' }}>
        <span style={{
          fontSize: '0.95rem',
          fontWeight: selected ? 600 : 400,
          color: '#1C1917',
          lineHeight: 1.4,
          transition: 'font-weight 0.2s ease',
        }}>
          {option.optionText}
        </span>
        <span className="option-card__check" aria-hidden>
          <span style={{
            width: '22px', height: '22px', borderRadius: '50%',
            backgroundColor: '#EA7C2B',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </span>
        </span>
      </span>
    </button>
  )
}
