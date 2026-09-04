import { useState, useRef } from 'react'
import { Stage, Layer, Rect, Text, Group, Line } from 'react-konva'
import styles from './FloorPlan.module.css'
import { api } from '../services/api'

const SCALE = 10
const GRID_SIZE = 20
const CANVAS_WIDTH = 1200
const CANVAS_HEIGHT = 800
const MIN_ROOM_WIDTH = 80
const MIN_ROOM_HEIGHT = 60
const MIN_SCALE = 0.3
const MAX_SCALE = 3
const SNAP_THRESHOLD = 15

const STATUS_COLORS = {
  planned: '#dbeafe',
  'in-progress': '#fef3c7',
  done: '#dcfce7',
}

const STATUS_BORDER_COLORS = {
  planned: '#93c3fd',
  'in-progress': '#fcd34d',
  done: '#86efac',
}

function snapToGrid(value, gridSize) {
  return Math.round(value / gridSize) * gridSize
}

function snapToRooms(x, y, w, h, rooms, currentRoomId, scale) {
  let snappedX = x
  let snappedY = y
  const threshold = SNAP_THRESHOLD / scale

  rooms.forEach(room => {
    if (room.id === currentRoomId) return
    const rx = parseFloat(room.x) || GRID_SIZE
    const ry = parseFloat(room.y) || GRID_SIZE
    const rw = Math.max(parseFloat(room.length) * SCALE, MIN_ROOM_WIDTH)
    const rh = Math.max(parseFloat(room.width) * SCALE, MIN_ROOM_HEIGHT)

    if (Math.abs(x - (rx + rw)) < threshold) snappedX = rx + rw
    if (Math.abs((x + w) - rx) < threshold) snappedX = rx - w
    if (Math.abs(x - rx) < threshold) snappedX = rx
    if (Math.abs((x + w) - (rx + rw)) < threshold) snappedX = rx + rw - w

    if (Math.abs(y - (ry + rh)) < threshold) snappedY = ry + rh
    if (Math.abs((y + h) - ry) < threshold) snappedY = ry - h
    if (Math.abs(y - ry) < threshold) snappedY = ry
    if (Math.abs((y + h) - (ry + rh)) < threshold) snappedY = ry + rh - h
  })

  return { x: snappedX, y: snappedY }
}

