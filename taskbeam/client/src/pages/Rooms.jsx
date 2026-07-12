import { useState } from 'react'
import styles from './Rooms.module.css'

const WASTE_FACTORS = {
  floor: 1.10,
  wall: 1.12,
  ceiling: 1.08,
  baseboard: 1.10,
}

function calcArea(l, w) {
  return parseFloat((parseFloat(l) * parseFloat(w)).toFixed(2))
}

function calcMaterials(room) {
  const l = parseFloat(room.length)
  const w = parseFloat(room.width)
  const h = parseFloat(room.height)
  return {
    floorArea: (l * w * WASTE_FACTORS.floor).toFixed(2),
    ceilingArea: (l * w * WASTE_FACTORS.ceiling).toFixed(2),
    wallArea: (2 * (l + w) * h * WASTE_FACTORS.wall).toFixed(2),
    perimeter: (2 * (l + w) * WASTE_FACTORS.baseboard).toFixed(2),
  }
}

const emptyRoom = {
  name: '',
  length: '',
  width: '',
  height: '',
  status: 'planned',
}

export default function Rooms({ rooms, onCreateRoom, onUpdateRoom, onDeleteRoom }) {
  const [form, setForm] = useState(emptyRoom)
  const [editId, setEditId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  const totalArea = rooms.reduce((sum, r) => sum + calcArea(r.length, r.width), 0)

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit() {
    if (!form.name || !form.length || !form.width || !form.height) return
    setSaving(true)
    try {
      if (editId !== null) {
        await onUpdateRoom(editId, form)
        setEditId(null)
      } else {
        await onCreateRoom(form)
      }
      setForm(emptyRoom)
      setShowForm(false)
    } catch (err) {
      console.error('Failed to save room:', err)
    } finally {
      setSaving(false)
    }
  }

  function handleEdit(room) {
    setForm({
      name: room.name,
      length: room.length,
      width: room.width,
      height: room.height,
      status: room.status,
    })
    setEditId(room.id)
    setShowForm(true)
  }

  async function handleDelete(id) {
    try {
      await onDeleteRoom(id)
    } catch (err) {
      console.error('Failed to delete room:', err)
    }
  }

  function handleCancel() {
    setForm(emptyRoom)
    setEditId(null)
    setShowForm(false)
  }

  return (
    <div className={styles.page}>
      <div className={styles.topbar}>
        <div>
          <h1 className={styles.title}>Rooms & layout</h1>
          <span className={styles.sub}>{rooms.length} rooms · {totalArea.toFixed(0)} sq ft total</span>
        </div>
        <button className={styles.btnPrimary} onClick={() => setShowForm(true)}>
          + Add room
        </button>
      </div>

      {showForm && (
        <div className={styles.formCard}>
          <h2 className={styles.formTitle}>{editId ? 'Edit room' : 'New room'}</h2>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Room name</label>
              <input className={styles.input} name="name" value={form.name} onChange={handleChange} placeholder="e.g. Kitchen" autoFocus />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Status</label>
              <select className={styles.input} name="status" value={form.status} onChange={handleChange}>
                <option value="planned">Planned</option>
                <option value="in-progress">In progress</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Length (ft)</label>
              <input className={styles.input} name="length" type="number" value={form.length} onChange={handleChange} placeholder="0" />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Width (ft)</label>
              <input className={styles.input} name="width" type="number" value={form.width} onChange={handleChange} placeholder="0" />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Ceiling height (ft)</label>
              <input className={styles.input} name="height" type="number" value={form.height} onChange={handleChange} placeholder="0" />
            </div>
          </div>
          <div className={styles.formActions}>
            <button className={styles.btnSecondary} onClick={handleCancel}>Cancel</button>
            <button className={styles.btnPrimary} onClick={handleSubmit} disabled={saving}>
              {saving ? 'Saving...' : editId ? 'Save changes' : 'Add room'}
            </button>
          </div>
        </div>
      )}

      {rooms.length === 0 && !showForm ? (
        <div className={styles.empty}>
          <p>No rooms yet. Add your first room to get started.</p>
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Room</th>
                <th>Length</th>
                <th>Width</th>
                <th>Height</th>
                <th>Area</th>
                <th>Floor (w/ waste)</th>
                <th>Wall area (w/ waste)</th>
                <th>Perimeter (w/ waste)</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rooms.map(room => {
                const m = calcMaterials(room)
                return (
                  <tr key={room.id}>
                    <td><strong>{room.name}</strong></td>
                    <td>{room.length} ft</td>
                    <td>{room.width} ft</td>
                    <td>{room.height} ft</td>
                    <td><strong>{calcArea(room.length, room.width)} sq ft</strong></td>
                    <td>{m.floorArea} sq ft</td>
                    <td>{m.wallArea} sq ft</td>
                    <td>{m.perimeter} ft</td>
                    <td><span className={`${styles.badge} ${styles[room.status]}`}>{room.status}</span></td>
                    <td>
                      <div className={styles.actions}>
                        <button className={styles.btnAction} onClick={() => handleEdit(room)}>Edit</button>
                        <button className={`${styles.btnAction} ${styles.btnDanger}`} onClick={() => handleDelete(room.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}