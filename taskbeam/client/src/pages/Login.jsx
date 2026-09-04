import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import styles from './Login.module.css'

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '', role: '' })
  const [error, setError] = useState('')
  const [roleError, setRoleError] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  function selectRole(role) {
    setForm({ ...form, role })
    setRoleError(false)
  }

  async function handleSubmit() {
    if (!form.role) {
      setRoleError(true)
      return
    }
    if (!form.email || !form.password) {
      setError('Please enter your email and password.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          role: form.role,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Login failed')
      login(data.accessToken, { email: form.email, role: form.role })
      navigate('/')
    } catch (err) {
      if (err.message.includes('Incorrect username or password')) {
        setError('Incorrect email or password. Please try again.')
      } else if (err.message.includes('User is not confirmed')) {
        setError('Please verify your email before signing in.')
      } else {
        setError(err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.brand}>TaskBeam</div>
        <h1 className={styles.title}>Sign in</h1>
        <p className={styles.sub}>Manage your construction projects</p>

        <div className={styles.roleSection}>
          <label className={`${styles.label} ${roleError ? styles.labelError : ''}`}>
            {roleError ? 'Please select a role to continue' : 'Sign in as'}
          </label>
          <div className={styles.roleRow}>
            <button
              className={`${styles.roleBtn} ${form.role === 'contractor' ? styles.roleActive : ''} ${roleError ? styles.roleBtnError : ''}`}
              onClick={() => selectRole('contractor')}
            >
              <span className={styles.roleIcon}>🔨</span>
              <span className={styles.roleLabel}>Contractor</span>
              <span className={styles.roleDesc}>Full access</span>
            </button>
            <button
              className={`${styles.roleBtn} ${form.role === 'client' ? styles.roleActive : ''} ${roleError ? styles.roleBtnError : ''}`}
              onClick={() => selectRole('client')}
            >
              <span className={styles.roleIcon}>👤</span>
              <span className={styles.roleLabel}>Client</span>
              <span className={styles.roleDesc}>View only</span>
            </button>
          </div>
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
            autoFocus
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
            placeholder="••••••••"
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          />
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <button
          className={styles.btnPrimary}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>

        <p className={styles.footer}>
          Don't have an account?{' '}
          <Link to="/register" className={styles.link}>Create one</Link>
        </p>
      </div>
    </div>
  )
}