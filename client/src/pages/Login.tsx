import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuthStore } from '../lib/store'
import api from '../lib/api'


export default function Login() {
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [shakeEpoch, setShakeEpoch] = useState(0)

  // hooks must be at top level, never inside functions
  const navigate = useNavigate()
  const { setAccessToken, setUser } = useAuthStore()

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.email.includes('@')) e.email = 'Enter a valid email address.'
    if (!form.password) e.password = 'Password is required.'
    return e
  }

  const handleSubmit = async (ev: React.SyntheticEvent) => {
    ev.preventDefault()
    const e = validate()
    if (Object.keys(e).length) {
      setErrors(e)
      setShakeEpoch((n) => n + 1)
      return
    }
    setErrors({})
    setLoading(true)
    try {
      const { data } = await api.post('/auth/login', {
        email: form.email,
        password: form.password,
      })
      setAccessToken(data.accessToken)
      setUser(data.user)
      toast.success('Welcome back!')
      navigate('/dashboard')
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { error?: string } } }).response?.data?.error || 'Invalid email or password'
      toast.error(message)
      setShakeEpoch((n) => n + 1)
    } finally {
      setLoading(false)
    }
  }

  const emailFilled = form.email.trim().length > 0
  const pwdFilled = form.password.length > 0

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#FAFAF9',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
    }}>
      <div
        className="animate-scale-in"
        style={{
          width: '100%',
          maxWidth: '420px',
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          padding: '48px 44px',
          boxShadow: '0 8px 40px rgba(28,25,23,0.12)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{
            width: '44px', height: '44px',
            borderRadius: '12px',
            backgroundColor: '#1C1917',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <svg width="22" height="22" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="3" fill="#EA7C2B"/>
              <circle cx="8" cy="8" r="6" stroke="#EA7C2B" strokeWidth="1.5" strokeOpacity="0.4" fill="none"/>
            </svg>
          </div>
          <h1 style={{
            fontSize: '1.5rem',
            fontWeight: 800,
            color: '#1C1917',
            letterSpacing: '-0.02em',
            marginBottom: '6px',
          }}>Welcome back</h1>
          <p style={{ color: '#57534E', fontSize: '0.9rem' }}>Sign in to your Ripple account.</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className={`field ${emailFilled ? 'field--filled' : ''}`}>
            <label className="field__label">Email address</label>
            <input
              key={errors.email ? `email-shake-${shakeEpoch}` : 'email'}
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className={`input-field${errors.email ? ' input-field--error' : ''}`}
              style={{ padding: '11px 14px', borderRadius: '10px', fontSize: '0.95rem' }}
              aria-invalid={!!errors.email}
            />
            {errors.email && (
              <p className="animate-slide-down" style={{ color: '#EF4444', fontSize: '0.8rem', marginTop: '5px', fontWeight: 500 }}>
                {errors.email}
              </p>
            )}
          </div>

          <div className={`field ${pwdFilled ? 'field--filled' : ''}`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0' }}>
              <label className="field__label" style={{ marginBottom: 0 }}>Password</label>
              <button
                type="button"
                style={{ background: 'none', border: 'none', color: '#EA7C2B', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', padding: 0 }}
              >
                Forgot?
              </button>
            </div>
            <div className="field__control" style={{ position: 'relative', marginTop: '7px' }}>
              <input
                key={errors.password ? `pwd-shake-${shakeEpoch}` : 'pwd'}
                type={showPassword ? 'text' : 'password'}
                placeholder="Your password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className={`input-field${errors.password ? ' input-field--error' : ''}`}
                style={{ padding: '11px 42px 11px 14px', borderRadius: '10px', fontSize: '0.95rem' }}
                aria-invalid={!!errors.password}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: '#57534E',
                  padding: '4px', display: 'flex', alignItems: 'center', transition: 'color 0.2s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#1C1917')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#57534E')}
              >
                {showPassword ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
            {errors.password && (
              <p className="animate-slide-down" style={{ color: '#EF4444', fontSize: '0.8rem', marginTop: '5px', fontWeight: 500 }}>
                {errors.password}
              </p>
            )}
          </div>

          <button
            type="submit"
            className={`btn-coral${loading ? ' btn-coral--loading' : ''}`}
            disabled={loading}
            style={{
              width: '100%',
              fontSize: '1rem',
              fontWeight: 700,
              marginTop: '4px',
            }}
          >
            <span className="btn-coral__label">Sign in</span>
            <span className="btn-coral__spinner" aria-hidden>
              <Spinner />
            </span>
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', color: '#57534E', fontSize: '0.88rem' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: '#EA7C2B', fontWeight: 600, textDecoration: 'none' }}>
            Sign up free
          </Link>
        </p>
      </div>
    </div>
  )
}

function Spinner() {
  return (
    <svg className="icon-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
    </svg>
  )
}

