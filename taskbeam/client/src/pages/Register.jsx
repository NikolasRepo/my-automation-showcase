import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import styles from './Login.module.css'

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [registered, setRegistered] = useState(false)
  const navigate = useNavigate()

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  async function handleSubmit() {
    if (!form.name || !form.email || !form.password || !form.confirmPassword) {
      setError('Please fill in all fields.')
      return
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          name: form.name,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Registration failed')
      setRegistered(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (registered) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.brand}>TaskBeam</div>
          <h1 className={styles.title}>Check your email</h1>
          <p className={styles.sub}>
            We sent a verification code to {form.email}. Enter it below to activate your account.
          </p>
          <button
            className={styles.btnPrimary}
            onClick={() => navigate(`/confirm?email=${encodeURIComponent(form.email)}`)}
          >
            Enter verification code
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.brand}>TaskBeam</div>
        <h1 className={styles.title}>Create account</h1>
        <p className={styles.sub}>Contractor accounts only. Clients are invited by their contractor.</p>

        <div className={styles.formGroup}>
          <label className={styles.label}>Full name</label>
          <input
            className={styles.input}
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="John Smith"
            autoFocus
          />
        </div>

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
          <label className={styles.label}>Password</label>
          <input
            className={styles.input}
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Min 8 characters, upper, lower, number"
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Confirm password</label>
          <input
            className={styles.input}
            name="confirmPassword"
            type="password"
            value={form.confirmPassword}
            onChange={handleChange}
            placeholder="••••••••"
          />
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <button
          className={styles.btnPrimary}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? 'Creating account...' : 'Create account'}
        </button>

        <p className={styles.footer}>
          Already have an account?{' '}
          <Link to="/login" className={styles.link}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}