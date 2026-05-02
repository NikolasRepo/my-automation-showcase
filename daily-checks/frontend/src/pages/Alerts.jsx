// frontend/src/pages/Alerts.jsx
import { useEffect, useState } from 'react'
import { listAlerts, acknowledgeAlert } from '../api/alerts'
import { format } from 'date-fns'

export default function Alerts() {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('unacknowledged')
  const [acknowledging, setAcknowledging] = useState(null)

  useEffect(() => {
    listAlerts(filter === 'unacknowledged').then(r => setAlerts(r.data)).finally(() => setLoading(false))
  }, [filter])

  const handleAcknowledge = async (id) => {
    setAcknowledging(id)
    try {
      const updated = await acknowledgeAlert(id)
      setAlerts(prev => prev.map(a => a.id === id ? updated.data : a))
    } finally {
      setAcknowledging(null)
    }
  }

  const severityStyles = {
    critical: 'badge-fail',
    warning: 'badge-warning',
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-ink-400">Loading alerts…</div>

  const unackCount = alerts.filter(a => !a.acknowledged).length

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink-900">Alerts</h1>
          <p className="text-ink-400 text-sm mt-0.5">
            {unackCount > 0 ? `${unackCount} require attention` : 'All clear'}
          </p>
        </div>
        <div className="flex gap-2">
          {['unacknowledged', 'all'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-sm px-4 py-2 rounded-xl font-medium transition-colors ${
                filter === f ? 'bg-brand-600 text-white' : 'btn-secondary'
              }`}
            >
              {f === 'unacknowledged' ? 'Needs attention' : 'All alerts'}
            </button>
          ))}
        </div>
      </div>

      {alerts.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-4xl mb-3">&#10003;</div>
          <p className="font-medium text-ink-700">No alerts to show</p>
          <p className="text-sm text-ink-400 mt-1">
            {filter === 'unacknowledged' ? 'All alerts have been acknowledged.' : 'No alerts have been generated yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map(alert => (
            <div
              key={alert.id}
              className={`card p-0 overflow-hidden border-l-4 ${
                alert.acknowledged ? 'border-l-surface-200 opacity-60' : alert.severity === 'critical' ? 'border-l-red-500' : 'border-l-amber-400'
              }`}
            >
              <div className="px-5 py-4 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={severityStyles[alert.severity] || 'badge-warning'}>
                      {alert.severity}
                    </span>
                    {alert.acknowledged && (
                      <span className="badge-pass">acknowledged</span>
                    )}
                  </div>
                  <p className="text-sm text-ink-900 font-medium">{alert.message}</p>
                  <p className="text-xs text-ink-400 mt-1 font-mono">
                    {format(new Date(alert.created_at), 'MMM d, yyyy HH:mm')}
                  </p>
                  {alert.acknowledged_at && (
                    <p className="text-xs text-ink-300 mt-0.5">
                      Acknowledged {format(new Date(alert.acknowledged_at), 'MMM d HH:mm')}
                    </p>
                  )}
                </div>
                {!alert.acknowledged && (
                  <button
                    className="btn-secondary text-sm shrink-0"
                    onClick={() => handleAcknowledge(alert.id)}
                    disabled={acknowledging === alert.id}
                  >
                    {acknowledging === alert.id ? 'Saving…' : 'Acknowledge'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
