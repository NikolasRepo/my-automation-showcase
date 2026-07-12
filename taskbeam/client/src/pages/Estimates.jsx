import { useState } from 'react'
import styles from './Estimates.module.css'

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

function getQuantity(material, rooms) {
  const room = rooms.find(r => r.id === material.room_id)
  if (!room) return 0
  const appT = APPLICATION_TYPES.find(a => a.value === material.application)
  if (!appT || appT.dimensionKey === null) return parseFloat(material.custom_qty) || 0
  const dims = calcRoomDimensions(room)
  return dims[appT.dimensionKey] || 0
}

function getLineTotal(material, rooms) {
  const qty = getQuantity(material, rooms)
  const cost = parseFloat(material.unit_cost) || 0
  return parseFloat((qty * cost).toFixed(2))
}

export default function Estimates({ rooms, materials }) {
  const [laborRates, setLaborRates] = useState({})
  const [contingency, setContingency] = useState(10)

  function handleLaborChange(roomId, value) {
    setLaborRates({ ...laborRates, [roomId]: value })
  }

  const roomEstimates = rooms.map(room => {
    const roomMaterials = materials.filter(m => m.room_id === room.id)
    const materialTotal = roomMaterials.reduce((sum, m) => sum + getLineTotal(m, rooms), 0)
    const laborTotal = parseFloat(laborRates[room.id] || 0)
    const subtotal = materialTotal + laborTotal
    return {
      room,
      roomMaterials,
      materialTotal: parseFloat(materialTotal.toFixed(2)),
      laborTotal: parseFloat(laborTotal.toFixed(2)),
      subtotal: parseFloat(subtotal.toFixed(2)),
    }
  })

  const totalMaterials = roomEstimates.reduce((sum, r) => sum + r.materialTotal, 0)
  const totalLabor = roomEstimates.reduce((sum, r) => sum + r.laborTotal, 0)
  const subtotal = totalMaterials + totalLabor
  const contingencyAmount = parseFloat((subtotal * (contingency / 100)).toFixed(2))
  const grandTotal = parseFloat((subtotal + contingencyAmount).toFixed(2))

  return (
    <div className={styles.page}>
      <div className={styles.topbar}>
        <div>
          <h1 className={styles.title}>Cost estimate</h1>
          <span className={styles.sub}>{rooms.length} rooms · {materials.length} material line items</span>
        </div>
      </div>

      {rooms.length === 0 && (
        <div className={styles.notice}>
          Add rooms and materials before viewing estimates.
        </div>
      )}

      <div className={styles.summaryRow}>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Materials</span>
          <span className={styles.summaryValue}>${totalMaterials.toLocaleString()}</span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Labor</span>
          <span className={styles.summaryValue}>${totalLabor.toLocaleString()}</span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Contingency ({contingency}%)</span>
          <span className={styles.summaryValue}>${contingencyAmount.toLocaleString()}</span>
        </div>
        <div className={`${styles.summaryCard} ${styles.summaryTotal}`}>
          <span className={styles.summaryLabel}>Grand total</span>
          <span className={styles.summaryValue}>${grandTotal.toLocaleString()}</span>
        </div>
      </div>

      <div className={styles.contingencyRow}>
        <label className={styles.label}>Contingency buffer</label>
        <div className={styles.contingencyControls}>
          {[5, 10, 15, 20].map(pct => (
            <button
              key={pct}
              className={contingency === pct ? `${styles.pctBtn} ${styles.pctActive}` : styles.pctBtn}
              onClick={() => setContingency(pct)}
            >
              {pct}%
            </button>
          ))}
        </div>
      </div>
        {materials.length > 0 && (
          <div className={styles.roomCard}>
            <div className={styles.roomHeader}>
              <div>
                <span className={styles.roomName}>Materials summary</span>
                <span className={styles.roomDims}>Consolidated across all rooms</span>
              </div>
            </div>
            <table className={styles.table}>
              <colgroup>
                <col />
                <col />
                <col />
                <col />
                <col />
              </colgroup>
              <thead>
                <tr>
                  <th>Material</th>
                  <th>Application</th>
                  <th>Rooms</th>
                  <th>Total quantity</th>
                  <th>Total cost</th>
                </tr>
              </thead>
              <tbody>
                {Object.values(
                  materials.reduce((groups, mat) => {
                    const key = `${mat.name}__${mat.application}`
                    const qty = getQuantity(mat, rooms)
                    const total = getLineTotal(mat, rooms)
                    const room = rooms.find(r => r.id === mat.room_id)
                    const appT = APPLICATION_TYPES.find(a => a.value === mat.application)
                    if (!groups[key]) {
                      groups[key] = {
                        name: mat.name,
                        application: mat.application,
                        appLabel: appT ? appT.label : '—',
                        unit: appT ? appT.unit : '',
                        roomNames: [],
                        totalQty: 0,
                        totalCost: 0,
                      }
                    }
                    groups[key].totalQty += qty
                    groups[key].totalCost += total
                    if (room && !groups[key].roomNames.includes(room.name)) {
                      groups[key].roomNames.push(room.name)
                    }
                    return groups
                  }, {})
                ).map((group, i) => (
                  <tr key={i}>
                    <td><strong>{group.name}</strong></td>
                    <td>{group.appLabel}</td>
                    <td>{group.roomNames.join(', ') || '—'}</td>
                    <td>{group.totalQty.toFixed(2)} {group.unit}</td>
                    <td><strong>${group.totalCost.toLocaleString()}</strong></td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="4" className={styles.totalLabel}>Total materials cost</td>
                  <td className={styles.totalValue}>${totalMaterials.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      {roomEstimates.map(({ room, roomMaterials, materialTotal, laborTotal, subtotal }) => (
        <div key={room.id} className={styles.roomCard}>
          <div className={styles.roomHeader}>
            <div>
              <span className={styles.roomName}>{room.name}</span>
              <span className={styles.roomDims}>
                {parseFloat(room.length)} × {parseFloat(room.width)} ft · {(parseFloat(room.length) * parseFloat(room.width)).toFixed(0)} sq ft
              </span>
            </div>
            <span className={styles.roomSubtotal}>${subtotal.toLocaleString()}</span>
          </div>

          {roomMaterials.length > 0 && (
            <table className={styles.table}>
              <colgroup>
                <col />
                <col />
                <col />
                <col />
                <col />
              </colgroup>
              <thead>
                <tr>
                  <th>Material</th>
                  <th>Application</th>
                  <th>Quantity</th>
                  <th>Unit cost</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {roomMaterials.map(mat => {
                  const appT = APPLICATION_TYPES.find(a => a.value === mat.application)
                  const qty = getQuantity(mat, rooms)
                  const total = getLineTotal(mat, rooms)
                  return (
                    <tr key={mat.id}>
                      <td><strong>{mat.name}</strong></td>
                      <td>{appT ? appT.label : '—'}</td>
                      <td>{qty} {appT ? appT.unit : ''}</td>
                      <td>${parseFloat(mat.unit_cost || 0).toFixed(2)}</td>
                      <td><strong>${total.toLocaleString()}</strong></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}

          {roomMaterials.length === 0 && (
            <p className={styles.noMaterials}>No materials assigned to this room yet.</p>
          )}

          <div className={styles.laborRow}>
            <label className={styles.label}>Labor cost for {room.name} ($)</label>
            <input
              className={styles.laborInput}
              type="number"
              placeholder="0"
              value={laborRates[room.id] || ''}
              onChange={e => handleLaborChange(room.id, e.target.value)}
            />
            <span className={styles.laborNote}>entered manually per room</span>
          </div>

          <div className={styles.roomTotals}>
            <span>Materials: <strong>${materialTotal.toLocaleString()}</strong></span>
            <span>Labor: <strong>${laborTotal.toLocaleString()}</strong></span>
            <span>Room subtotal: <strong>${subtotal.toLocaleString()}</strong></span>
          </div>
        </div>
      ))}
    </div>
  )
}