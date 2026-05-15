import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import { toast } from 'react-hot-toast'
import api from '../lib/api'

interface Option {
  id: string
  text: string
}

interface Question {
  id: string
  text: string
  mandatory: boolean
  options: Option[]
}

interface PollForm {
  title: string
  description: string
  expiresAt: string
  anonymous: boolean
  questions: Question[]
}

const STEPS = ['Poll Details', 'Add Questions', 'Review']

function uid() {
  return Math.random().toString(36).slice(2)
}

function toDatetimeLocalValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const EXPIRY_PRESETS = [
  { label: '5 min', minutes: 5 },
  { label: '15 min', minutes: 15 },
  { label: '1 hr', minutes: 60 },
] as const

const defaultQuestion = (): Question => ({
  id: uid(),
  text: '',
  mandatory: false,
  options: [
    { id: uid(), text: '' },
    { id: uid(), text: '' },
  ],
})

export default function CreatePoll() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<PollForm>({
    title: '',
    description: '',
    expiresAt: '',
    anonymous: false,
    questions: [defaultQuestion()],
  })
  const [submitting, setSubmitting] = useState(false)
  const [stepDir, setStepDir] = useState<'forward' | 'back'>('forward')

  const progress = ((step) / (STEPS.length - 1)) * 100

  const goNext = () => {
    setStepDir('forward')
    setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }
  const goBack = () => {
    setStepDir('back')
    setStep((s) => Math.max(s - 1, 0))
  }

  const handleSubmit = async () => {
  // validate
  if (!form.title.trim()) {
    toast.error('Poll title is required')
    return
  }
  for (const q of form.questions) {
    if (!q.text.trim()) {
      toast.error('All questions must have text')
      return
    }
    const filledOptions = q.options.filter(o => o.text.trim())
    if (filledOptions.length < 2) {
      toast.error('Each question needs at least 2 options')
      return
    }
  }

  setSubmitting(true)
  try {
    const payload = {
      title: form.title,
      description: form.description || undefined,
      isAnonymous: form.anonymous,
      expiresAt: form.expiresAt 
        ? new Date(form.expiresAt).toISOString()
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      questions: form.questions.map(q => ({
        questionText: q.text,
        isMandatory: q.mandatory,
        options: q.options
          .filter(o => o.text.trim())
          .map(o => ({ optionText: o.text }))
      }))
    }

    await api.post('/polls', payload)
    

    toast.success('Poll created!')
    navigate('/dashboard')
  } catch (err: unknown) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const message = (err as any).response?.data?.error || 'Failed to create poll'
    toast.error(message)
  } finally {
    setSubmitting(false)
  }
}

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#FAFAF9' }}>
      <Sidebar />

      <main style={{ flex: 1, padding: '40px 48px', overflow: 'auto' }}>
        <div style={{ maxWidth: '680px', margin: '0 auto' }}>

          {/* Progress bar + step indicators */}
          <div style={{ marginBottom: '48px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              {STEPS.map((label, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                  <div style={{
                    width: '32px', height: '32px',
                    borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.8rem', fontWeight: 700,
                    transition: 'all 0.3s ease',
                    backgroundColor: i < step ? '#EA7C2B' : i === step ? 'transparent' : 'transparent',
                    border: i < step ? '2px solid #EA7C2B' : i === step ? '2px solid #EA7C2B' : '2px solid #E7E5E4',
                    color: i < step ? '#ffffff' : i === step ? '#EA7C2B' : '#57534E',
                    flexShrink: 0,
                  }}>
                    {i < step ? (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    ) : (i + 1)}
                  </div>
                  <span style={{
                    fontSize: '0.82rem',
                    fontWeight: i === step ? 700 : 500,
                    color: i === step ? '#1C1917' : '#57534E',
                    transition: 'all 0.3s ease',
                    flex: 1,
                  }}>
                    {label}
                  </span>
                  {i < STEPS.length - 1 && (
                    <div style={{
                      height: '2px',
                      flex: 1,
                      backgroundColor: i < step ? '#EA7C2B' : '#E7E5E4',
                      transition: 'background-color 0.4s ease',
                      borderRadius: '2px',
                    }} />
                  )}
                </div>
              ))}
            </div>
            <div style={{ height: '4px', backgroundColor: '#E7E5E4', borderRadius: '999px', overflow: 'hidden' }}>
              <div
                className="progress-bar-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Step content — slide by direction */}
          <div
            key={step}
            className={stepDir === 'forward' ? 'animate-wizard-forward' : 'animate-wizard-back'}
          >
            {step === 0 && <StepDetails form={form} setForm={setForm} />}
            {step === 1 && <StepQuestions form={form} setForm={setForm} />}
            {step === 2 && <StepReview form={form} />}
          </div>

          {/* Navigation */}
          <div style={{
            display: 'flex',
            justifyContent: step === 0 ? 'flex-end' : 'space-between',
            marginTop: '40px',
            paddingTop: '28px',
            borderTop: '1px solid #E7E5E4',
            gap: '12px',
          }}>
            {step > 0 && (
              <button
                onClick={goBack}
                className="btn-ghost"
                style={{ fontWeight: 600, fontSize: '0.95rem' }}
              >
                Go back
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button
                onClick={goNext}
                className="btn-coral"
                style={{ fontWeight: 700, fontSize: '0.95rem' }}
              >
                Continue
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className={`btn-coral${submitting ? ' btn-coral--loading' : ''}`}
                disabled={submitting}
                style={{
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  minWidth: '260px',
                }}
              >
                <span className="btn-coral__label">Looks good! Create poll →</span>
                <span className="btn-coral__spinner" aria-hidden>
                  <Spinner />
                </span>
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

/* ── Step 1: Poll Details ── */
function StepDetails({ form, setForm }: { form: PollForm; setForm: (f: PollForm) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <div>
        <h2 style={{
          fontSize: '1.6rem', fontWeight: 800, color: '#1C1917',
          letterSpacing: '-0.02em', marginBottom: '8px',
        }}>
          What's your poll about?
        </h2>
        <p style={{ color: '#57534E', fontSize: '0.9rem' }}>
          Give it a clear title so respondents know what to expect.
        </p>
      </div>

      <div>
        <label style={labelStyle}>Poll title</label>
        <input
          type="text"
          placeholder="e.g. Team lunch preferences"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="input-field"
          style={{ ...inputStyle, fontSize: '1.05rem', fontWeight: 500 }}
        />
      </div>

      <div>
        <label style={labelStyle}>Description <OptionalBadge /></label>
        <textarea
          placeholder="Any context that helps people respond better..."
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={3}
          className="input-field"
          style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.7 }}
        />
      </div>

      <div>
        <label style={labelStyle}>Expiry time <OptionalBadge /></label>
        <input
          type="datetime-local"
          value={form.expiresAt}
          onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
          className="input-field"
          style={{ ...inputStyle, marginBottom: '12px' }}
        />
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {EXPIRY_PRESETS.map(({ label, minutes }) => {
            const presetValue = toDatetimeLocalValue(new Date(Date.now() + minutes * 60 * 1000))
            const isSelected = form.expiresAt === presetValue
            return (
              <button
                key={label}
                type="button"
                onClick={() => setForm({ ...form, expiresAt: presetValue })}
                style={{
                  padding: '8px 14px',
                  borderRadius: '999px',
                  border: isSelected ? '2px solid #EA7C2B' : '1.5px solid #E7E5E4',
                  backgroundColor: isSelected ? 'rgba(234,124,43,0.1)' : '#ffffff',
                  color: isSelected ? '#EA7C2B' : '#57534E',
                  fontSize: '0.82rem',
                  fontWeight: isSelected ? 600 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '18px 20px',
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: '1.5px solid #E7E5E4',
      }}>
        <div>
          <div style={{ fontWeight: 600, color: '#1C1917', fontSize: '0.9rem', marginBottom: '3px' }}>
            Anonymous responses
          </div>
          <div style={{ color: '#57534E', fontSize: '0.82rem' }}>
            Respondents won't be identified by name or email.
          </div>
        </div>
        <Toggle
          active={form.anonymous}
          onToggle={() => setForm({ ...form, anonymous: !form.anonymous })}
        />
      </div>
    </div>
  )
}

/* ── Step 2: Questions ── */
function StepQuestions({ form, setForm }: { form: PollForm; setForm: (f: PollForm) => void }) {
  const addQuestion = () => {
    setForm({ ...form, questions: [...form.questions, defaultQuestion()] })
  }

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setForm({
      ...form,
      questions: form.questions.map((q) => (q.id === id ? { ...q, ...updates } : q)),
    })
  }

  const removeQuestion = (id: string) => {
    if (form.questions.length <= 1) return
    setForm({ ...form, questions: form.questions.filter((q) => q.id !== id) })
  }

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <h2 style={{
          fontSize: '1.6rem', fontWeight: 800, color: '#1C1917',
          letterSpacing: '-0.02em', marginBottom: '8px',
        }}>
          Build your questions
        </h2>
        <p style={{ color: '#57534E', fontSize: '0.9rem' }}>
          Add as many questions as you need. Drag to reorder.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {form.questions.map((q, i) => (
          <QuestionCard
            key={q.id}
            question={q}
            index={i}
            onUpdate={(updates) => updateQuestion(q.id, updates)}
            onRemove={() => removeQuestion(q.id)}
            canRemove={form.questions.length > 1}
          />
        ))}
      </div>

      <button
        onClick={addQuestion}
        style={{
          marginTop: '16px',
          width: '100%',
          padding: '14px',
          borderRadius: '12px',
          border: '2px dashed #E7E5E4',
          backgroundColor: 'transparent',
          color: '#1C1917',
          fontWeight: 600,
          fontSize: '0.9rem',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = '#1C1917'
          e.currentTarget.style.backgroundColor = 'rgba(28,25,23,0.03)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = '#E7E5E4'
          e.currentTarget.style.backgroundColor = 'transparent'
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Add Question
      </button>
    </div>
  )
}

function QuestionCard({
  question,
  index,
  onUpdate,
  onRemove,
  canRemove,
}: {
  question: Question
  index: number
  onUpdate: (u: Partial<Question>) => void
  onRemove: () => void
  canRemove: boolean
}) {
  const addOption = () => {
    onUpdate({ options: [...question.options, { id: uid(), text: '' }] })
  }

  const updateOption = (id: string, text: string) => {
    onUpdate({ options: question.options.map((o) => (o.id === id ? { ...o, text } : o)) })
  }

  const removeOption = (id: string) => {
    if (question.options.length <= 2) return
    onUpdate({ options: question.options.filter((o) => o.id !== id) })
  }

  return (
    <div style={{
      backgroundColor: '#ffffff',
      borderRadius: '14px',
      padding: '22px',
      boxShadow: '0 2px 10px rgba(28,25,23,0.07)',
    }}>
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'flex-start' }}>
        <div style={{ color: '#E7E5E4', cursor: 'grab', paddingTop: '10px', flexShrink: 0 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="8" cy="6" r="1.5"/><circle cx="16" cy="6" r="1.5"/>
            <circle cx="8" cy="12" r="1.5"/><circle cx="16" cy="12" r="1.5"/>
            <circle cx="8" cy="18" r="1.5"/><circle cx="16" cy="18" r="1.5"/>
          </svg>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#57534E', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Q{index + 1}
            </span>
            {question.mandatory && (
              <span style={{
                padding: '2px 8px', borderRadius: '999px',
                backgroundColor: 'rgba(234,124,43,0.1)', color: '#EA7C2B',
                fontSize: '0.72rem', fontWeight: 700,
              }}>
                Required
              </span>
            )}
          </div>
          <input
            type="text"
            placeholder="Enter your question..."
            value={question.text}
            onChange={(e) => onUpdate({ text: e.target.value })}
            className="input-field"
            style={{ ...inputStyle, fontWeight: 500 }}
          />
        </div>
        <div style={{ display: 'flex', gap: '6px', paddingTop: '2px', flexShrink: 0 }}>
          <button
            onClick={() => onUpdate({ mandatory: !question.mandatory })}
            title={question.mandatory ? 'Remove required' : 'Make required'}
            style={{
              padding: '6px', borderRadius: '8px', border: 'none',
              backgroundColor: question.mandatory ? 'rgba(234,124,43,0.1)' : 'transparent',
              color: question.mandatory ? '#EA7C2B' : '#57534E',
              cursor: 'pointer', transition: 'all 0.2s ease', display: 'flex',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </button>
          {canRemove && (
            <button
              onClick={onRemove}
              style={{
                padding: '6px', borderRadius: '8px', border: 'none',
                backgroundColor: 'transparent', color: '#57534E',
                cursor: 'pointer', transition: 'all 0.2s ease', display: 'flex',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.08)'; e.currentTarget.style.color = '#EF4444' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#57534E' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Options */}
      <div style={{ paddingLeft: '26px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {question.options.map((opt) => (
          <div key={opt.id} className="animate-fade-in-up" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2px solid #E7E5E4', flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Option text..."
              value={opt.text}
              onChange={(e) => updateOption(opt.id, e.target.value)}
              className="input-field"
              style={{ ...inputStyle, padding: '8px 12px', borderRadius: '8px', fontSize: '0.88rem', flex: 1 }}
            />
            {question.options.length > 2 && (
              <button
                onClick={() => removeOption(opt.id)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#E7E5E4', padding: '4px', display: 'flex', transition: 'color 0.2s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#EF4444')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#E7E5E4')}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            )}
          </div>
        ))}
        <button
          onClick={addOption}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#57534E', fontSize: '0.82rem', fontWeight: 600,
            padding: '6px 0', textAlign: 'left', transition: 'color 0.2s ease',
            display: 'flex', alignItems: 'center', gap: '6px',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#1C1917')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#57534E')}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add option
        </button>
      </div>
    </div>
  )
}

/* ── Step 3: Review ── */
function StepReview({ form }: { form: PollForm }) {
  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1C1917', letterSpacing: '-0.02em', marginBottom: '8px' }}>
          Review your poll
        </h2>
        <p style={{ color: '#57534E', fontSize: '0.9rem' }}>Everything look right? Create your poll when you're ready.</p>
      </div>

      <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '28px', boxShadow: '0 2px 12px rgba(28,25,23,0.07)' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1C1917', letterSpacing: '-0.01em', marginBottom: '8px' }}>
          {form.title || <span style={{ color: '#E7E5E4' }}>Untitled poll</span>}
        </h3>
        {form.description && (
          <p style={{ color: '#57534E', fontSize: '0.9rem', lineHeight: 1.7, marginBottom: '16px' }}>
            {form.description}
          </p>
        )}
        <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem', color: '#57534E', marginBottom: '24px', flexWrap: 'wrap' }}>
          {form.expiresAt && <span>Expires: {new Date(form.expiresAt).toLocaleDateString()}</span>}
          <span>{form.anonymous ? 'Anonymous' : 'Identified responses'}</span>
          <span>{form.questions.length} question{form.questions.length !== 1 ? 's' : ''}</span>
        </div>

        <div style={{ height: '1px', backgroundColor: '#E7E5E4', marginBottom: '20px' }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {form.questions.map((q, i) => (
            <div key={q.id}>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#57534E' }}>Q{i + 1}</span>
                <span style={{ fontWeight: 600, color: '#1C1917', fontSize: '0.92rem' }}>
                  {q.text || <span style={{ color: '#E7E5E4', fontStyle: 'italic' }}>No question text</span>}
                </span>
                {q.mandatory && (
                  <span style={{ padding: '2px 8px', borderRadius: '999px', backgroundColor: 'rgba(234,124,43,0.1)', color: '#EA7C2B', fontSize: '0.72rem', fontWeight: 700 }}>
                    Required
                  </span>
                )}
              </div>
              <div style={{ paddingLeft: '28px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {q.options.filter(o => o.text).map((o) => (
                  <div key={o.id} style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '0.88rem', color: '#57534E' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#E7E5E4', flexShrink: 0 }} />
                    {o.text}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── Shared sub-components ── */
function Toggle({ active, onToggle }: { active: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`toggle-track${active ? ' active' : ''}`}
      aria-pressed={active}
    >
      <div className="toggle-thumb" />
    </button>
  )
}

function OptionalBadge() {
  return (
    <span style={{ fontSize: '0.72rem', color: '#57534E', fontWeight: 500, marginLeft: '6px' }}>
      optional
    </span>
  )
}

function Spinner() {
  return (
    <svg className="icon-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
    </svg>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.85rem',
  fontWeight: 600,
  color: '#1C1917',
  marginBottom: '8px',
}

const inputStyle: React.CSSProperties = {
  padding: '11px 14px',
  borderRadius: '10px',
  fontSize: '0.92rem',
}
