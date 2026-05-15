import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../lib/store'
import api from '../lib/api'
import toast from 'react-hot-toast'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const navigate = useNavigate()
  const { accessToken, authHydrated, user, logout } = useAuthStore()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout')
    } catch {
      // still clear local session
    }
    logout()
    toast.success('Signed out')
    navigate('/')
  }

  const isLoggedIn = authHydrated && !!accessToken && !!user

  return (
    <nav style={{
      position: 'fixed',
      top: 0, left: 0, right: 0,
      zIndex: 100,
      backgroundColor: '#FAFAF9',
      borderBottom: scrolled ? '1px solid #E7E5E4' : '1px solid transparent',
      transition: 'border-color 0.3s ease',
      padding: '0 2rem',
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '32px', height: '32px',
            borderRadius: '8px',
            backgroundColor: '#1C1917',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="3" fill="#EA7C2B"/>
              <circle cx="8" cy="8" r="6" stroke="#EA7C2B" strokeWidth="1.5" strokeOpacity="0.4" fill="none"/>
              <circle cx="8" cy="8" r="9" stroke="#EA7C2B" strokeWidth="1" strokeOpacity="0.2" fill="none"/>
            </svg>
          </div>
          <span style={{
            fontSize: '1.25rem',
            fontWeight: 800,
            color: '#1C1917',
            letterSpacing: '-0.02em',
          }}>Ripple</span>
        </Link>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {!authHydrated ? (
            <span style={{ color: '#57534E', fontSize: '0.85rem' }}>Loading…</span>
          ) : isLoggedIn ? (
            <>
              <Link
                to="/dashboard"
                className="btn-ghost"
                style={{ fontSize: '0.95rem', fontWeight: 600, textDecoration: 'none' }}
              >
                Dashboard
              </Link>
              <button
                type="button"
                className="btn-coral"
                onClick={() => void handleLogout()}
                style={{ fontSize: '0.95rem', fontWeight: 600 }}
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-ghost" style={{ fontSize: '0.95rem', fontWeight: 600, textDecoration: 'none' }}>
                Login
              </Link>
              <Link to="/register" className="btn-coral" style={{ fontSize: '0.95rem', fontWeight: 600, textDecoration: 'none' }}>
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
