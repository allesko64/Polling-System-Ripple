import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '../lib/store'

const navItems = [
  {
    label: 'Home',
    to: '/',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    label: 'My Polls',
    to: '/dashboard',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1"/>
        <rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/>
        <rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
    ),
  },
  {
    label: 'Create Poll',
    to: '/polls/create',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="16"/>
        <line x1="8" y1="12" x2="16" y2="12"/>
      </svg>
    ),
  },
]

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '?'
}

export default function Sidebar() {
  const { pathname } = useLocation()
  const user = useAuthStore((s) => s.user)

  return (
    <aside style={{
      width: '220px',
      minHeight: '100vh',
      backgroundColor: '#1C1917',
      display: 'flex',
      flexDirection: 'column',
      padding: '0',
      flexShrink: 0,
      position: 'sticky',
      top: 0,
      height: '100vh',
    }}>
      <div style={{
        padding: '28px 20px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>
        <div style={{
          width: '28px', height: '28px',
          borderRadius: '7px',
          backgroundColor: 'rgba(234,124,43,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="3" fill="#EA7C2B"/>
            <circle cx="8" cy="8" r="6" stroke="#EA7C2B" strokeWidth="1.5" strokeOpacity="0.5" fill="none"/>
          </svg>
        </div>
        <span style={{
          fontSize: '1.1rem',
          fontWeight: 800,
          color: '#ffffff',
          letterSpacing: '-0.02em',
        }}>Ripple</span>
      </div>

      <nav style={{ flex: 1, padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {navItems.map((item) => {
          const isActive =
            item.to === '/'
              ? pathname === '/'
              : item.to === '/dashboard'
                ? pathname === '/dashboard'
                : pathname === item.to || pathname.startsWith(`${item.to}/`)

          return (
            <Link
              key={item.label}
              to={item.to}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                borderRadius: '10px',
                textDecoration: 'none',
                color: isActive ? '#ffffff' : 'rgba(255,255,255,0.55)',
                backgroundColor: isActive ? 'rgba(234,124,43,0.18)' : 'transparent',
                fontWeight: isActive ? 600 : 400,
                fontSize: '0.9rem',
                transition: 'all 0.2s ease',
                position: 'relative',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.07)'
                  e.currentTarget.style.color = 'rgba(255,255,255,0.85)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.color = 'rgba(255,255,255,0.55)'
                }
              }}
            >
              {isActive && (
                <span style={{
                  position: 'absolute',
                  left: 0,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '3px',
                  height: '20px',
                  backgroundColor: '#EA7C2B',
                  borderRadius: '0 2px 2px 0',
                }} />
              )}
              <span style={{ flexShrink: 0 }}>{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div style={{
        padding: '16px 20px 24px',
        borderTop: '1px solid rgba(255,255,255,0.08)',
      }}>
        {user ? (
          <Link
            to="/account"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              textDecoration: 'none',
              borderRadius: '10px',
              padding: '8px',
              margin: '-8px',
              transition: 'background-color 0.2s ease',
              backgroundColor: pathname === '/account' ? 'rgba(234,124,43,0.18)' : 'transparent',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.07)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <div style={{
              width: '32px', height: '32px',
              borderRadius: '50%',
              backgroundColor: 'rgba(234,124,43,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#EA7C2B',
              fontSize: '0.85rem',
              fontWeight: 700,
              flexShrink: 0,
            }}>
              {getInitials(user.name)}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{
                color: '#ffffff',
                fontSize: '0.85rem',
                fontWeight: 600,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {user.name}
              </div>
              <div style={{
                color: 'rgba(255,255,255,0.4)',
                fontSize: '0.75rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                Account
              </div>
            </div>
          </Link>
        ) : null}
      </div>
    </aside>
  )
}
