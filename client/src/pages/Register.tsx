import { useState } from 'react'
import { Link , useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuthStore } from '../lib/store'
import api from '../lib/api'

export default function Register() {
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [shakeEpoch, setShakeEpoch] = useState(0)
  const navigate = useNavigate()
  const { setAccessToken, setUser } = useAuthStore()

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Name is required.'
    if (!form.email.includes('@')) e.email = 'Enter a valid email.'
    if (form.password.length < 8) e.password = 'Password must be at least 8 characters.'
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
      const {data} = await api.post('/auth/register', {
        name: form.name,
        email: form.email,
        password: form.password,
      })
      setAccessToken(data.accessToken)
      setUser(data.user)
      toast.success('Account created successfully!')
      navigate('/dashboard')
    } catch (err : unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const message = (err as any).response?.data?.error || 'Registration failed'
      toast.error(message)

    }
    finally {
      setLoading(false)
      setSuccess(true)
    }

    
  }

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
          maxWidth: '440px',
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          padding: '48px 44px',
          boxShadow: '0 8px 40px rgba(28,25,23,0.12)',
        }}
      >
        {/* Logo */}
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
          }}>Create your account</h1>
          <p style={{ color: '#57534E', fontSize: '0.9rem' }}>Join Ripple and start collecting feedback.</p>
        </div>

        {success ? (
          <div className="animate-scale-in" style={{
            textAlign: 'center',
            padding: '24px 0',
          }}>
            <div className="animate-check-bounce" style={{
              width: '56px', height: '56px',
              borderRadius: '50%',
              backgroundColor: 'rgba(16,185,129,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <h2 style={{ color: '#1C1917', fontWeight: 700, marginBottom: '8px' }}>You're in!</h2>
            <p style={{ color: '#57534E', fontSize: '0.9rem' }}>
              Account created. <Link to="/login" style={{ color: '#EA7C2B', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link> to continue.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <Field
              label="Full name"
              type="text"
              placeholder="Your name"
              value={form.name}
              onChange={(v) => setForm({ ...form, name: v })}
              error={errors.name}
              shakeEpoch={shakeEpoch}
            />
            <Field
              label="Email address"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(v) => setForm({ ...form, email: v })}
              error={errors.email}
              shakeEpoch={shakeEpoch}
            />
            <PasswordField
              label="Password"
              placeholder="8+ characters"
              value={form.password}
              onChange={(v) => setForm({ ...form, password: v })}
              show={showPassword}
              onToggle={() => setShowPassword(!showPassword)}
              error={errors.password}
              shakeEpoch={shakeEpoch}
            />

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
              <span className="btn-coral__label">Create account</span>
              <span className="btn-coral__spinner" aria-hidden>
                <Spinner />
              </span>
            </button>
          </form>
        )}

        {!success && (
          <p style={{ textAlign: 'center', marginTop: '24px', color: '#57534E', fontSize: '0.88rem' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#EA7C2B', fontWeight: 600, textDecoration: 'none' }}>
              Log in
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}

function Field({
  label,
  type,
  placeholder,
  value,
  onChange,
  error,
  shakeEpoch,
}: {
  label: string
  type: string
  placeholder: string
  value: string
  onChange: (v: string) => void
  error?: string
  shakeEpoch: number
}) {
  const filled = value.trim().length > 0
  return (
    <div className={`field ${filled ? 'field--filled' : ''}`}>
      <label className="field__label">{label}</label>
      <input
        key={error ? `${label}-shake-${shakeEpoch}` : label}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`input-field${error ? ' input-field--error' : ''}`}
        style={{
          padding: '11px 14px',
          borderRadius: '10px',
          fontSize: '0.95rem',
        }}
        aria-invalid={!!error}
      />
      {error && (
        <p className="animate-slide-down" style={{
          color: '#EF4444',
          fontSize: '0.8rem',
          marginTop: '5px',
          fontWeight: 500,
        }}>
          {error}
        </p>
      )}
    </div>
  )
}

function PasswordField({
  label,
  placeholder,
  value,
  onChange,
  show,
  onToggle,
  error,
  shakeEpoch,
}: {
  label: string
  placeholder: string
  value: string
  onChange: (v: string) => void
  show: boolean
  onToggle: () => void
  error?: string
  shakeEpoch: number
}) {
  const filled = value.length > 0
  return (
    <div className={`field ${filled ? 'field--filled' : ''}`}>
      <label className="field__label">{label}</label>
      <div className="field__control" style={{ position: 'relative' }}>
        <input
          key={error ? `${label}-shake-${shakeEpoch}` : `${label}-pwd`}
          type={show ? 'text' : 'password'}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`input-field${error ? ' input-field--error' : ''}`}
          style={{
            padding: '11px 42px 11px 14px',
            borderRadius: '10px',
            fontSize: '0.95rem',
          }}
          aria-invalid={!!error}
        />
        <button
          type="button"
          onClick={onToggle}
          style={{
            position: 'absolute',
            right: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#57534E',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            transition: 'color 0.2s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#1C1917')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#57534E')}
        >
          {show ? (
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
      {error && (
        <p className="animate-slide-down" style={{
          color: '#EF4444',
          fontSize: '0.8rem',
          marginTop: '5px',
          fontWeight: 500,
        }}>
          {error}
        </p>
      )}
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
