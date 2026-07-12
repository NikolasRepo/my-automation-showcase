// frontend/src/pages/AdminPanel.jsx
import { useEffect, useState, useRef } from 'react'
import {
  createLine, updateLine, deactivateLine, deleteLine,
  createStation, updateStation, deactivateStation, deleteStation,
  createChecklistItem, updateChecklistItem, deactivateChecklistItem, deleteChecklistItem,
  listUsers, createUser, updateUser, resetPassword, deactivateUser, deleteUser,
} from '../api/admin'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'

const ALL_TABS = ['Lines', 'Stations', 'Checklist Items', 'Users', 'Import']

// ─── Reusable form field components ──────────────────────────────────────────

function Field({ label, children }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  )
}

function FormError({ error }) {
  if (!error) return null
  return <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
}

// ─── Lines tab ────────────────────────────────────────────────────────────────

function LinesTab() {
  const [lines, setLines] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ name: '', description: '', supervisor_email: '' })
  const [newForm, setNewForm] = useState({ name: '', description: '', supervisor_email: '' })
  const [error, setError] = useState('')
  const [newError, setNewError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get('/admin/lines')
      .then(r => setLines(r.data))
      .finally(() => setLoading(false))
  }, [])

  const startEdit = line => {
    setEditingId(line.id)
    setForm({ name: line.name, description: line.description || '', supervisor_email: line.supervisor_email || '' })
    setError('')
  }

  const handleUpdate = async id => {
    setSaving(true)
    try {
      const updated = await updateLine(id, form)
      setLines(prev => prev.map(l => l.id === id ? updated.data : l))
      setEditingId(null)
    } catch (e) {
      setError(e.response?.data?.detail || 'Update failed.')
    } finally {
      setSaving(false)
    }
  }

  const handleDeactivate = async id => {
    try {
      const response = await deactivateLine(id)
      const updated = response.data
      setLines(prev => prev.map(l => l.id === updated.id ? updated : l))
    } catch (e) {
      console.error('Deactivate failed:', e)
    }
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Permanently delete "${name}"? This cannot be undone.`)) return
    try {
      await deleteLine(id)
      setLines(prev => prev.filter(l => l.id !== id))
    } catch (e) {
      alert(e.response?.data?.detail || 'Delete failed.')
    }
  }

  const handleCreate = async e => {
    e.preventDefault()
    setSaving(true)
    try {
      const created = await createLine(newForm)
      setLines(prev => [...prev, created.data])
      setNewForm({ name: '', description: '', supervisor_email: '' })
      setNewError('')
    } catch (e) {
      setNewError(e.response?.data?.detail || 'Creation failed.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-ink-400 text-sm">Loading lines...</p>

  return (
    <div className="space-y-6">
      {/* Existing lines */}
      <div className="space-y-3">
        {lines.map(line => (
          <div key={line.id} className={`card p-0 overflow-hidden ${!line.is_active ? 'opacity-50' : ''}`}>
            {editingId === line.id ? (
              <div className="px-5 py-4 space-y-3">
                <Field label="Line name">
                  <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </Field>
                <Field label="Description">
                  <input className="input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                </Field>
                <Field label="Leader email (optional — for alert notifications)">
                  <input className="input" type="email" value={form.supervisor_email} onChange={e => setForm(f => ({ ...f, supervisor_email: e.target.value }))} />
                </Field>
                <FormError error={error} />
                <div className="flex gap-2">
                  <button className="btn-primary text-sm" onClick={() => handleUpdate(line.id)} disabled={saving}>
                    {saving ? 'Saving...' : 'Save changes'}
                  </button>
                  <button className="btn-secondary text-sm" onClick={() => setEditingId(null)}>Cancel</button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="text-sm font-medium text-ink-900">{line.name}</p>
                  <p className="text-xs text-ink-400 mt-0.5">
                    {line.supervisor_email || 'No leader email set'}
                    {line.description ? ` — ${line.description}` : ''}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button className="btn-secondary text-xs py-1.5 px-3" onClick={() => startEdit(line)}>Edit</button>
                  <button
                    className={`text-xs py-1.5 px-3 rounded-xl font-medium border transition-colors ${line.is_active ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-green-200 text-green-600 hover:bg-green-50'}`}
                    onClick={() => handleDeactivate(line.id)}
                  >
                    {line.is_active ? 'Deactivate' : 'Reactivate'}
                  </button>
                  <button
                    className="text-xs py-1.5 px-3 rounded-xl font-medium border border-red-300 text-red-700 hover:bg-red-100 transition-colors"
                    onClick={() => handleDelete(line.id, line.name)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add new line */}
      <div className="card border-dashed border-2 border-surface-300">
        <h3 className="font-medium text-ink-900 mb-4">Add new line</h3>
        <form onSubmit={handleCreate} className="space-y-3">
          <Field label="Line name">
            <input className="input" placeholder="e.g. Line D" value={newForm.name} onChange={e => setNewForm(f => ({ ...f, name: e.target.value }))} required />
          </Field>
          <Field label="Description">
            <input className="input" placeholder="Optional description" value={newForm.description} onChange={e => setNewForm(f => ({ ...f, description: e.target.value }))} />
          </Field>
          <Field label="Leader email (optional — for alert notifications)">
            <input className="input" type="email" placeholder="leader@yourcompany.com" value={newForm.supervisor_email} onChange={e => setNewForm(f => ({ ...f, supervisor_email: e.target.value }))} />
          </Field>
          <FormError error={newError} />
          <button type="submit" className="btn-primary text-sm" disabled={saving}>
            {saving ? 'Adding...' : 'Add line'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── Stations tab ─────────────────────────────────────────────────────────────

function StationsTab({ lines }) {
  const [stations, setStations] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ name: '', description: '', display_order: 0 })
  const [newForm, setNewForm] = useState({ production_line_id: '', name: '', description: '', display_order: 0 })
  const [error, setError] = useState('')
  const [newError, setNewError] = useState('')
  const [saving, setSaving] = useState(false)
  const [filterLineId, setFilterLineId] = useState('')

  useEffect(() => {
    api.get('/admin/stations', { params: filterLineId ? { line_id: filterLineId } : {} })
      .then(r => setStations(r.data.sort((a, b) => a.display_order - b.display_order)))
      .finally(() => setLoading(false))
  }, [filterLineId])

  const startEdit = s => {
    setEditingId(s.id)
    setForm({ name: s.name, description: s.description || '', display_order: s.display_order })
    setError('')
  }

  const handleUpdate = async id => {
    setSaving(true)
    try {
      const updated = await updateStation(id, form)
      setStations(prev => prev.map(s => s.id === id ? updated.data : s))
      setEditingId(null)
    } catch (e) {
      setError(e.response?.data?.detail || 'Update failed.')
    } finally {
      setSaving(false)
    }
  }

  const handleDeactivate = async id => {
    try {
      const response = await deactivateStation(id)
      const updated = response.data
      setStations(prev => prev.map(s => s.id === id ? { ...s, is_active: updated.is_active } : s))
    } catch (e) {
      console.error('Deactivate failed:', e)
    }
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Permanently delete "${name}"? This cannot be undone.`)) return
    try {
      await deleteStation(id)
      setStations(prev => prev.filter(s => s.id !== id))
    } catch (e) {
      alert(e.response?.data?.detail || 'Delete failed.')
    }
  }

  const handleCreate = async e => {
    e.preventDefault()
    setSaving(true)
    try {
      const created = await createStation(newForm)
      setStations(prev => [...prev, created.data])
      setNewForm({ production_line_id: '', name: '', description: '', display_order: 0 })
      setNewError('')
    } catch (e) {
      setNewError(e.response?.data?.detail || 'Creation failed.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-ink-400 text-sm">Loading stations...</p>

  return (
    <div className="space-y-6">
      {/* Filter by line */}
      <div>
        <label className="label">Filter by line</label>
        <select className="input max-w-xs" value={filterLineId} onChange={e => setFilterLineId(e.target.value)}>
          <option value="">All lines</option>
          {lines.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
      </div>

      {/* Existing stations */}
      <div className="space-y-3">
        {stations.map(station => (
          <div key={station.id} className={`card p-0 overflow-hidden ${!station.is_active ? 'opacity-50' : ''}`}>
            {editingId === station.id ? (
              <div className="px-5 py-4 space-y-3">
                <Field label="Station name">
                  <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </Field>
                <Field label="Description">
                  <input className="input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                </Field>
                <Field label="Display order">
                  <input className="input" type="number" value={form.display_order} onChange={e => setForm(f => ({ ...f, display_order: parseInt(e.target.value) }))} />
                </Field>
                <FormError error={error} />
                <div className="flex gap-2">
                  <button className="btn-primary text-sm" onClick={() => handleUpdate(station.id)} disabled={saving}>
                    {saving ? 'Saving...' : 'Save changes'}
                  </button>
                  <button className="btn-secondary text-sm" onClick={() => setEditingId(null)}>Cancel</button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="text-sm font-medium text-ink-900">{station.name}</p>
                  <p className="text-xs text-ink-400 mt-0.5">
                    Order: {station.display_order}
                    {station.description ? ` — ${station.description}` : ''}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button className="btn-secondary text-xs py-1.5 px-3" onClick={() => startEdit(station)}>Edit</button>
                  <button
                    className={`text-xs py-1.5 px-3 rounded-xl font-medium border transition-colors ${station.is_active ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-green-200 text-green-600 hover:bg-green-50'}`}
                    onClick={() => handleDeactivate(station.id)}
                  >
                    {station.is_active ? 'Deactivate' : 'Reactivate'}
                  </button>
                  <button
                    className="text-xs py-1.5 px-3 rounded-xl font-medium border border-red-300 text-red-700 hover:bg-red-100 transition-colors"
                    onClick={() => handleDelete(station.id, station.name)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
        {stations.length === 0 && (
          <p className="text-sm text-ink-400">No stations found.</p>
        )}
      </div>

      {/* Add new station */}
      <div className="card border-dashed border-2 border-surface-300">
        <h3 className="font-medium text-ink-900 mb-4">Add new station</h3>
        <form onSubmit={handleCreate} className="space-y-3">
          <Field label="Production line">
            <select className="input" value={newForm.production_line_id} onChange={e => setNewForm(f => ({ ...f, production_line_id: e.target.value }))} required>
              <option value="">Select line...</option>
              {lines.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </Field>
          <Field label="Station name">
            <input className="input" placeholder="e.g. Station 3" value={newForm.name} onChange={e => setNewForm(f => ({ ...f, name: e.target.value }))} required />
          </Field>
          <Field label="Description">
            <input className="input" placeholder="Optional description" value={newForm.description} onChange={e => setNewForm(f => ({ ...f, description: e.target.value }))} />
          </Field>
          <Field label="Display order">
            <input className="input" type="number" value={newForm.display_order} onChange={e => setNewForm(f => ({ ...f, display_order: parseInt(e.target.value) }))} />
          </Field>
          <FormError error={newError} />
          <button type="submit" className="btn-primary text-sm" disabled={saving}>
            {saving ? 'Adding...' : 'Add station'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── Checklist items tab ──────────────────────────────────────────────────────

function ChecklistItemsTab({ lines }) {
  const [items, setItems] = useState([])
  const [stations, setStations] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ name: '', category: '', unit: '', min_value: '', max_value: '', display_order: 0 })
  const [newForm, setNewForm] = useState({ station_id: '', name: '', category: '', data_type: 'pass_fail', unit: '', min_value: '', max_value: '', display_order: 0 })
  const [error, setError] = useState('')
  const [newError, setNewError] = useState('')
  const [saving, setSaving] = useState(false)
  const [filterLineId, setFilterLineId] = useState('')
  const [filterStationId, setFilterStationId] = useState('')

  useEffect(() => {
    api.get('/admin/stations').then(r => setStations(r.data))
  }, [])

  useEffect(() => {
    const params = {}
    if (filterStationId) params.station_id = filterStationId
    api.get('/admin/checklist-items', { params })
      .then(r => setItems(r.data))
      .finally(() => setLoading(false))
  }, [filterStationId])

  const filteredStations = filterLineId
    ? stations.filter(s => s.production_line_id === filterLineId)
    : stations

  const startEdit = item => {
    setEditingId(item.id)
    setForm({
      name: item.name,
      data_type: item.data_type,
      unit: item.unit || '',
      min_value: item.min_value ?? '',
      max_value: item.max_value ?? '',
      display_order: item.display_order,
    })
    setError('')
  }

  const handleUpdate = async id => {
    setSaving(true)
    try {
      const payload = {
        ...form,
        min_value: form.min_value !== '' ? parseFloat(form.min_value) : null,
        max_value: form.max_value !== '' ? parseFloat(form.max_value) : null,
      }
      const updated = await updateChecklistItem(id, payload)
      setItems(prev => prev.map(i => i.id === id ? updated.data : i))
      setEditingId(null)
    } catch (e) {
      setError(e.response?.data?.detail || 'Update failed.')
    } finally {
      setSaving(false)
    }
  }

  const handleDeactivate = async id => {
    try {
      const response = await deactivateChecklistItem(id)
      const updated = response.data
      setItems(prev => prev.map(i => i.id === id ? { ...i, is_active: updated.is_active } : i))
    } catch (e) {
      console.error('Deactivate failed:', e)
    }
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Permanently delete "${name}"? This cannot be undone.`)) return
    try {
      await deleteChecklistItem(id)
      setItems(prev => prev.filter(i => i.id !== id))
    } catch (e) {
      alert(e.response?.data?.detail || 'Delete failed.')
    }
  }

  const handleCreate = async e => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        ...newForm,
        min_value: newForm.min_value !== '' ? parseFloat(newForm.min_value) : null,
        max_value: newForm.max_value !== '' ? parseFloat(newForm.max_value) : null,
      }
      const created = await createChecklistItem(payload)
      setItems(prev => [...prev, created.data])
      setNewForm({ station_id: '', name: '', category: '', data_type: 'pass_fail', unit: '', min_value: '', max_value: '', display_order: 0 })
      setNewError('')
    } catch (e) {
      setNewError(e.response?.data?.detail || 'Creation failed.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-ink-400 text-sm">Loading checklist items...</p>

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Filter by line</label>
          <select className="input" value={filterLineId} onChange={e => { setFilterLineId(e.target.value); setFilterStationId('') }}>
            <option value="">All lines</option>
            {lines.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Filter by station</label>
          <select className="input" value={filterStationId} onChange={e => setFilterStationId(e.target.value)}>
            <option value="">All stations</option>
            {filteredStations.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>

      {/* Existing items */}
      <div className="space-y-3">
        {items.map(item => (
          <div key={item.id} className={`card p-0 overflow-hidden ${!item.is_active ? 'opacity-50' : ''}`}>
            {editingId === item.id ? (
              <div className="px-5 py-4 space-y-3">
                <Field label="Item name">
                  <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </Field>
                <Field label="Data type">
                  <div className="flex gap-2">
                    {['pass_fail', 'ok_ng', 'numeric'].map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, data_type: type }))}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border-2 transition-colors ${
                          form.data_type === type
                            ? 'border-brand-600 bg-brand-50 text-brand-700'
                            : 'border-surface-200 text-ink-400 hover:border-surface-300'
                        }`}
                      >
                        {type === 'pass_fail' ? 'Pass / Fail' : type === 'ok_ng' ? 'OK / NG' : 'Numeric'}
                      </button>
                    ))}
                  </div>
                </Field>
                {form.data_type === 'numeric' && (
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Unit">
                      <input className="input" placeholder="PSI, °F, ml..." value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} />
                    </Field>
                    <div />
                    <Field label="Min value">
                      <input className="input" type="number" step="any" value={form.min_value} onChange={e => setForm(f => ({ ...f, min_value: e.target.value }))} />
                    </Field>
                    <Field label="Max value">
                      <input className="input" type="number" step="any" value={form.max_value} onChange={e => setForm(f => ({ ...f, max_value: e.target.value }))} />
                    </Field>
                  </div>
                )}
                <Field label="Display order">
                  <input className="input" type="number" value={form.display_order} onChange={e => setForm(f => ({ ...f, display_order: parseInt(e.target.value) }))} />
                </Field>
                <FormError error={error} />
                <div className="flex gap-2">
                  <button className="btn-primary text-sm" onClick={() => handleUpdate(item.id)} disabled={saving}>
                    {saving ? 'Saving...' : 'Save changes'}
                  </button>
                  <button className="btn-secondary text-sm" onClick={() => setEditingId(null)}>Cancel</button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="text-sm font-medium text-ink-900">{item.name}</p>
                  <p className="text-xs text-ink-400 mt-0.5">
                    <span className="badge-info mr-2">{item.data_type}</span>
                    {item.min_value !== null && item.max_value !== null
                      ? `Range: ${item.min_value} – ${item.max_value} ${item.unit || ''}`
                      : item.unit || ''}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button className="btn-secondary text-xs py-1.5 px-3" onClick={() => startEdit(item)}>Edit</button>
                  <button
                    className={`text-xs py-1.5 px-3 rounded-xl font-medium border transition-colors ${item.is_active ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-green-200 text-green-600 hover:bg-green-50'}`}
                    onClick={() => handleDeactivate(item.id)}
                  >
                    {item.is_active ? 'Deactivate' : 'Reactivate'}
                  </button>
                  <button
                    className="text-xs py-1.5 px-3 rounded-xl font-medium border border-red-300 text-red-700 hover:bg-red-100 transition-colors"
                    onClick={() => handleDelete(item.id, item.name)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-sm text-ink-400">No checklist items found.</p>
        )}
      </div>

      {/* Add new item */}
      <div className="card border-dashed border-2 border-surface-300">
        <h3 className="font-medium text-ink-900 mb-4">Add new checklist item</h3>
        <form onSubmit={handleCreate} className="space-y-3">
          <Field label="Station">
            <select className="input" value={newForm.station_id} onChange={e => setNewForm(f => ({ ...f, station_id: e.target.value }))} required>
              <option value="">Select station...</option>
              {stations.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </Field>
          <Field label="Item name">
            <input className="input" placeholder="e.g. Safety guard in place" value={newForm.name} onChange={e => setNewForm(f => ({ ...f, name: e.target.value }))} required />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Type">
              <select className="input" value={newForm.data_type} onChange={e => setNewForm(f => ({ ...f, data_type: e.target.value }))}>
                <option value="pass_fail">Pass / Fail</option>
                <option value="ok_ng">OK / NG</option>
                <option value="numeric">Numeric</option>
              </select>
            </Field>
            {newForm.data_type === 'numeric' && (
              <>
                <Field label="Unit">
                  <input className="input" placeholder="PSI, °F, ml..." value={newForm.unit} onChange={e => setNewForm(f => ({ ...f, unit: e.target.value }))} />
                </Field>
                <Field label="Min value">
                  <input className="input" type="number" step="any" value={newForm.min_value} onChange={e => setNewForm(f => ({ ...f, min_value: e.target.value }))} />
                </Field>
                <Field label="Max value">
                  <input className="input" type="number" step="any" value={newForm.max_value} onChange={e => setNewForm(f => ({ ...f, max_value: e.target.value }))} />
                </Field>
              </>
            )}
          </div>
          <Field label="Display order">
            <input className="input" type="number" value={newForm.display_order} onChange={e => setNewForm(f => ({ ...f, display_order: parseInt(e.target.value) }))} />
          </Field>
          <FormError error={newError} />
          <button type="submit" className="btn-primary text-sm" disabled={saving}>
            {saving ? 'Adding...' : 'Add checklist item'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── Users tab ────────────────────────────────────────────────────────────────

function UsersTab() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [newForm, setNewForm] = useState({ full_name: '', username: '', email: '', password: '', role: 'operator' })
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [resetId, setResetId] = useState(null)
  const [newPassword, setNewPassword] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    listUsers().then(r => setUsers(r.data)).finally(() => setLoading(false))
  }, [])

  const handleCreate = async e => {
    e.preventDefault()
    setError('')
    try {
      const response = await createUser({
        full_name: newForm.full_name,
        username: newForm.username || null,
        email: newForm.email || null,
        password: newForm.password || null,
        role: newForm.role,
      })
      setUsers(prev => [...prev, response.data].sort((a, b) => a.full_name.localeCompare(b.full_name)))
      setNewForm({ full_name: '', username: '', email: '', password: '', role: 'operator' })
      setShowNew(false)
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to create user.')
    }
  }

  const handleUpdate = async id => {
    setError('')
    try {
      const response = await updateUser(id, editForm)
      setUsers(prev => prev.map(u => u.id === id ? response.data : u))
      setEditingId(null)
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to update user.')
    }
  }

  const handleResetPassword = async id => {
    if (!newPassword) return
    setError('')
    try {
      await resetPassword(id, newPassword)
      setResetId(null)
      setNewPassword('')
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to reset password.')
    }
  }

  const handleDeactivate = async id => {
    try {
      const response = await deactivateUser(id)
      setUsers(prev => prev.map(u => u.id === id ? { ...u, is_active: response.data.is_active } : u))
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to update user.')
    }
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Permanently delete "${name}"? This cannot be undone.`)) return
    try {
      await deleteUser(id)
      setUsers(prev => prev.filter(u => u.id !== id))
    } catch (e) {
      alert(e.response?.data?.detail || 'Delete failed.')
    }
  }

  const roleLabel = role => ({ admin: 'Admin', leader: 'Leader', operator: 'Operator' }[role] || role)
  const roleBadge = role => ({
    admin: 'bg-purple-100 text-purple-700',
    leader: 'bg-blue-100 text-blue-700',
    operator: 'bg-green-100 text-green-700',
  }[role] || 'bg-gray-100 text-gray-700')

  if (loading) return <div className="text-ink-400 text-sm">Loading...</div>

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

      {users.map(user => (
        <div key={user.id} className={`card space-y-3 ${!user.is_active ? 'opacity-50' : ''}`}>
          {editingId === user.id ? (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Full name">
                  <input className="input" value={editForm.full_name || ''} onChange={e => setEditForm(f => ({ ...f, full_name: e.target.value }))} />
                </Field>
                {user.role !== 'operator' && (
                  <Field label="Username">
                    <input className="input" value={editForm.username || ''} onChange={e => setEditForm(f => ({ ...f, username: e.target.value }))} />
                  </Field>
                )}
                <Field label="Email (optional — for alerts)">
                  <input className="input" type="email" value={editForm.email || ''} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} />
                </Field>
              </div>
              <div className="flex gap-2">
                <button className="btn-primary text-xs py-1.5 px-3" onClick={() => handleUpdate(user.id)}>Save</button>
                <button className="btn-secondary text-xs py-1.5 px-3" onClick={() => setEditingId(null)}>Cancel</button>
              </div>
            </div>
          ) : resetId === user.id ? (
            <div className="space-y-3">
              <Field label="New password">
                <input className="input" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Enter new password" />
              </Field>
              <div className="flex gap-2">
                <button className="btn-primary text-xs py-1.5 px-3" onClick={() => handleResetPassword(user.id)}>Set password</button>
                <button className="btn-secondary text-xs py-1.5 px-3" onClick={() => { setResetId(null); setNewPassword('') }}>Cancel</button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-ink-900">{user.full_name}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleBadge(user.role)}`}>
                    {roleLabel(user.role)}
                  </span>
                  {!user.is_active && <span className="text-xs text-ink-400">Inactive</span>}
                </div>
                {user.username && <p className="text-xs text-ink-400 mt-0.5">@{user.username}</p>}
                {user.email && <p className="text-xs text-ink-400">{user.email}</p>}
              </div>
              <div className="flex gap-2 shrink-0 flex-wrap justify-end">
                <button className="btn-secondary text-xs py-1.5 px-3" onClick={() => { setEditingId(user.id); setEditForm({ full_name: user.full_name, username: user.username || '', email: user.email || '' }) }}>Edit</button>
                {user.role !== 'operator' && (
                  <button className="btn-secondary text-xs py-1.5 px-3" onClick={() => { setResetId(user.id); setNewPassword('') }}>Reset password</button>
                )}
                <button
                  className={`text-xs py-1.5 px-3 rounded-xl font-medium border transition-colors ${user.is_active ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-green-200 text-green-600 hover:bg-green-50'}`}
                  onClick={() => handleDeactivate(user.id)}
                >
                  {user.is_active ? 'Deactivate' : 'Reactivate'}
                </button>
                <button
                  className="text-xs py-1.5 px-3 rounded-xl font-medium border border-red-300 text-red-700 hover:bg-red-100 transition-colors"
                  onClick={() => handleDelete(user.id, user.full_name)}
                >
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {showNew ? (
        <div className="card space-y-4">
          <p className="text-sm font-semibold text-ink-700">New user</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Role">
              <select className="input" value={newForm.role} onChange={e => setNewForm(f => ({ ...f, role: e.target.value }))}>
                <option value="operator">Operator</option>
                <option value="leader">Leader</option>
                <option value="admin">Admin</option>
              </select>
            </Field>
            <Field label="Full name">
              <input className="input" value={newForm.full_name} onChange={e => setNewForm(f => ({ ...f, full_name: e.target.value }))} placeholder="John Smith" />
            </Field>
            {newForm.role !== 'operator' && (
              <>
                <Field label="Username">
                  <input className="input" value={newForm.username} onChange={e => setNewForm(f => ({ ...f, username: e.target.value }))} placeholder="johnsmith" />
                </Field>
                <Field label="Password">
                  <input className="input" type="password" value={newForm.password} onChange={e => setNewForm(f => ({ ...f, password: e.target.value }))} placeholder="Temporary password" />
                </Field>
                <Field label="Email (optional — for alerts)">
                  <input className="input" type="email" value={newForm.email} onChange={e => setNewForm(f => ({ ...f, email: e.target.value }))} placeholder="john@yourcompany.com" />
                </Field>
              </>
            )}
          </div>
          <FormError error={error} />
          <div className="flex gap-2">
            <button className="btn-primary text-xs py-1.5 px-3" onClick={handleCreate}>Add user</button>
            <button className="btn-secondary text-xs py-1.5 px-3" onClick={() => { setShowNew(false); setError('') }}>Cancel</button>
          </div>
        </div>
      ) : (
        <button className="btn-secondary w-full" onClick={() => setShowNew(true)}>+ Add user</button>
      )}
    </div>
  )
}

