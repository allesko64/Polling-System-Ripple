import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import api from '../lib/api'
import toast from 'react-hot-toast'

type PollStatus = 'active' | 'closed' | 'published'

interface Poll {
  id: string
  title: string
  status: PollStatus
  expiresAt: string
  isAnonymous?: boolean
  createdAt?: string
  responseCount: number
}


const statusConfig: Record<PollStatus, { label: string; bg: string; color: string }> = {
  active:    { label: 'Active',     bg: 'rgba(16,185,129,0.1)',  color: '#10B981' },
  closed:    { label: 'Closed',     bg: 'rgba(28,25,23,0.1)',    color: '#1C1917' },
  published: { label: 'Published',  bg: 'rgba(234,124,43,0.12)', color: '#EA7C2B' },
}

export default function Dashboard() {
  const [polls , setPolls] = useState<Poll[]>([])
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null)
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)


  const fetchPolls = async () => {
    try {
      const {data} = await api.get('/polls')
      console.log('polls data:', data)  // ← add this

      setPolls(data)
    } catch (error) {
      console.error('Error fetching polls:', error)
    }
    
  }
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchPolls()
    }, 0)

    return () => window.clearTimeout(timer)
  }, [])

  const handleShare = (id: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/poll/${id}`)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  useEffect(() => {
    if (!deleteTarget) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !deleteSubmitting) setDeleteTarget(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [deleteTarget, deleteSubmitting])

  const openDeletePoll = (poll: Poll) => {
    setDeleteTarget({ id: poll.id, title: poll.title })
  }

  const closeDeletePoll = () => {
    if (!deleteSubmitting) setDeleteTarget(null)
  }

  const confirmDeletePoll = async () => {
    if (!deleteTarget) return
    setDeleteSubmitting(true)
    try {
      await api.delete(`/polls/${deleteTarget.id}`)
      setPolls((prev) => prev.filter((p) => p.id !== deleteTarget.id))
      toast.success('Poll deleted')
      setDeleteTarget(null)
    } catch {
      toast.error('Failed to delete poll')
    } finally {
      setDeleteSubmitting(false)
    }
  }

  


  return (
    <>
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#FAFAF9' }}>
      <Sidebar />

      <main style={{ flex: 1, padding: '40px 48px', overflow: 'auto' }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '16px',
          flexWrap: 'wrap',
          marginBottom: '36px',
        }}>
          <div>
              <h1 style={{
                fontSize: '1.75rem',
                fontWeight: 800,
                color: '#1C1917',
                letterSpacing: '-0.02em',
                marginBottom: '4px',
              }}>
                My Polls
              </h1>
              <p style={{ color: '#57534E', fontSize: '0.9rem' }}>
                {polls.filter(p => p.status === 'active').length} active right now
              </p>
          </div>
          <Link
            to="/polls/create"
            className="btn-coral"
            style={{
              fontWeight: 600,
              fontSize: '0.9rem',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Create New Poll
          </Link>
        </div>

        {polls.length === 0 ? (
          <EmptyState />
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: '20px',
          }}>
            {polls.map((poll, i) => (
              <PollCard
                key={poll.id}
                poll={poll}
                delay={i * 0.05}
                onShare={() => handleShare(poll.id)}
                onDelete={() => openDeletePoll(poll)}
                copied={copiedId === poll.id}
              />
            ))}
          </div>
        )}
      </main>
    </div>

    {deleteTarget ? (
      <div
        role="presentation"
        onClick={closeDeletePoll}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 200,
          backgroundColor: 'rgba(28, 25, 23, 0.45)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
        }}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-poll-dialog-title"
          onClick={(e) => e.stopPropagation()}
          style={{
            width: '100%',
            maxWidth: '420px',
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '28px',
            boxShadow: '0 24px 48px rgba(28, 25, 23, 0.12)',
            border: '1px solid #E7E5E4',
          }}
        >
          <h2
            id="delete-poll-dialog-title"
            style={{
              margin: '0 0 10px',
              fontSize: '1.15rem',
              fontWeight: 800,
              color: '#1C1917',
              letterSpacing: '-0.02em',
            }}
          >
            Delete this poll?
          </h2>
          <p style={{ margin: '0 0 8px', color: '#57534E', fontSize: '0.9rem', lineHeight: 1.55 }}>
            <span style={{ fontWeight: 600, color: '#1C1917' }}>{deleteTarget.title}</span>
            {' '}and all of its responses will be removed permanently. You cannot undo this.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '26px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn-ghost"
              disabled={deleteSubmitting}
              onClick={closeDeletePoll}
              style={{ minWidth: '156px', fontSize: '0.9rem', fontWeight: 600 }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn-danger"
              disabled={deleteSubmitting}
              onClick={() => void confirmDeletePoll()}
              style={{ minWidth: '156px' }}
            >
              {deleteSubmitting ? 'Deleting…' : 'Delete poll'}
            </button>
          </div>
        </div>
      </div>
    ) : null}
    </>
  )
}

function PollCard({
  poll,
  delay,
  onShare,
  onDelete,
  copied,
}: {
  poll: Poll
  delay: number
  onShare: () => void
  onDelete: () => void
  copied: boolean
}) {
  const [deleteHovered, setDeleteHovered] = useState(false)
  const status = statusConfig[poll.status]

  return (
    <div
      className="poll-card-hover animate-fade-in-up"
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 2px 12px rgba(28,25,23,0.07)',
        animationDelay: `${delay}s`,
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
        <h3 style={{
          margin: 0,
          fontSize: '0.95rem',
          fontWeight: 700,
          lineHeight: 1.45,
          flex: 1,
        }}>
          <Link
            to={`/polls/${poll.id}/analytics`}
            style={{
              color: '#1C1917',
              textDecoration: 'none',
              transition: 'color 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#EA7C2B'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#1C1917'
            }}
          >
            {poll.title}
          </Link>
        </h3>
        <span style={{
          padding: '3px 10px',
          borderRadius: '999px',
          backgroundColor: status.bg,
          color: status.color,
          fontSize: '0.75rem',
          fontWeight: 700,
          letterSpacing: '0.02em',
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}>
          {status.label}
        </span>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: '20px', color: '#57534E', fontSize: '0.83rem' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 00-3-3.87"/>
            <path d="M16 3.13a4 4 0 010 7.75"/>
          </svg>
          {(poll.responseCount?? 0).toLocaleString()} responses
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          {new Date(poll.expiresAt).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
            })}
        </span>
      </div>

      {/* Action buttons */}
      <div style={{
        display: 'flex',
        gap: '8px',
        paddingTop: '4px',
        borderTop: '1px solid #E7E5E4',
      }}>
        <ActionButton
          onClick={onShare}
          tooltip={copied ? 'Copied!' : 'Share'}
          showTooltip={copied}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
          </svg>
          Share
        </ActionButton>

        <ActionButton
          onClick={() => {}}
          as={`/polls/${poll.id}/analytics`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="20" x2="18" y2="10"/>
            <line x1="12" y1="20" x2="12" y2="4"/>
            <line x1="6" y1="20" x2="6" y2="14"/>
          </svg>
          Analytics
        </ActionButton>

        <button
          onClick={onDelete}
          onMouseEnter={() => setDeleteHovered(true)}
          onMouseLeave={() => setDeleteHovered(false)}
          style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            padding: '7px 12px', borderRadius: '8px', border: 'none',
            backgroundColor: deleteHovered ? 'rgba(239,68,68,0.08)' : 'transparent',
            color: deleteHovered ? '#EF4444' : 'rgba(87,83,78,0.4)',
            fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer',
            transition: 'all 0.2s ease',
            marginLeft: 'auto',
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
            <path d="M10 11v6M14 11v6"/>
          </svg>
          Delete
        </button>
      </div>
    </div>
  )
}

function ActionButton({
  children,
  onClick,
  tooltip,
  showTooltip,
  as,
}: {
  children: React.ReactNode
  onClick: () => void
  tooltip?: string
  showTooltip?: boolean
  as?: string
}) {
  const style: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: '5px',
    padding: '7px 12px', borderRadius: '8px', border: 'none',
    backgroundColor: 'transparent',
    color: '#57534E',
    fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer',
    transition: 'all 0.2s ease',
    textDecoration: 'none',
    position: 'relative',
  }

  const hoverStyle = (el: HTMLElement, enter: boolean) => {
    el.style.backgroundColor = enter ? '#E7E5E4' : 'transparent'
    el.style.color = enter ? '#1C1917' : '#57534E'
  }

  if (as) {
    return (
      <Link
        to={as}
        style={style}
        onMouseEnter={(e) => hoverStyle(e.currentTarget as HTMLElement, true)}
        onMouseLeave={(e) => hoverStyle(e.currentTarget as HTMLElement, false)}
      >
        {children}
      </Link>
    )
  }

  return (
    <button
      onClick={onClick}
      style={style}
      onMouseEnter={(e) => hoverStyle(e.currentTarget, true)}
      onMouseLeave={(e) => hoverStyle(e.currentTarget, false)}
    >
      {children}
      {showTooltip && tooltip && (
        <span className="tooltip">{tooltip}</span>
      )}
    </button>
  )
}

function EmptyState() {
  return (
    <div className="animate-fade-in-up" style={{
      textAlign: 'center',
      padding: '80px 40px',
    }}>
      <div style={{
        width: '80px', height: '80px',
        borderRadius: '50%',
        backgroundColor: 'rgba(28,25,23,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 24px',
        color: '#57534E',
      }}>
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M9 11l3 3L22 4"/>
          <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
        </svg>
      </div>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1C1917', marginBottom: '8px' }}>
        No polls yet.
      </h3>
      <p style={{ color: '#57534E', fontSize: '0.9rem', marginBottom: '28px' }}>
        Create your first one and start collecting feedback.
      </p>
      <Link
        to="/polls/create"
        className="btn-coral"
        style={{ fontWeight: 600, textDecoration: 'none' }}
      >
        Create your first poll
      </Link>
    </div>
  )
}