export default function FloorPlan({ rooms, onUpdateRoom }) {
  const [selectedId, setSelectedId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [stageScale, setStageScale] = useState(1)
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 })
  const [isDraggingRoom, setIsDraggingRoom] = useState(false)
  const [snapEnabled, setSnapEnabled] = useState(true)
  const saveTimeouts = useRef({})
  const stageRef = useRef(null)
  const lastSnappedPos = useRef({})

  function getRoomDimensions(room) {
    const w = Math.max(parseFloat(room.length) * SCALE, MIN_ROOM_WIDTH)
    const h = Math.max(parseFloat(room.width) * SCALE, MIN_ROOM_HEIGHT)
    return { w, h }
  }

  function getRoomPosition(room) {
    return {
      x: parseFloat(room.x) || GRID_SIZE,
      y: parseFloat(room.y) || GRID_SIZE,
    }
  }

  async function savePosition(roomId, x, y) {
    if (saveTimeouts.current[roomId]) {
      clearTimeout(saveTimeouts.current[roomId])
    }
    saveTimeouts.current[roomId] = setTimeout(async () => {
      setSaving(true)
      try {
        await api.updateRoomPosition(roomId, x, y)
      } catch (err) {
        console.error('Failed to save position:', err)
      } finally {
        setSaving(false)
      }
    }, 500)
  }

  function handleDragMove(room, e) {
    e.cancelBubble = true
    const node = e.target
    const { w, h } = getRoomDimensions(room)
    let x = node.x()
    let y = node.y()

    if (snapEnabled) {
      const snapped = snapToRooms(x, y, w, h, rooms, room.id, stageScale)
      if (snapped.x === x) snapped.x = snapToGrid(x, GRID_SIZE)
      if (snapped.y === y) snapped.y = snapToGrid(y, GRID_SIZE)
      x = Math.max(0, snapped.x)
      y = Math.max(0, snapped.y)
    } else {
      x = Math.max(0, x)
      y = Math.max(0, y)
    }

    lastSnappedPos.current[room.id] = { x, y }
    node.position({ x, y })
  }

  function handleDragEnd(room, e) {
    e.cancelBubble = true
    setIsDraggingRoom(false)

    const saved = lastSnappedPos.current[room.id]
    const x = saved ? saved.x : (snapEnabled ? snapToGrid(parseFloat(room.x) || GRID_SIZE, GRID_SIZE) : parseFloat(room.x) || GRID_SIZE)
    const y = saved ? saved.y : (snapEnabled ? snapToGrid(parseFloat(room.y) || GRID_SIZE, GRID_SIZE) : parseFloat(room.y) || GRID_SIZE)

    e.target.position({ x, y })

    onUpdateRoom(room.id, {
      name: room.name,
      length: room.length,
      width: room.width,
      height: room.height,
      status: room.status,
      x,
      y,
    })
    savePosition(room.id, x, y)
  }

  function handleWheel(e) {
    e.evt.preventDefault()
    const stage = stageRef.current
    const oldScale = stageScale
    const pointer = stage.getPointerPosition()
    const mousePointTo = {
      x: (pointer.x - stagePos.x) / oldScale,
      y: (pointer.y - stagePos.y) / oldScale,
    }
    const direction = e.evt.deltaY > 0 ? -1 : 1
    const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, oldScale + direction * 0.1))
    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    }
    setStageScale(newScale)
    setStagePos(newPos)
  }

  function handleFitToScreen() {
    if (rooms.length === 0) return
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    rooms.forEach(room => {
      const { w, h } = getRoomDimensions(room)
      const { x, y } = getRoomPosition(room)
      minX = Math.min(minX, x)
      minY = Math.min(minY, y)
      maxX = Math.max(maxX, x + w)
      maxY = Math.max(maxY, y + h)
    })
    const padding = 60
    const contentWidth = maxX - minX + padding * 2
    const contentHeight = maxY - minY + padding * 2
    const scaleX = CANVAS_WIDTH / contentWidth
    const scaleY = CANVAS_HEIGHT / contentHeight
    const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, Math.min(scaleX, scaleY)))
    const newPos = {
      x: (CANVAS_WIDTH - contentWidth * newScale) / 2 - (minX - padding) * newScale,
      y: (CANVAS_HEIGHT - contentHeight * newScale) / 2 - (minY - padding) * newScale,
    }
    setStageScale(newScale)
    setStagePos(newPos)
  }

  function handleResetView() {
    setStageScale(1)
    setStagePos({ x: 0, y: 0 })
  }

  const gridLines = []
  for (let i = 0; i <= 150; i++) {
    gridLines.push(
      <Line key={`v${i}`} points={[i * GRID_SIZE, 0, i * GRID_SIZE, 3000]} stroke="#f0f0ee" strokeWidth={1} listening={false} />
    )
    gridLines.push(
      <Line key={`h${i}`} points={[0, i * GRID_SIZE, 3000, i * GRID_SIZE]} stroke="#f0f0ee" strokeWidth={1} listening={false} />
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.topbar}>
        <div>
          <h1 className={styles.title}>Floor plan</h1>
          <span className={styles.sub}>
            {rooms.length} rooms · drag to arrange · {saving ? 'Saving...' : 'Auto-saved'}
          </span>
        </div>
        <div className={styles.controls}>
          <div className={styles.legend}>
            <span className={styles.legendItem}>
              <span className={styles.legendDot} style={{ background: STATUS_COLORS.planned, border: `1px solid ${STATUS_BORDER_COLORS.planned}` }} />
              Planned
            </span>
            <span className={styles.legendItem}>
              <span className={styles.legendDot} style={{ background: STATUS_COLORS['in-progress'], border: `1px solid ${STATUS_BORDER_COLORS['in-progress']}` }} />
              In progress
            </span>
            <span className={styles.legendItem}>
              <span className={styles.legendDot} style={{ background: STATUS_COLORS.done, border: `1px solid ${STATUS_BORDER_COLORS.done}` }} />
              Done
            </span>
          </div>
          <div className={styles.btnGroup}>
              <button
                className={`${styles.btn} ${snapEnabled ? styles.btnActive : ''}`}
                onClick={() => setSnapEnabled(s => !s)}
                title={snapEnabled ? 'Disable snapping' : 'Enable snapping'}
            >
                {snapEnabled ? 'Snap: on' : 'Snap: off'}
            </button>
            <button className={styles.btn} onClick={handleFitToScreen}>Fit to screen</button>
            <button className={styles.btn} onClick={handleResetView}>Reset view</button>
            <button
                className={styles.btn}
                onClick={() => {
                const center = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 }
                const oldScale = stageScale
                const newScale = Math.min(MAX_SCALE, parseFloat((oldScale + 0.2).toFixed(1)))
                const mousePointTo = {
                    x: (center.x - stagePos.x) / oldScale,
                    y: (center.y - stagePos.y) / oldScale,
                }
                const newPos = {
                    x: center.x - mousePointTo.x * newScale,
                    y: center.y - mousePointTo.y * newScale,
                }
                setStageScale(newScale)
                setStagePos(newPos)
                }}
            >
                Zoom in
            </button>
            <button
                className={styles.btn}
                onClick={() => {
                const center = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 }
                const oldScale = stageScale
                const newScale = Math.max(MIN_SCALE, parseFloat((oldScale - 0.2).toFixed(1)))
                const mousePointTo = {
                    x: (center.x - stagePos.x) / oldScale,
                    y: (center.y - stagePos.y) / oldScale,
                }
                const newPos = {
                    x: center.x - mousePointTo.x * newScale,
                    y: center.y - mousePointTo.y * newScale,
                }
                setStageScale(newScale)
                setStagePos(newPos)
                }}
            >
                Zoom out
            </button>

          </div>
        </div>
      </div>

      {rooms.length === 0 ? (
        <div className={styles.empty}>
          <p>No rooms yet. Add rooms on the Rooms & layout page to see them here.</p>
        </div>
      ) : (
        <div className={styles.canvasWrap}>
          <Stage
            ref={stageRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            scaleX={stageScale}
            scaleY={stageScale}
            x={stagePos.x}
            y={stagePos.y}
            onWheel={handleWheel}
            draggable={!isDraggingRoom}
            onDragEnd={e => {
              if (e.target === stageRef.current) {
                setStagePos({ x: e.target.x(), y: e.target.y() })
              }
            }}
            onClick={e => {
              if (e.target === e.target.getStage()) setSelectedId(null)
            }}
          >
            <Layer>
              {gridLines}
              {rooms.map(room => {
                const { w, h } = getRoomDimensions(room)
                const { x, y } = getRoomPosition(room)
                const isSelected = selectedId === room.id
                const fillColor = STATUS_COLORS[room.status] || STATUS_COLORS.planned
                const strokeColor = isSelected ? '#1d4ed8' : (STATUS_BORDER_COLORS[room.status] || '#d1d1cf')

                return (
                  <Group
                    key={room.id}
                    x={x}
                    y={y}
                    draggable
                    onClick={e => {
                      e.cancelBubble = true
                      setSelectedId(room.id)
                    }}
                    onDragStart={e => {
                      e.cancelBubble = true
                      setIsDraggingRoom(true)
                    }}
                    onDragMove={e => handleDragMove(room, e)}
                    onDragEnd={e => handleDragEnd(room, e)}
                  >
                    <Rect
                      width={w}
                      height={h}
                      fill={fillColor}
                      stroke={strokeColor}
                      strokeWidth={isSelected ? 2 : 1}
                      cornerRadius={4}
                      shadowColor={isSelected ? '#1d4ed8' : 'transparent'}
                      shadowBlur={isSelected ? 8 : 0}
                      shadowOpacity={0.3}
                    />
                    <Text
                      text={room.name}
                      width={w}
                      height={h / 2}
                      align="center"
                      verticalAlign="bottom"
                      fontSize={13}
                      fontStyle="bold"
                      fill="#1a1a1a"
                      padding={4}
                    />
                    <Text
                      text={`${parseFloat(room.length)} × ${parseFloat(room.width)} ft`}
                      y={h / 2}
                      width={w}
                      height={h / 2}
                      align="center"
                      verticalAlign="top"
                      fontSize={11}
                      fill="#666"
                      padding={4}
                    />
                  </Group>
                )
              })}
            </Layer>
          </Stage>
          <div className={styles.zoomIndicator}>
            {Math.round(stageScale * 100)}%
          </div>
        </div>
      )}

      {selectedId && (
        <div className={styles.selectedInfo}>
          {(() => {
            const room = rooms.find(r => r.id === selectedId)
            if (!room) return null
            return (
              <span>
                <strong>{room.name}</strong> · {parseFloat(room.length)} × {parseFloat(room.width)} ft · {(parseFloat(room.length) * parseFloat(room.width)).toFixed(0)} sq ft
              </span>
            )
          })()}
        </div>
      )}

      <div className={styles.hint}>
        Scroll to zoom · Drag canvas to pan · Drag rooms to reposition · Toggle snap for free placement
      </div>
    </div>
  )
}