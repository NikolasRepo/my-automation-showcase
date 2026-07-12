import { useState } from 'react'
import styles from './Materials.module.css'

const APPLICATION_TYPES = [
  { value: 'floor', label: 'Flooring', unit: 'sq ft', dimensionKey: 'floorArea' },
  { value: 'wall', label: 'Wall covering', unit: 'sq ft', dimensionKey: 'wallArea' },
  { value: 'ceiling', label: 'Ceiling', unit: 'sq ft', dimensionKey: 'ceilingArea' },
  { value: 'baseboard', label: 'Baseboard / trim', unit: 'ft', dimensionKey: 'perimeter' },
  { value: 'custom', label: 'Custom quantity', unit: 'units', dimensionKey: null },
]

const WASTE_FACTORS = {
  floor: 1.10,
  wall: 1.12,
  ceiling: 1.08,
  baseboard: 1.10,
  custom: 1.00,
}

function calcRoomDimensions(room) {
  const l = parseFloat(room.length)
  const w = parseFloat(room.width)
  const h = parseFloat(room.height)
  return {
    floorArea: parseFloat((l * w * WASTE_FACTORS.floor).toFixed(2)),
    wallArea: parseFloat((2 * (l + w) * h * WASTE_FACTORS.wall).toFixed(2)),
    ceilingArea: parseFloat((l * w * WASTE_FACTORS.ceiling).toFixed(2)),
    perimeter: parseFloat((2 * (l + w) * WASTE_FACTORS.baseboard).toFixed(2)),
  }
}

const emptyMaterial = {
  roomId: '',
  name: '',
  application: 'floor',
  unitCost: '',
  customQty: '',
  notes: '',
}

export default function Materials({ rooms, materials, setMaterials }) {
  const [form, setForm] = useState(emptyMaterial)
  const [editId, setEditId] = useState(null)
  const [showForm, setShowForm] = useState(false)

  const selectedRoom = rooms.find(r => r.id === parseInt(form.roomId)) || null
  const appType = APPLICATION_TYPES.find(a => a.value === form.application)

  function getQuantity(material) {
    const room = rooms.find(r => r.id === material.roomId)
    if (!room) return 0
    const appT = APPLICATION_TYPES.find(a => a.value === material.application)
    if (!appT || appT.dimensionKey === null) return parseFloat(material.customQty) || 0
    const dims = calcRoomDimensions(room)
    return dims[appT.dimensionKey] || 0
  }

  function getLineTotal(material) {
    const qty = getQuantity(material)
    const cost = parseFloat(material.unitCost) || 0
    return parseFloat((qty * cost).toFixed(2))
  }

  const grandTotal = materials.reduce((sum, m) => sum + getLineTotal(m), 0)

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  function handleSubmit() {
    if (!form.roomId || !form.name || !form.application) return
    const entry = {
      ...form,
      roomId: parseInt(form.roomId),
      id: editId !== null ? editId : Date.now(),
    }
    if (editId !== null) {
      setMaterials(materials.map(m => m.id === editId ? entry : m))
      setEditId(null)
    } else {
      setMaterials([...materials, entry])
    }
    setForm(emptyMaterial)
    setShowForm(false)
  }

  function handleEdit(mat) {
    setForm({ ...mat, roomId: mat.roomId.toString() })
    setEditId(mat.id)
    setShowForm(true)
  }

  function handleDelete(id) {
    setMaterials(materials.filter(m => m.id !== id))
  }

  function handleCancel() {
    setForm(emptyMaterial)
    setEditId(null)
    setShowForm(false)
  }

  return (
    <div className={styles.page}>
      <div className={styles.topbar}>
        <div>
          <h1 className={styles.title}>Materials</h1>
          <span className={styles.sub}>
            {materials.length} line items · Est. total: ${grandTotal.toLocaleString()}
          </span>
        </div>
        <button
          className={styles.btnPrimary}
          onClick={() => setShowForm(true)}
          disabled={rooms.length === 0}
        >
          + Add material
        </button>
      </div>

      {rooms.length === 0 && (
        <div className={styles.notice}>
          Add rooms on the Rooms & layout page before assigning materials.
        </div>
      )}

      {showForm && (
        <div className={styles.formCard}>
          <h2 className={styles.formTitle}>{editId ? 'Edit material' : 'New material'}</h2>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Room</label>
              <select className={styles.input} name="roomId" value={form.roomId} onChange={handleChange}>
                <option value="">Select room</option>
                {rooms.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Material name</label>
              <input className={styles.input} name="name" value={form.name} onChange={handleChange} placeholder="e.g. LVP flooring" />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Application</label>
              <select className={styles.input} name="application" value={form.application} onChange={handleChange}>
                {APPLICATION_TYPES.map(a => (
                  <option key={a.value} value={a.value}>{a.label}</option>
                ))}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Unit cost ($)</label>
              <input className={styles.input} name="unitCost" type="number" value={form.unitCost} onChange={handleChange} placeholder="0.00" />
            </div>
            {form.application === 'custom' && (
              <div className={styles.formGroup}>
                <label className={styles.label}>Custom quantity</label>
                <input className={styles.input} name="customQty" type="number" value={form.customQty} onChange={handleChange} placeholder="0" />
              </div>
            )}
            {selectedRoom && appType && appType.dimensionKey && (
              <div className={styles.formGroup}>
                <label className={styles.label}>Auto quantity</label>
                <div className={styles.autoQty}>
                  {calcRoomDimensions(selectedRoom)[appType.dimensionKey]} {appType.unit}
                  <span className={styles.autoQtyNote}>calculated from room</span>
                </div>
              </div>
            )}
            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label className={styles.label}>Notes</label>
              <input className={styles.input} name="notes" value={form.notes} onChange={handleChange} placeholder="Optional notes" />
            </div>
          </div>
          <div className={styles.formActions}>
            <button className={styles.btnSecondary} onClick={handleCancel}>Cancel</button>
            <button className={styles.btnPrimary} onClick={handleSubmit}>
              {editId ? 'Save changes' : 'Add material'}
            </button>
          </div>
        </div>
      )}

      {materials.length === 0 && !showForm ? (
        <div className={styles.empty}>
          <p>No materials yet. Add a material to start tracking costs.</p>
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Material</th>
                <th>Room</th>
                <th>Application</th>
                <th>Quantity</th>
                <th>Unit cost</th>
                <th>Line total</th>
                <th>Notes</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {materials.map(mat => {
                const room = rooms.find(r => r.id === mat.roomId)
                const appT = APPLICATION_TYPES.find(a => a.value === mat.application)
                const qty = getQuantity(mat)
                const total = getLineTotal(mat)
                return (
                  <tr key={mat.id}>
                    <td><strong>{mat.name}</strong></td>
                    <td>{room ? room.name : '—'}</td>
                    <td>{appT ? appT.label : '—'}</td>
                    <td>{qty} {appT ? appT.unit : ''}</td>
                    <td>${parseFloat(mat.unitCost || 0).toFixed(2)}</td>
                    <td><strong>${total.toLocaleString()}</strong></td>
                    <td className={styles.notes}>{mat.notes || '—'}</td>
                    <td>
                      <div className={styles.actions}>
                        <button className={styles.btnAction} onClick={() => handleEdit(mat)}>Edit</button>
                        <button className={`${styles.btnAction} ${styles.btnDanger}`} onClick={() => handleDelete(mat.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="5" className={styles.totalLabel}>Estimated total</td>
                <td className={styles.totalValue}>${grandTotal.toLocaleString()}</td>
                <td colSpan="2"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}