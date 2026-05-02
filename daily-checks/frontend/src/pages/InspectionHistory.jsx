// frontend/src/pages/InspectionHistory.jsx
import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { listInspections, reviewInspection } from '../api/inspections'
import { useAuth } from '../context/AuthContext'

const statusColors = {
  draft: 'badge-warning',
  submitted: 'badge-info',
  reviewed: 'badge-pass',
}

const shiftColors = {
  '1st Shift': 'badge-info',
  '2nd Shift': 'badge-warning',
  '3rd Shift': 'bg-purple-50 text-purple-700 text-xs font-medium px-2.5 py-1 rounded-full inline-flex items-center',
}

export default function InspectionHistory() {
  const { user } = useAuth()
  const location = useLocation()
  const [inspections, setInspections] = useState([])
  const [loading, setLoading] = useState(true)
  const [reviewingId, setReviewingId] = useState(null)
  const [reviewNotes, setReviewNotes] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  const [expandedId, setExpandedId] = useState(null)
  const [flash, setFlash] = useState(
    location.state?.submitted ? 'Inspection submitted successfully.' : ''
  )

  useEffect(() => {
    listInspections()
      .then(r => setInspections(r.data))
      .finally(() => setLoading(false))
    if (flash) setTimeout(() => setFlash(''), 4000)
  }, [])

  const handleReview = async id => {
    setSubmittingReview(true)
    try {
      const updated = await reviewInspection(id, { supervisor_notes: reviewNotes || null })
      setInspections(prev => prev.map(i => i.id === id ? updated.data : i))
      setReviewingId(null)
      setReviewNotes('')
    } finally {
      setSubmittingReview(false)
    }
  }

  // Group results by station name for the detail view
  const groupByStation = results => {
    const groups = {}
    results?.forEach(r => {
      const name = r.station?.name || 'General'
      if (!groups[name]) groups[name] = []
      groups[name].push(r)
    })
    return groups
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-ink-400">Loading...</div>
  )

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink-900">Inspection history</h1>
          <p className="text-ink-400 text-sm mt-0.5">{inspections.length} total records</p>
        </div>
        {user.role !== 'leader' && (
          <Link to="/inspect" className="btn-primary text-sm">+ New inspection</Link>
        )}
      </div>

      {flash && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl">
          {flash}
        </div>
      )}

      {inspections.length === 0 ? (
        <div className="card text-center py-12 text-ink-400">
          <p>No inspections found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {inspections.map(insp => (
            <div key={insp.id} className="card p-0 overflow-hidden">

              {/* Main row */}
              <div className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-sm font-medium text-ink-900">
                      {insp.production_line_name || insp.production_line_id}
                    </p>
                    <p className="text-xs text-ink-400 mt-0.5 font-mono">
                      {insp.inspection_date}
                      {insp.submitted_at && (
                        <span className="ml-2">
                          {new Date(insp.submitted_at).toLocaleTimeString([], {
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap justify-end">
                  <span className={shiftColors[insp.shift] || 'badge-info'}>{insp.shift}</span>
                  <span className={statusColors[insp.status] || 'badge-info'}>{insp.status}</span>
                  {insp.operator_name && user.role !== 'operator' && (
                    <span className="text-xs text-ink-300 hidden sm:block">{insp.operator_name}</span>
                  )}
                </div>
              </div>

              {/* Summary bar */}
              <div className="border-t border-surface-100 px-5 py-3 bg-surface-50 flex items-center gap-4 flex-wrap">
                <span className="text-xs text-ink-400">{insp.results?.length || 0} checks</span>
                {insp.results?.filter(r => r.flagged).length > 0 && (
                  <span className="badge-fail">
                    {insp.results.filter(r => r.flagged).length} flagged
                  </span>
                )}
                {insp.operator_notes && (
                  <span className="text-xs text-ink-400 italic truncate max-w-xs">
                    "{insp.operator_notes}"
                  </span>
                )}
                <div className="ml-auto flex items-center gap-2">
                  {/* Expand/collapse results */}
                  <button
                    className="text-xs text-brand-600 hover:text-brand-700 font-medium"
                    onClick={() => setExpandedId(expandedId === insp.id ? null : insp.id)}
                  >
                    {expandedId === insp.id ? 'Hide results ↑' : 'View results ↓'}
                  </button>
                  {/* Leader sign-off button */}
                  {user.role !== 'operator' && insp.status === 'submitted' && (
                    <button
                      className="btn-primary text-xs py-1.5 px-3"
                      onClick={() => setReviewingId(reviewingId === insp.id ? null : insp.id)}
                    >
                      Review & sign off
                    </button>
                  )}
                </div>
                {insp.status === 'reviewed' && insp.supervisor_notes && (
                  <p className="text-xs text-ink-400 w-full mt-1">
                    Leader note: "{insp.supervisor_notes}"
                  </p>
                )}
              </div>

              {/* Expanded results grouped by station */}
              {expandedId === insp.id && insp.results?.length > 0 && (
                <div className="border-t border-surface-100 px-5 py-4 bg-white space-y-4">
                  {Object.entries(groupByStation(insp.results)).map(([stationName, results]) => (
                    <div key={stationName}>
                      <p className="text-xs font-semibold text-ink-500 uppercase tracking-wide mb-2">
                        {stationName}
                      </p>
                      <div className="space-y-1">
                        {results.map(r => (
                          <div
                            key={r.id}
                            className={`flex items-center justify-between py-2 px-3 rounded-lg text-sm ${
                              r.flagged ? 'bg-red-50' : 'bg-surface-50'
                            }`}
                          >
                            <span className="text-ink-700 flex-1">{r.checklist_item?.name}</span>
                            <span className={`font-medium ml-4 shrink-0 ${
                              r.flagged ? 'text-red-600' : 'text-ink-500'
                            }`}>
                              {r.checklist_item?.data_type === 'pass_fail'
                                ? (r.pass_fail === true ? 'Pass' : r.pass_fail === false ? 'Fail' : '—')
                                : `${r.numeric_value ?? '—'} ${r.checklist_item?.unit || ''}`
                              }
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Supervisor review panel */}
              {reviewingId === insp.id && (
                <div className="border-t border-surface-200 px-5 py-4 bg-white space-y-3">
                  <p className="text-sm font-medium text-ink-700">Leader sign-off</p>
                  <textarea
                    className="input resize-none"
                    rows={2}
                    placeholder="Optional notes for this review..."
                    value={reviewNotes}
                    onChange={e => setReviewNotes(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <button
                      className="btn-primary text-sm"
                      onClick={() => handleReview(insp.id)}
                      disabled={submittingReview}
                    >
                      {submittingReview ? 'Saving...' : 'Approve & sign off'}
                    </button>
                    <button
                      className="btn-secondary text-sm"
                      onClick={() => setReviewingId(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

            </div>
          ))}
        </div>
      )}
    </div>
  )
}