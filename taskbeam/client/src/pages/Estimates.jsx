import { useState } from 'react'
import styles from './Estimates.module.css'
import { convertLength, convertArea, lengthUnit, areaUnit } from '../utils/units'

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

export default function Estimates({ rooms, materials, activeProject, unitSystem, laborCosts, onSaveLaborCost }) {
  const [contingency, setContingency] = useState(10)

  const roomEstimates = rooms.map(room => {
    const roomMaterials = materials.filter(m => m.room_id === room.id)
    const materialTotal = roomMaterials.reduce((sum, m) => sum + getLineTotal(m, rooms), 0)
    const laborTotal = parseFloat(laborCosts[room.id] || 0)
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

      {activeProject?.budget && (
        <div className={styles.roomCard}>
          <div className={styles.roomHeader}>
            <div>
              <span className={styles.roomName}>Budget tracker</span>
              <span className={styles.roomDims}>
                ${grandTotal.toLocaleString()} of ${parseFloat(activeProject.budget).toLocaleString()} budget used
              </span>
            </div>
            <span className={`${styles.roomSubtotal} ${
              grandTotal > parseFloat(activeProject.budget)
                ? styles.budgetStatusOver
                : grandTotal > parseFloat(activeProject.budget) * 0.9
                ? styles.budgetStatusNear
                : styles.budgetStatusUnder
            }`}>
              {grandTotal > parseFloat(activeProject.budget)
                ? `$${(grandTotal - parseFloat(activeProject.budget)).toLocaleString(undefined, {maximumFractionDigits: 0})} over`
                : `$${(parseFloat(activeProject.budget) - grandTotal).toLocaleString(undefined, {maximumFractionDigits: 0})} remaining`
              }
            </span>
          </div>
          <div className={styles.budgetBarWrap}>
            <div className={styles.budgetTrack}>
              <div
                className={`${styles.budgetFill} ${
                  grandTotal > parseFloat(activeProject.budget)
                    ? styles.budgetOver
                    : grandTotal > parseFloat(activeProject.budget) * 0.9
                    ? styles.budgetNear
                    : styles.budgetUnder
                }`}
                style={{
                  width: `${Math.min((grandTotal / parseFloat(activeProject.budget)) * 100, 100)}%`
                }}
              />
            </div>
            <div className={styles.budgetMarkers}>
              <span>$0</span>
              <span>${parseFloat(activeProject.budget).toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}

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
                  <td>
                    {group.unit === 'ft'
                      ? `${convertLength(group.totalQty, unitSystem).toFixed(2)} ${lengthUnit(unitSystem)}`
                      : group.unit === 'units'
                      ? `${group.totalQty.toFixed(2)} units`
                      : `${convertArea(group.totalQty, unitSystem).toFixed(2)} ${areaUnit(unitSystem)}`
                    }
                  </td>
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
                {convertLength(room.length, unitSystem)} × {convertLength(room.width, unitSystem)} {lengthUnit(unitSystem)} · {convertArea(parseFloat(room.length) * parseFloat(room.width), unitSystem).toFixed(0)} {areaUnit(unitSystem)}
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
                      <td>
                        {appT?.value === 'baseboard'
                          ? `${convertLength(qty, unitSystem)} ${lengthUnit(unitSystem)}`
                          : appT?.value === 'custom'
                          ? `${qty} units`
                          : `${convertArea(qty, unitSystem)} ${areaUnit(unitSystem)}`
                        }
                      </td>
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
              defaultValue={laborCosts[room.id] || ''}
              onBlur={e => onSaveLaborCost(room.id, e.target.value)}
            />
            <span className={styles.laborNote}>saved automatically on exit</span>
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