// ─── Import tab ───────────────────────────────────────────────────────────────

function ImportTab() {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [warnings, setWarnings] = useState([])
  const [stats, setStats] = useState(null)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState(null)
  const [error, setError] = useState('')
  const fileRef = useRef()

  const DATA_TYPES = {
    pass_fail: 'pass_fail',
    pf: 'pass_fail',
    pass: 'pass_fail',
    fail: 'pass_fail',
    ok_ng: 'ok_ng',
    ok: 'ok_ng',
    ng: 'ok_ng',
    okng: 'ok_ng',
    numeric: 'numeric',
    num: 'numeric',
    value: 'numeric',
    measurement: 'numeric',
    number: 'numeric',
  }

  const parseDataType = raw => {
    if (!raw) return { type: 'pass_fail', warning: `Blank check type — defaulting to pass_fail` }
    const v = String(raw).trim().toLowerCase().replace(/[\s/]/g, '_')
    const type = DATA_TYPES[v]
    if (!type) return { type: 'pass_fail', warning: `Unknown check type '${raw}' — defaulting to pass_fail` }
    return { type, warning: null }
  }

  const readExcel = file => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = e => {
        try {
          // Parse CSV-like from xlsx using a simple approach
          // We'll use SheetJS via a dynamic import workaround
          resolve(e.target.result)
        } catch (err) {
          reject(err)
        }
      }
      reader.onerror = reject
      reader.readAsArrayBuffer(file)
    })
  }

  const handleFile = async e => {
    const f = e.target.files[0]
    if (!f) return
    setFile(f)
    setPreview(null)
    setWarnings([])
    setStats(null)
    setImportResult(null)
    setError('')

    try {
      const buffer = await readExcel(f)
      const XLSX = await import('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/xlsx.mjs')
      const wb = XLSX.read(buffer, { type: 'array' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const raw = XLSX.utils.sheet_to_json(ws, { header: 1 })

      if (raw.length < 2) {
        setError('Excel file appears to be empty or has no data rows.')
        return
      }

      const headers = raw[0].map(h => String(h || '').trim().toLowerCase())

      const col = {}
      headers.forEach((h, i) => {
        if (h.includes('line') && !h.includes('sub')) col.line = i
        else if ((h.includes('process') || h.includes('station')) && !h.includes('sub')) col.station = i
        else if (h.includes('sub')) col.sub_station = i
        else if (h.includes('description') || (h.includes('check') && h.includes('d'))) col.name = i
        else if ((h.includes('check') && h.includes('type')) || h === 'check type') col.data_type = i
      })

      const required = ['line', 'station', 'name', 'data_type']
      const missing = required.filter(r => !(r in col))
      if (missing.length > 0) {
        setError(`Missing required columns: ${missing.join(', ')}. Found: ${headers.join(', ')}`)
        return
      }

      const rows = []
      const warns = []

      raw.slice(1).forEach((row, idx) => {
        const rowNum = idx + 2
        const line = String(row[col.line] || '').trim()
        const station = String(row[col.station] || '').trim()
        const name = String(row[col.name] || '').trim()

        if (!line || !station) return
        if (!name) {
          warns.push(`Row ${rowNum}: Blank check description — skipped`)
          return
        }

        const { type, warning } = parseDataType(row[col.data_type])
        if (warning) warns.push(`Row ${rowNum}: ${warning}`)

        rows.push({
          line, station,
          sub_station: col.sub_station !== undefined ? String(row[col.sub_station] || '').trim() || null : null,
          name, data_type: type,
        })
      })

      setWarnings(warns)

      // Fetch existing data from portal
      const existingResp = await api.get('/admin/lines')
      const existing = existingResp.data

      const existingLineMap = {}
      const existingStationMap = {}
      const existingItemMap = {}

      existing.forEach(line => {
        existingLineMap[line.name] = line
        ;(line.stations || []).forEach(station => {
          existingStationMap[`${line.name}|${station.name}`] = station
          ;(station.checklist_items || []).forEach(item => {
            existingItemMap[`${line.name}|${station.name}|${item.name}`] = item
          })
        })
      })

      // Build preview
      const changes = {}
      rows.forEach(row => {
        if (!changes[row.line]) changes[row.line] = {}
        if (!changes[row.line][row.station]) changes[row.line][row.station] = []
        changes[row.line][row.station].push(row)
      })

      let totalNewLines = 0, totalNewStations = 0, totalNewItems = 0, totalSkipped = 0
      const previewData = []

      Object.entries(changes).forEach(([lineName, stations]) => {
        const lineIsNew = !existingLineMap[lineName]
        if (lineIsNew) totalNewLines++

        const stationPreviews = []
        Object.entries(stations).forEach(([stationName, items]) => {
          const stationKey = `${lineName}|${stationName}`
          const stationIsNew = !existingStationMap[stationKey]
          if (stationIsNew) totalNewStations++

          const newItems = []
          const skippedItems = []
          items.forEach(item => {
            const itemKey = `${lineName}|${stationName}|${item.name}`
            if (existingItemMap[itemKey]) { skippedItems.push(item); totalSkipped++ }
            else { newItems.push(item); totalNewItems++ }
          })

          stationPreviews.push({ name: stationName, isNew: stationIsNew, newItems, skippedItems })
        })

        previewData.push({ name: lineName, isNew: lineIsNew, stations: stationPreviews })
      })

      setPreview(previewData)
      setStats({ totalNewLines, totalNewStations, totalNewItems, totalSkipped })

    } catch (err) {
      setError(`Failed to read file: ${err.message}`)
    }
  }

  const handleImport = async () => {
    if (!preview) return
    setImporting(true)
    setError('')

    try {
      let linesCreated = 0, stationsCreated = 0, itemsCreated = 0

      // Re-fetch current state
      const existingResp = await api.get('/admin/lines')
      const existing = existingResp.data
      const lineMap = {}
      existing.forEach(l => { lineMap[l.name] = l })

      for (const linePreview of preview) {
        if (linePreview.stations.every(s => s.newItems.length === 0)) continue

        // Create line if new
        if (linePreview.isNew) {
          const resp = await api.post('/admin/lines', { name: linePreview.name })
          lineMap[linePreview.name] = resp.data
          linesCreated++
        }

        const lineId = lineMap[linePreview.name].id
        const stationMap = {}
        ;(lineMap[linePreview.name].stations || []).forEach(s => { stationMap[s.name] = s })

        for (const stationPreview of linePreview.stations) {
          if (stationPreview.newItems.length === 0) continue

          // Create station if new
          if (stationPreview.isNew) {
            const displayOrder = Object.keys(stationMap).length + 1
            const resp = await api.post('/admin/stations', {
              production_line_id: lineId,
              name: stationPreview.name,
              display_order: displayOrder,
            })
            stationMap[stationPreview.name] = resp.data
            stationsCreated++
          }

          const stationId = stationMap[stationPreview.name].id
          let displayOrder = (stationMap[stationPreview.name].checklist_items || []).length

          for (const item of stationPreview.newItems) {
            displayOrder++
            await api.post('/admin/checklist-items', {
              station_id: stationId,
              name: item.name,
              sub_station: item.sub_station,
              data_type: item.data_type,
              display_order: displayOrder,
            })
            itemsCreated++
          }
        }
      }

      setImportResult({ linesCreated, stationsCreated, itemsCreated })
      setPreview(null)
      setFile(null)
      if (fileRef.current) fileRef.current.value = ''

    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Import failed.')
    } finally {
      setImporting(false)
    }
  }

  const typeLabel = t => ({ pass_fail: 'Pass/Fail', ok_ng: 'OK/NG', numeric: 'Numeric' }[t] || t)

  const hasChanges = stats && (stats.totalNewItems > 0 || stats.totalNewLines > 0 || stats.totalNewStations > 0)

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-sm font-semibold text-ink-700 mb-1">Import from Excel</h2>
        <p className="text-xs text-ink-400">
          Select your <span className="font-mono">checks_summary.xlsx</span> file to preview and import production lines, stations, and checklist items.
          Existing items will be skipped automatically.
        </p>
      </div>

      {/* File picker */}
      <div className="card">
        <label className="label">Select Excel file</label>
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFile}
          className="block w-full text-sm text-ink-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 cursor-pointer"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl border border-red-100">{error}</p>
      )}

      {/* Import result */}
      {importResult && (
        <div className="card bg-green-50 border border-green-200">
          <p className="text-sm font-semibold text-green-800 mb-1">Import complete</p>
          <p className="text-sm text-green-700">
            {importResult.linesCreated} line(s) · {importResult.stationsCreated} station(s) · {importResult.itemsCreated} checklist item(s) created
          </p>
          <p className="text-xs text-green-600 mt-1">Refresh the Lines or Stations tabs to see the new items.</p>
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="card bg-amber-50 border border-amber-200 space-y-1">
          <p className="text-sm font-semibold text-amber-800">Warnings</p>
          {warnings.map((w, i) => (
            <p key={i} className="text-xs text-amber-700">⚠ {w}</p>
          ))}
        </div>
      )}

      {/* Preview */}
      {preview && stats && (
        <div className="space-y-4">
          {!hasChanges ? (
            <div className="card text-center py-8">
              <p className="text-sm font-medium text-ink-700">Nothing new to import</p>
              <p className="text-xs text-ink-400 mt-1">All items in this file already exist in the system.</p>
            </div>
          ) : (
            <>
              <div className="card space-y-4">
                <p className="text-sm font-semibold text-ink-700">Preview — changes to be made</p>
                {preview.map(line => (
                  <div key={line.name}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${line.isNew ? 'bg-blue-100 text-blue-700' : 'bg-surface-100 text-ink-500'}`}>
                        {line.isNew ? 'New line' : 'Existing line'}
                      </span>
                      <span className="text-sm font-medium text-ink-900">{line.name}</span>
                    </div>
                    {line.stations.map(station => (
                      station.newItems.length > 0 && (
                        <div key={station.name} className="ml-4 mb-3">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${station.isNew ? 'bg-green-100 text-green-700' : 'bg-surface-100 text-ink-500'}`}>
                              {station.isNew ? 'New station' : 'Existing station'}
                            </span>
                            <span className="text-sm text-ink-700">{station.name}</span>
                            <span className="text-xs text-ink-400">({station.newItems.length} new item{station.newItems.length !== 1 ? 's' : ''})</span>
                          </div>
                          <div className="ml-4 space-y-1">
                            {station.newItems.map((item, i) => (
                              <div key={i} className="flex items-center gap-2 text-xs text-ink-600">
                                <span className="text-green-500">+</span>
                                <span>{item.name}</span>
                                {item.sub_station && <span className="text-ink-400">[{item.sub_station}]</span>}
                                <span className="text-ink-300">({typeLabel(item.data_type)})</span>
                              </div>
                            ))}
                            {station.skippedItems.length > 0 && (
                              <p className="text-xs text-ink-300">{station.skippedItems.length} item(s) already exist — skipping</p>
                            )}
                          </div>
                        </div>
                      )
                    ))}
                  </div>
                ))}
              </div>

              {/* Summary bar */}
              <div className="card bg-surface-50 flex items-center justify-between">
                <p className="text-sm text-ink-600">
                  <span className="font-medium">{stats.totalNewLines}</span> line(s) ·{' '}
                  <span className="font-medium">{stats.totalNewStations}</span> station(s) ·{' '}
                  <span className="font-medium">{stats.totalNewItems}</span> item(s) to add
                  {stats.totalSkipped > 0 && <span className="text-ink-400"> · {stats.totalSkipped} skipped</span>}
                </p>
                <button
                  className="btn-primary"
                  onClick={handleImport}
                  disabled={importing}
                >
                  {importing ? 'Importing...' : 'Confirm Import'}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main AdminPanel component ────────────────────────────────────────────────

export default function AdminPanel() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('Lines')
  const [lines, setLines] = useState([])

  const TABS = user?.role === 'admin'
    ? ALL_TABS
    : ALL_TABS.filter(t => t !== 'Import')

  useEffect(() => {
    api.get('/admin/lines').then(r => setLines(r.data))
  }, [])

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink-900">Admin Panel</h1>
        <p className="text-ink-400 text-sm mt-0.5">
          Manage production lines, stations, checklist items, and users
        </p>
      </div>

      {/* Tab navigation */}
      <div className="flex rounded-xl border border-surface-200 bg-surface-100 p-1 max-w-2xl">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors duration-150 ${
              activeTab === tab
                ? 'bg-white text-ink-900 shadow-card'
                : 'text-ink-400 hover:text-ink-600'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'Lines' && <LinesTab />}
      {activeTab === 'Stations' && <StationsTab lines={lines} />}
      {activeTab === 'Checklist Items' && <ChecklistItemsTab lines={lines} />}
      {activeTab === 'Users' && <UsersTab />}
      {activeTab === 'Import' && user?.role === 'admin' && <ImportTab />}
    </div>
  )
}