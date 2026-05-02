// frontend/src/pages/Dashboard.jsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { listInspections } from '../api/inspections'
import { listAlerts } from '../api/alerts'
import { format } from 'date-fns'

function StatCard({ label, value, sub, accent }) {
  const colors = {
    blue: 'border-t-brand-600',
    green: 'border-t-green-500',
    amber: 'border-t-amber-500',
    red: 'border-t-red-500',
  }
  return (
    <div className={`card border-t-4 ${colors[accent] || colors.blue}`}>
      <p className="text-3xl font-semibold text-ink-900">{value}</p>
      <p className="text-sm font-medium text-ink-700 mt-1">{label}</p>
      {sub && <p className="text-xs text-ink-400 mt-0.5">{sub}</p>}
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const [inspections, setInspections] = useState([])
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      listInspections(),
      user.role !== 'operator' ? listAlerts() : Promise.resolve({ data: [] })
    ]).then(([ins, als]) => {
      setInspections(ins.data)
      setAlerts(als.data)
    }).finally(() => setLoading(false))
  }, [user.role])

  const today = format(new Date(), 'yyyy-MM-dd')
  const todayInspections = inspections.filter(i => i.inspection_date === today)
  const pendingReview = inspections.filter(i => i.status === 'submitted')
  const unackAlerts = alerts.filter(a => !a.acknowledged)
  const recentInspections = inspections.slice(0, 5)

  const shiftBadge = shift => ({
    day: 'badge-info',
    afternoon: 'badge-warning',
    night: 'bg-purple-50 text-purple-700 text-xs font-medium px-2.5 py-1 rounded-full inline-flex items-center',
  }[shift] || 'badge-info')

  const statusBadge = status => ({
    submitted: 'badge-info',
    reviewed: 'badge-pass',
    draft: 'badge-warning',
  }[status] || 'badge-info')

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-ink-400">Loading…</div>
  )

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-ink-900">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user.full_name.split(' ')[0]}
        </h1>
        <p className="text-ink-400 text-sm mt-0.5">{format(new Date(), 'EEEE, MMMM d yyyy')}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Today's inspections" value={todayInspections.length} accent="blue" />
        <StatCard label="Total submitted" value={inspections.length} accent="green" />
        {user.role !== 'operator' && (
          <>
            <StatCard label="Pending review" value={pendingReview.length} sub="awaiting leader sign-off" accent="amber" />
            <StatCard label="Unacknowledged alerts" value={unackAlerts.length} accent="red" />
          </>
        )}
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-medium text-ink-900">Recent inspections</h2>
          <Link to="/history" className="text-sm text-brand-600 hover:text-brand-700 font-medium">
            View all →
          </Link>
        </div>
        {recentInspections.length === 0 ? (
          <div className="text-center py-10 text-ink-400">
            <p className="text-sm">No inspections yet.</p>
            {user.role !== 'leader' && (
              <Link to="/inspect" className="btn-primary inline-block mt-4 text-sm">
                Start first inspection
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y divide-surface-100">
            {recentInspections.map(insp => (
              <Link
                key={insp.id}
                to={`/history/${insp.id}`}
                className="flex items-center justify-between py-3 hover:bg-surface-50 -mx-2 px-2 rounded-lg transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-ink-900">{insp.production_line_name || insp.production_line_id}</p>
                  <p className="text-xs text-ink-400 mt-0.5">{insp.inspection_date}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={shiftBadge(insp.shift)}>{insp.shift}</span>
                  <span className={statusBadge(insp.status)}>{insp.status}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {user.role !== 'operator' && unackAlerts.length > 0 && (
        <div className="card border-l-4 border-l-red-500">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-medium text-ink-900">Active alerts</h2>
            <Link to="/alerts" className="text-sm text-red-600 hover:text-red-700 font-medium">
              Manage alerts →
            </Link>
          </div>
          <div className="space-y-2">
            {unackAlerts.slice(0, 3).map(alert => (
              <div key={alert.id} className="flex items-start gap-3 bg-red-50 rounded-xl px-4 py-3">
                <span className={`mt-0.5 ${alert.severity === 'critical' ? 'badge-fail' : 'badge-warning'}`}>
                  {alert.severity}
                </span>
                <p className="text-sm text-ink-700 flex-1">{alert.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}