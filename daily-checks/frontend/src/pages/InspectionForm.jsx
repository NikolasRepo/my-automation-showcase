// frontend/src/pages/InspectionForm.jsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getLines, submitInspection } from '../api/inspections'
import { PassFailItem, NumericItem } from '../components/ChecklistItem'
import { format } from 'date-fns'

// Change 1: Removed shift times
const SHIFTS = [
  { value: '1st Shift', label: '1st Shift' },
  { value: '2nd Shift', label: '2nd Shift' },
  { value: '3rd Shift', label: '3rd Shift' },
]

export default function InspectionForm() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [lines, setLines] = useState([])
  const [selectedLine, setSelectedLine] = useState(null)
  const [selectedStation, setSelectedStation] = useState(null) // Change 2: single station selection
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [lineId, setLineId] = useState('')
  const [shift, setShift] = useState('')
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [notes, setNotes] = useState('')
  const [answers, setAnswers] = useState({})

  useEffect(() => {
    getLines().then(r => setLines(r.data)).finally(() => setLoading(false))
  }, [])

  // When line changes, reset station and answers
  useEffect(() => {
    if (!lineId) { setSelectedLine(null); setSelectedStation(null); setAnswers({}); return }
    const line = lines.find(l => l.id === lineId)
    setSelectedLine(line)
    setSelectedStation(null)
    setAnswers({})
  }, [lineId, lines])

  // When station changes, initialise answers for its checklist items
  useEffect(() => {
    if (!selectedStation) { setAnswers({}); return }
    const init = {}
    selectedStation.checklist_items?.forEach(item => {
      init[item.id] = {
        station_id: selectedStation.id,
        pass_fail: null,
        numeric_value: null,
        notes: '',
      }
    })
    setAnswers(init)
  }, [selectedStation])

  const setAnswer = (itemId, field, val) =>
    setAnswers(prev => ({ ...prev, [itemId]: { ...prev[itemId], [field]: val } }))

  const stationItems = selectedStation?.checklist_items
    ?.slice()
    .sort((a, b) => a.display_order - b.display_order) || []

  const completedCount = stationItems.filter(item => {
    const ans = answers[item.id]
    if (item.data_type === 'pass_fail') return ans?.pass_fail !== null && ans?.pass_fail !== undefined
    if (item.data_type === 'numeric') return ans?.numeric_value !== null && ans?.numeric_value !== ''
    return false
  }).length

  const isComplete = () => {
    if (!lineId || !shift || !date || !selectedStation) return false
    return stationItems.every(item => {
      const ans = answers[item.id]
      if (item.data_type === 'pass_fail') return ans?.pass_fail !== null && ans?.pass_fail !== undefined
      if (item.data_type === 'numeric') return ans?.numeric_value !== null && ans?.numeric_value !== ''
      return true
    })
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!isComplete()) { setError('Please complete all checklist items before submitting.'); return }
    setError('')
    setSubmitting(true)
    try {
      const results = stationItems.map(item => ({
        checklist_item_id: item.id,
        station_id: selectedStation.id,
        pass_fail: item.data_type === 'pass_fail' ? answers[item.id]?.pass_fail : null,
        numeric_value: item.data_type === 'numeric' ? parseFloat(answers[item.id]?.numeric_value) : null,
        notes: answers[item.id]?.notes || null,
      }))
      await submitInspection({
        production_line_id: lineId,
        shift,
        inspection_date: date,
        operator_notes: notes || null,
        results,
      })
      navigate('/history', { state: { submitted: true } })
    } catch (err) {
      setError(err.response?.data?.detail || 'Submission failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-ink-400">Loading...</div>
  )

  const sortedStations = selectedLine?.stations
    ?.slice()
    .sort((a, b) => a.display_order - b.display_order) || []

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-ink-900">New Inspection</h1>
        <p className="text-ink-400 text-sm mt-0.5">Select your line, shift, and station, then complete all items</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Header info */}
        <div className="card space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label">Production line</label>
              <select
                className="input"
                value={lineId}
                onChange={e => setLineId(e.target.value)}
                required
              >
                <option value="">Select line...</option>
                {lines.map(l => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Inspection date</label>
              <input
                type="date"
                className="input"
                value={date}
                onChange={e => setDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">Operator</label>
              <input
                type="text"
                className="input bg-surface-50"
                value={user.full_name}
                readOnly
              />
            </div>
          </div>

          {/* Shift selector — Change 1: no times shown */}
          <div>
            <label className="label">Shift</label>
            <div className="grid grid-cols-3 gap-3">
              {SHIFTS.map(s => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setShift(s.value)}
                  className={`p-3 rounded-xl border-2 text-center transition-all duration-150 ${
                    shift === s.value
                      ? 'border-brand-600 bg-brand-50'
                      : 'border-surface-200 hover:border-surface-300 bg-white'
                  }`}
                >
                  <p className={`text-sm font-medium ${shift === s.value ? 'text-brand-700' : 'text-ink-900'}`}>
                    {s.label}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Change 2: Station dropdown */}
          {selectedLine && (
            <div>
              <label className="label">Station</label>
              <select
                className="input"
                value={selectedStation?.id || ''}
                onChange={e => {
                  const station = sortedStations.find(s => s.id === e.target.value)
                  setSelectedStation(station || null)
                }}
                required
              >
                <option value="">Select station...</option>
                {sortedStations.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Progress bar */}
        {selectedStation && stationItems.length > 0 && (
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-surface-200 rounded-full h-2">
              <div
                className="bg-brand-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${stationItems.length ? (completedCount / stationItems.length) * 100 : 0}%` }}
              />
            </div>
            <span className="text-xs text-ink-400 font-mono shrink-0">
              {completedCount}/{stationItems.length}
            </span>
          </div>
        )}

        {/* Checklist for selected station only */}
        {selectedStation ? (
          stationItems.length > 0 ? (
            <div className="card">
              <h2 className="text-sm font-semibold text-ink-500 uppercase tracking-wide mb-2">
                {selectedStation.name}
              </h2>
              {stationItems.map(item => (
                item.data_type === 'pass_fail' ? (
                  <PassFailItem
                    key={item.id}
                    item={item}
                    value={answers[item.id]?.pass_fail ?? null}
                    onChange={val => setAnswer(item.id, 'pass_fail', val)}
                  />
                ) : (
                  <NumericItem
                    key={item.id}
                    item={item}
                    value={answers[item.id]?.numeric_value ?? ''}
                    onChange={val => setAnswer(item.id, 'numeric_value', val)}
                  />
                )
              ))}
            </div>
          ) : (
            <div className="card text-center py-8 text-ink-400">
              <p className="text-sm">No checklist items defined for this station yet.</p>
            </div>
          )
        ) : selectedLine ? (
          <div className="card text-center py-8 text-ink-400">
            <p className="text-sm">Select a station above to load the checklist.</p>
          </div>
        ) : (
          <div className="card text-center py-8 text-ink-400">
            <p className="text-sm">Select a production line above to get started.</p>
          </div>
        )}

        {/* Operator notes */}
        {selectedStation && (
          <div className="card">
            <label className="label">
              Operator notes <span className="text-ink-300 font-normal">(optional)</span>
            </label>
            <textarea
              className="input resize-none"
              rows={3}
              placeholder="Any observations or comments about this station..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>
        )}

        {error && (
          <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl border border-red-100">
            {error}
          </p>
        )}

        {selectedStation && (
          <div className="flex gap-3 justify-end pb-8">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate('/dashboard')}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={submitting || !isComplete()}
            >
              {submitting ? 'Submitting...' : 'Submit inspection'}
            </button>
          </div>
        )}

      </form>
    </div>
  )
}
