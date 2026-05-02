// frontend/src/pages/Reports.jsx
import { useState } from 'react'
import { format, subDays } from 'date-fns'
import { exportReport } from '../api/reports'

export default function Reports() {
  const [dateFrom, setDateFrom] = useState(format(subDays(new Date(), 7), 'yyyy-MM-dd'))
  const [dateTo, setDateTo] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleExport = async () => {
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      const response = await exportReport(dateFrom, dateTo)
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `inspections_${dateFrom}_to_${dateTo}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      setSuccess('Export downloaded successfully.')
    } catch {
      setError('Export failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink-900">Reports</h1>
        <p className="text-ink-400 text-sm mt-0.5">Export inspection data as Excel spreadsheets</p>
      </div>

      <div className="card space-y-5">
        <h2 className="font-medium text-ink-900">Excel export</h2>
        <p className="text-sm text-ink-500">
          Exports all inspection results within the selected date range, including pass/fail outcomes,
          numeric measurements, flagged items, and submission timestamps. Flagged rows are highlighted in red.
        </p>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">From date</label>
            <input
              type="date"
              className="input"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
            />
          </div>
          <div>
            <label className="label">To date</label>
            <input
              type="date"
              className="input"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
            />
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl">{error}</p>
        )}
        {success && (
          <p className="text-sm text-green-700 bg-green-50 px-4 py-3 rounded-xl">{success}</p>
        )}

        <button className="btn-primary" onClick={handleExport} disabled={loading || !dateFrom || !dateTo}>
          {loading ? 'Generating…' : 'Download Excel report'}
        </button>
      </div>

      <div className="card bg-surface-50">
        <h2 className="font-medium text-ink-900 mb-3">What's included in the export</h2>
        <ul className="text-sm text-ink-500 space-y-1.5">
          {[
            'Inspection date, shift, and production line',
            'Operator name and submission timestamp',
            'Leader review status and notes',
            'Each checklist item with pass/fail or numeric result',
            'Flagged results highlighted in red',
            'All operator and item-level notes',
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-brand-400 mt-0.5">&#10003;</span>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}