import { useState } from 'react'
import styles from './Projects.module.css'

const emptyProject = {
  name: '',
  clientName: '',
  budget: '',
}

export default function Projects({ projects, activeProjectId, setActiveProjectId, onCreateProject, onUpdateProject, onDeleteProject, summaries }) {
  const [form, setForm] = useState(emptyProject)
  const [editId, setEditId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit() {
    if (!form.name) return
    setSaving(true)
    try {
      if (editId !== null) {
        await onUpdateProject(editId, {
          name: form.name,
          client_name: form.clientName,
          budget: form.budget ? parseFloat(form.budget) : null,
        })
        setEditId(null)
      } else {
        await onCreateProject({
          name: form.name,
          client_name: form.clientName,
          budget: form.budget ? parseFloat(form.budget) : null,
        })
      }
      setForm(emptyProject)
      setShowForm(false)
    } catch (err) {
      console.error('Failed to save project:', err)
    } finally {
      setSaving(false)
    }
  }

  function handleEdit(project) {
    setForm({
      name: project.name,
      clientName: project.client_name || '',
      budget: project.budget || '',
    })
    setEditId(project.id)
    setShowForm(true)
  }

  async function handleDelete(id) {
    try {
      await onDeleteProject(id)
    } catch (err) {
      console.error('Failed to delete project:', err)
    }
  }

  function handleCancel() {
    setForm(emptyProject)
    setEditId(null)
    setShowForm(false)
  }

  return (
    <div className={styles.page}>
      <div className={styles.topbar}>
        <div>
          <h1 className={styles.title}>Projects</h1>
          <span className={styles.sub}>{projects.length} project{projects.length !== 1 ? 's' : ''}</span>
        </div>
        <button className={styles.btnPrimary} onClick={() => setShowForm(true)}>
          + New project
        </button>
      </div>

      {showForm && (
        <div className={styles.formCard}>
          <h2 className={styles.formTitle}>{editId ? 'Edit project' : 'New project'}</h2>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Project name</label>
              <input
                className={styles.input}
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. 412 Maple Rd remodel"
                autoFocus
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Client name</label>
              <input
                className={styles.input}
                name="clientName"
                value={form.clientName}
                onChange={handleChange}
                placeholder="e.g. John Smith"
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Budget (optional, $)</label>
              <input
                className={styles.input}
                name="budget"
                type="number"
                value={form.budget}
                onChange={handleChange}
                placeholder="e.g. 50000"
              />
            </div>
          </div>
          <div className={styles.formActions}>
            <button className={styles.btnSecondary} onClick={handleCancel}>Cancel</button>
            <button className={styles.btnPrimary} onClick={handleSubmit} disabled={saving}>
              {saving ? 'Saving...' : editId ? 'Save changes' : 'Create project'}
            </button>
          </div>
        </div>
      )}

      {projects.length === 0 && !showForm ? (
        <div className={styles.empty}>
          <p>No projects yet. Create your first project to get started.</p>
        </div>
      ) : (
        <div className={styles.projectList}>
          {projects.map(project => {
            const summary = summaries[project.id] || {}
            return (
              <div
                key={project.id}
                className={`${styles.projectCard} ${activeProjectId === project.id ? styles.activeCard : ''}`}
              >
                <div className={styles.projectTop}>
                  <div className={styles.projectInfo}>
                    <span className={styles.projectName}>{project.name}</span>
                    <span className={styles.projectMeta}>
                      {project.client_name ? `Client: ${project.client_name}` : 'No client set'}
                      {' · '}Created {new Date(project.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className={styles.projectActions}>
                    {activeProjectId !== project.id && (
                      <button
                        className={styles.btnActive}
                        onClick={() => setActiveProjectId(project.id)}
                      >
                        Switch to
                      </button>
                    )}
                    {activeProjectId === project.id && (
                      <span className={styles.activeBadge}>Active</span>
                    )}
                    <button className={styles.btnAction} onClick={() => handleEdit(project)}>Edit</button>
                    <button
                      className={`${styles.btnAction} ${styles.btnDanger}`}
                      onClick={() => handleDelete(project.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className={styles.projectSummary}>
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryValue}>{summary.room_count || 0}</span>
                    <span className={styles.summaryLabel}>Rooms</span>
                  </div>
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryValue}>{parseFloat(summary.total_area || 0).toFixed(0)} sq ft</span>
                    <span className={styles.summaryLabel}>Total area</span>
                  </div>
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryValue}>{summary.material_count || 0}</span>
                    <span className={styles.summaryLabel}>Materials</span>
                    <span className={styles.summaryCost}>${parseFloat(summary.material_cost || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                  </div>
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryValue}>
                      {summary.task_count > 0
                        ? `${summary.tasks_done}/${summary.task_count}`
                        : '—'}
                    </span>
                    <span className={styles.summaryLabel}>Tasks done</span>
                  </div>
                </div>

                {project.budget && (
                  <div className={styles.budgetBar}>
                    <div className={styles.budgetInfo}>
                      <span className={styles.budgetLabel}>Budget</span>
                      <span className={styles.budgetAmount}>${parseFloat(project.budget).toLocaleString()}</span>
                    </div>
                    <div className={styles.budgetTrack}>
                      <div
                        className={`${styles.budgetFill} ${
                          parseFloat(summary.material_cost || 0) > parseFloat(project.budget)
                            ? styles.budgetOver
                            : parseFloat(summary.material_cost || 0) > parseFloat(project.budget) * 0.9
                            ? styles.budgetNear
                            : styles.budgetUnder
                        }`}
                        style={{
                          width: `${Math.min(
                            (parseFloat(summary.material_cost || 0) / parseFloat(project.budget)) * 100,
                            100
                          )}%`
                        }}
                      />
                    </div>
                    <span className={`${styles.budgetStatus} ${
                      parseFloat(summary.material_cost || 0) > parseFloat(project.budget)
                        ? styles.budgetStatusOver
                        : parseFloat(summary.material_cost || 0) > parseFloat(project.budget) * 0.9
                        ? styles.budgetStatusNear
                        : styles.budgetStatusUnder
                    }`}>
                      {parseFloat(summary.material_cost || 0) > parseFloat(project.budget)
                        ? `$${(parseFloat(summary.material_cost || 0) - parseFloat(project.budget)).toLocaleString(undefined, {maximumFractionDigits: 0})} over`
                        : `$${(parseFloat(project.budget) - parseFloat(summary.material_cost || 0)).toLocaleString(undefined, {maximumFractionDigits: 0})} remaining`
                      }
                    </span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}