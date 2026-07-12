import { useState } from 'react'
import styles from './Tasks.module.css'

const PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
]

const STATUSES = [
  { value: 'todo', label: 'To do' },
  { value: 'in-progress', label: 'In progress' },
  { value: 'done', label: 'Done' },
]

const emptyTask = {
  title: '',
  roomId: '',
  priority: 'medium',
  status: 'todo',
  dueDate: '',
  notes: '',
  clientVisible: false,
}

export default function Tasks({ rooms, tasks, onCreateTask, onUpdateTask, onDeleteTask }) {
  const [form, setForm] = useState(emptyTask)
  const [editId, setEditId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [filterStatus, setFilterStatus] = useState('all')
  const [saving, setSaving] = useState(false)

  const filtered = filterStatus === 'all'
    ? tasks
    : tasks.filter(t => t.status === filterStatus)

  const counts = {
    all: tasks.length,
    todo: tasks.filter(t => t.status === 'todo').length,
    'in-progress': tasks.filter(t => t.status === 'in-progress').length,
    done: tasks.filter(t => t.status === 'done').length,
  }

  function handleChange(e) {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm({ ...form, [e.target.name]: value })
  }

  async function handleSubmit() {
    if (!form.title) return
    setSaving(true)
    const data = {
      room_id: form.roomId ? form.roomId : null,
      title: form.title,
      priority: form.priority,
      status: form.status,
      due_date: form.dueDate || null,
      notes: form.notes,
      client_visible: form.clientVisible,
    }
    try {
      if (editId !== null) {
        await onUpdateTask(editId, data)
        setEditId(null)
      } else {
        await onCreateTask(data)
      }
      setForm(emptyTask)
      setShowForm(false)
    } catch (err) {
      console.error('Failed to save task:', err)
    } finally {
      setSaving(false)
    }
  }

  function handleEdit(task) {
    setForm({
      title: task.title,
      roomId: task.room_id || '',
      priority: task.priority,
      status: task.status,
      dueDate: task.due_date ? task.due_date.split('T')[0] : '',
      notes: task.notes || '',
      clientVisible: task.client_visible || false,
    })
    setEditId(task.id)
    setShowForm(true)
  }

  async function handleDelete(id) {
    try {
      await onDeleteTask(id)
    } catch (err) {
      console.error('Failed to delete task:', err)
    }
  }

  function handleCancel() {
    setForm(emptyTask)
    setEditId(null)
    setShowForm(false)
  }

  async function handleStatusToggle(task) {
    const next = task.status === 'todo'
      ? 'in-progress'
      : task.status === 'in-progress'
      ? 'done'
      : 'todo'
    try {
      await onUpdateTask(task.id, {
        room_id: task.room_id,
        title: task.title,
        priority: task.priority,
        status: next,
        due_date: task.due_date,
        notes: task.notes,
        client_visible: task.client_visible,
      })
    } catch (err) {
      console.error('Failed to update task status:', err)
    }
  }

  async function handleClientVisibleToggle(task) {
    try {
      await onUpdateTask(task.id, {
        room_id: task.room_id,
        title: task.title,
        priority: task.priority,
        status: task.status,
        due_date: task.due_date,
        notes: task.notes,
        client_visible: !task.client_visible,
      })
    } catch (err) {
      console.error('Failed to update task visibility:', err)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.topbar}>
        <div>
          <h1 className={styles.title}>Tasks</h1>
          <span className={styles.sub}>
            {counts.done} of {counts.all} completed
          </span>
        </div>
        <button className={styles.btnPrimary} onClick={() => setShowForm(true)}>
          + Add task
        </button>
      </div>

      <div className={styles.filterRow}>
        {['all', 'todo', 'in-progress', 'done'].map(s => (
          <button
            key={s}
            className={filterStatus === s ? `${styles.filterBtn} ${styles.filterActive}` : styles.filterBtn}
            onClick={() => setFilterStatus(s)}
          >
            {s === 'all' ? 'All' : STATUSES.find(x => x.value === s)?.label} ({counts[s]})
          </button>
        ))}
      </div>

      {showForm && (
        <div className={styles.formCard}>
          <h2 className={styles.formTitle}>{editId ? 'Edit task' : 'New task'}</h2>
          <div className={styles.formGrid}>
            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label className={styles.label}>Task title</label>
              <input
                className={styles.input}
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="e.g. Install LVP flooring in kitchen"
                autoFocus
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Room (optional)</label>
              <select className={styles.input} name="roomId" value={form.roomId} onChange={handleChange}>
                <option value="">No room</option>
                {rooms.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Priority</label>
              <select className={styles.input} name="priority" value={form.priority} onChange={handleChange}>
                {PRIORITIES.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Status</label>
              <select className={styles.input} name="status" value={form.status} onChange={handleChange}>
                {STATUSES.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Due date</label>
              <input
                className={styles.input}
                name="dueDate"
                type="date"
                value={form.dueDate}
                onChange={handleChange}
              />
            </div>
            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label className={styles.label}>Notes</label>
              <input
                className={styles.input}
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder="Optional notes"
              />
            </div>
            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label className={styles.toggleLabel}>
                <input
                  type="checkbox"
                  name="clientVisible"
                  checked={form.clientVisible}
                  onChange={handleChange}
                  className={styles.checkbox}
                />
                Visible in client view
              </label>
            </div>
          </div>
          <div className={styles.formActions}>
            <button className={styles.btnSecondary} onClick={handleCancel}>Cancel</button>
            <button className={styles.btnPrimary} onClick={handleSubmit} disabled={saving}>
              {saving ? 'Saving...' : editId ? 'Save changes' : 'Add task'}
            </button>
          </div>
        </div>
      )}

      {filtered.length === 0 && !showForm ? (
        <div className={styles.empty}>
          <p>{filterStatus === 'all' ? 'No tasks yet. Add your first task to get started.' : `No tasks with status "${filterStatus}".`}</p>
        </div>
      ) : (
        <div className={styles.taskList}>
          {filtered.map(task => {
            const room = rooms.find(r => r.id === task.room_id)
            const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done'
            return (
              <div key={task.id} className={`${styles.taskCard} ${task.status === 'done' ? styles.taskDone : ''}`}>
                <div className={styles.taskMain}>
                  <button
                    className={styles.statusBtn}
                    onClick={() => handleStatusToggle(task)}
                    title="Click to advance status"
                  >
                    <span className={`${styles.statusDot} ${styles[task.status]}`} />
                  </button>
                  <div className={styles.taskBody}>
                    <span className={styles.taskTitle}>{task.title}</span>
                    <div className={styles.taskMeta}>
                      {room && <span className={styles.metaTag}>{room.name}</span>}
                      <span className={`${styles.metaTag} ${styles[`priority-${task.priority}`]}`}>
                        {task.priority}
                      </span>
                      <span className={`${styles.metaTag} ${styles[`status-${task.status}`]}`}>
                        {STATUSES.find(s => s.value === task.status)?.label}
                      </span>
                      {task.due_date && (
                        <span className={`${styles.metaTag} ${isOverdue ? styles.overdue : ''}`}>
                          Due {new Date(task.due_date).toLocaleDateString()}
                        </span>
                      )}
                      {task.client_visible && (
                        <span className={`${styles.metaTag} ${styles.clientTag}`}>
                          Visible to client
                        </span>
                      )}
                    </div>
                    {task.notes && <p className={styles.taskNotes}>{task.notes}</p>}
                  </div>
                </div>
                <div className={styles.taskActions}>
                  <button
                    className={`${styles.visibilityBtn} ${task.client_visible ? styles.visibilityOn : ''}`}
                    onClick={() => handleClientVisibleToggle(task)}
                    title={task.client_visible ? 'Hide from client' : 'Show to client'}
                  >
                    {task.client_visible ? 'Client: on' : 'Client: off'}
                  </button>
                  <button className={styles.btnAction} onClick={() => handleEdit(task)}>Edit</button>
                  <button className={`${styles.btnAction} ${styles.btnDanger}`} onClick={() => handleDelete(task.id)}>Delete</button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}