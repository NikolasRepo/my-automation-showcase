import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import styles from './Login.module.css'

export default function Confirm() {
  const [searchParams] = useSearchParams()
  const [form, setForm] = useState({
    email: searchParams.get('email') || '',
    code: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)
  const navigate = useNavigate()

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  async function handleSubmit() {
    if (!form.email || !form.code) {
      setError('Please enter your email and verification code.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, code: form.code }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Confirmation failed')
      navigate('/login')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    setResending(true)
    try {
      await fetch('/api/auth/resend-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email }),
      })
      setResent(true)
    } catch (err) {
      setError('Failed to resend code.')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.brand}>TaskBeam</div>
        <h1 className={styles.title}>Verify your email</h1>
        <p className={styles.sub}>Enter the 6-digit code we sent to your email address.</p>

        <div className={styles.formGroup}>
          <label className={styles.label}>Email</label>
          <input
            className={styles.input}
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="you@example.com"
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Verification code</label>
          <input
            className={styles.input}
            name="code"
            value={form.code}
            onChange={handleChange}
            placeholder="123456"
            autoFocus
          />
        </div>

        {error && <div className={styles.error}>{error}</div>}
        {resent && <div className={styles.success}>Code resent — check your email.</div>}

        <button
          className={styles.btnPrimary}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? 'Verifying...' : 'Verify email'}
        </button>

        <p className={styles.footer}>
          Didn't get a code?{' '}
          <button
            className={styles.link}
            onClick={handleResend}
            disabled={resending}
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
          >
            {resending ? 'Sending...' : 'Resend code'}
          </button>
        </p>

        <p className={styles.footer}>
          <Link to="/login" className={styles.link}>Back to sign in</Link>
        </p>
      </div>
    </div>
  )
}