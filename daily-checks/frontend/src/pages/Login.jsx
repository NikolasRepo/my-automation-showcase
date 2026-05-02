// frontend/src/pages/Login.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getOperators } from '../api/inspections'

export default function Login() {
  const { loginOperator, loginLeader } = useAuth()
  const navigate = useNavigate()

  const [mode, setMode] = useState('operator')
  const [operators, setOperators] = useState([])
  const [selectedName, setSelectedName] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingOperators, setLoadingOperators] = useState(true)

  useEffect(() => {
    getOperators()
      .then(r => setOperators(r.data))
      .catch(() => setOperators([]))
      .finally(() => setLoadingOperators(false))
  }, [])

  const handleOperatorLogin = async e => {
    e.preventDefault()
    if (!selectedName) { setError('Please select your name.'); return }
    setError('')
    setLoading(true)
    try {
      await loginOperator(selectedName)
      navigate('/dashboard')
    } catch {
      setError('Name not found. Please check with your leader.')
    } finally {
      setLoading(false)
    }
  }

  const handleLeaderLogin = async e => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await loginLeader(username, password)
      navigate('/dashboard')
    } catch {
      setError('Incorrect username or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Logo and title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-brand-600 rounded-2xl mb-4">
            <span className="text-white text-xl">&#9642;</span>
          </div>
          <h1 className="text-2xl font-semibold text-ink-900">InspectPro</h1>
          <p className="text-ink-400 text-sm mt-1">Production Inspection System</p>
        </div>

        {/* Mode toggle */}
        <div className="flex rounded-xl border border-surface-200 bg-surface-100 p-1 mb-4">
          <button
            type="button"
            onClick={() => { setMode('operator'); setError('') }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors duration-150 ${
              mode === 'operator'
                ? 'bg-white text-ink-900 shadow-card'
                : 'text-ink-400 hover:text-ink-600'
            }`}
          >
            Operator
          </button>
          <button
            type="button"
            onClick={() => { setMode('leader'); setError('') }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors duration-150 ${
              mode === 'leader'
                ? 'bg-white text-ink-900 shadow-card'
                : 'text-ink-400 hover:text-ink-600'
            }`}
          >
            Leader / Admin
          </button>
        </div>

        <div className="card">

          {/* Operator login — name selector */}
          {mode === 'operator' && (
            <form onSubmit={handleOperatorLogin} className="space-y-4">
              <div>
                <label className="label">Select your name</label>
                {loadingOperators ? (
                  <p className="text-sm text-ink-400">Loading operators...</p>
                ) : (
                  <select
                    className="input"
                    value={selectedName}
                    onChange={e => setSelectedName(e.target.value)}
                    autoFocus
                  >
                    <option value="">Select name...</option>
                    {operators.map(op => (
                      <option key={op.id} value={op.full_name}>
                        {op.full_name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              {error && (
                <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
              )}
              <button
                type="submit"
                className="btn-primary w-full"
                disabled={loading || loadingOperators}
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>
          )}

          {/* Leader / Admin login — email and password */}
          {mode === 'leader' && (
            <form onSubmit={handleLeaderLogin} className="space-y-4">
              <div>
                <label className="label">Username</label>
                <input
                  type="text"
                  className="input"
                  placeholder="your username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="label">Password</label>
                <input
                  type="password"
                  className="input"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>
              {error && (
                <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
              )}
              <button
                type="submit"
                className="btn-primary w-full"
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  )
}