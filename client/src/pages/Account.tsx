import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import api from '../lib/api'
import { useAuthStore } from '../lib/store'
import toast from 'react-hot-toast'

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '?'
}

export default function Account() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout')
    } catch {
      // clear local session even if request fails
    }
    logout()
    toast.success('Signed out')
    navigate('/')
  }

  if (!user) return null

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#FAFAF9' }}>
      <Sidebar />

      <main style={{ flex: 1, padding: '40px 48px', overflow: 'auto' }}>
        <h1 style={{
          fontSize: '1.75rem',
          fontWeight: 800,
          color: '#1C1917',
          letterSpacing: '-0.02em',
          marginBottom: '32px',
        }}>
          Account
        </h1>

        <div style={{
          maxWidth: '480px',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '32px',
          boxShadow: '0 2px 12px rgba(28,25,23,0.07)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'rgba(234,124,43,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#EA7C2B',
              fontSize: '1.1rem',
              fontWeight: 700,
            }}>
              {getInitials(user.name)}
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#1C1917' }}>{user.name}</p>
              <p style={{ margin: '4px 0 0', fontSize: '0.88rem', color: '#57534E' }}>{user.email}</p>
            </div>
          </div>

          <button
            type="button"
            className="btn-ghost"
            onClick={() => void handleLogout()}
            style={{ fontWeight: 600, fontSize: '0.9rem' }}
          >
            Sign out
          </button>
        </div>
      </main>
    </div>
  )
}
