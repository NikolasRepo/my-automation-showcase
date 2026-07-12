import styles from './ClientView.module.css'

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

export default function ClientView({ activeProject, rooms, materials, tasks }) {
  if (!activeProject) {
    return (
      <div className={styles.empty}>
        <p>No active project selected.</p>
      </div>
    )
  }

  const totalArea = rooms.reduce((sum, r) =>
    sum + parseFloat(r.length) * parseFloat(r.width), 0
  )

  const totalMaterials = materials.reduce((sum, m) =>
    sum + getLineTotal(m, rooms), 0
  )

  const clientTasks = tasks.filter(t => t.client_visible)

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.brandMark}>TaskBeam</span>
          <h1 className={styles.projectName}>{activeProject.name}</h1>
          {activeProject.client_name && (
            <p className={styles.clientName}>Prepared for {activeProject.client_name}</p>
          )}
        </div>
        <div className={styles.headerRight}>
          <span className={styles.readOnlyBadge}>Client view</span>
        </div>
      </div>

      <div className={styles.summaryRow}>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Total rooms</span>
          <span className={styles.summaryValue}>{rooms.length}</span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Total area</span>
          <span className={styles.summaryValue}>{totalArea.toFixed(0)} sq ft</span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Material line items</span>
          <span className={styles.summaryValue}>{materials.length}</span>
        </div>
        <div className={`${styles.summaryCard} ${styles.summaryTotal}`}>
          <span className={styles.summaryLabel}>Est. materials cost</span>
          <span className={styles.summaryValue}>${totalMaterials.toLocaleString()}</span>
        </div>
      </div>

      {rooms.length > 0 && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Rooms & dimensions</h2>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Room</th>
                  <th>Dimension</th>
                  <th>Area</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {rooms.map(room => (
                  <tr key={room.id}>
                    <td><strong>{room.name}</strong></td>
                    <td>{parseFloat(room.length)} × {parseFloat(room.width)} × {parseFloat(room.height)} ft</td>
                    <td><strong>{(parseFloat(room.length) * parseFloat(room.width)).toFixed(0)} sq ft</strong></td>
                    <td><span className={`${styles.badge} ${styles[room.status]}`}>{room.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {materials.length > 0 && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Materials & costs</h2>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Material</th>
                  <th>Room</th>
                  <th>Application</th>
                  <th>Quantity</th>
                  <th>Unit cost</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {materials.map(mat => {
                  const room = rooms.find(r => r.id === mat.room_id)
                  const appT = APPLICATION_TYPES.find(a => a.value === mat.application)
                  const qty = getQuantity(mat, rooms)
                  const total = getLineTotal(mat, rooms)
                  return (
                    <tr key={mat.id}>
                      <td><strong>{mat.name}</strong></td>
                      <td>{room ? room.name : '—'}</td>
                      <td>{appT ? appT.label : '—'}</td>
                      <td>{qty} {appT ? appT.unit : ''}</td>
                      <td>${parseFloat(mat.unit_cost || 0).toFixed(2)}</td>
                      <td><strong>${total.toLocaleString()}</strong></td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="5" className={styles.totalLabel}>Estimated materials total</td>
                  <td className={styles.totalValue}>${totalMaterials.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {clientTasks.length > 0 && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Project tasks</h2>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Room</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Due date</th>
                </tr>
              </thead>
              <tbody>
                {clientTasks.map(task => {
                  const room = rooms.find(r => r.id === task.room_id)
                  return (
                    <tr key={task.id}>
                      <td><strong>{task.title}</strong></td>
                      <td>{room ? room.name : '—'}</td>
                      <td>{task.priority}</td>
                      <td><span className={`${styles.badge} ${styles[task.status]}`}>{task.status}</span></td>
                      <td>{task.due_date ? new Date(task.due_date).toLocaleDateString() : '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {rooms.length === 0 && materials.length === 0 && clientTasks.length === 0 && (
        <div className={styles.emptyState}>
          <p>No project data available yet.</p>
        </div>
      )}

      <div className={styles.footer}>
        <p>Generated by TaskBeam · {new Date().toLocaleDateString()}</p>
      </div>
    </div>
  )
}