import { useState } from 'react'
import styles from './Projects.module.css'

const emptyProject = {
  name: '',
  clientName: '',
}

export default function Projects({ projects, setProjects, activeProjectId, setActiveProjectId }) {
  const [form, setForm] = useState(emptyProject)
  const [editId, setEditId] = useState(null)
  const [showForm, setShowForm] = useState(false)

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  function handleSubmit() {
    if (!form.name) return
    if (editId !== null) {
      setProjects(projects.map(p => p.id === editId ? { ...form, id: editId } : p))
      setEditId(null)
    } else {
      const newProject = {
        ...form,
        id: Date.now(),
        createdAt: new Date().toLocaleDateString(),
        rooms: [],
        materials: [],
        tasks: [],
      }
      setProjects([...projects, newProject])
      if (!activeProjectId) setActiveProjectId(newProject.id)
    }
    setForm(emptyProject)
    setShowForm(false)
  }

  function handleEdit(project) {
    setForm({ name: project.name, clientName: project.clientName })
    setEditId(project.id)
    setShowForm(true)
  }

  function handleDelete(id) {
    setProjects(projects.filter(p => p.id !== id))
    if (activeProjectId === id) {
      const remaining = projects.filter(p => p.id !== id)
      setActiveProjectId(remaining.length > 0 ? remaining[0].id : null)
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
          </div>
          <div className={styles.formActions}>
            <button className={styles.btnSecondary} onClick={handleCancel}>Cancel</button>
            <button className={styles.btnPrimary} onClick={handleSubmit}>
              {editId ? 'Save changes' : 'Create project'}
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
            const projectRooms = project.rooms || []
            const projectMaterials = project.materials || []
            const projectTasks = project.tasks || []
            const totalArea = projectRooms.reduce((sum, r) =>
              sum + parseFloat(r.length) * parseFloat(r.width), 0
            )
            const tasksDone = projectTasks.filter(t => t.status === 'done').length
            return (
              <div
                key={project.id}
                className={`${styles.projectCard} ${activeProjectId === project.id ? styles.activeCard : ''}`}
              >
                <div className={styles.projectTop}>
                  <div className={styles.projectInfo}>
                    <span className={styles.projectName}>{project.name}</span>
                    <span className={styles.projectMeta}>
                      {project.clientName ? `Client: ${project.clientName}` : 'No client set'}
                      {' · '}Created {project.createdAt}
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
                    <span className={styles.summaryValue}>{projectRooms.length}</span>
                    <span className={styles.summaryLabel}>Rooms</span>
                  </div>
                  <div className={styles.summaryDivider} />
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryValue}>{totalArea.toFixed(0)} sq ft</span>
                    <span className={styles.summaryLabel}>Total area</span>
                  </div>
                  <div className={styles.summaryDivider} />
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryValue}>{projectMaterials.length}</span>
                    <span className={styles.summaryLabel}>Materials</span>
                  </div>
                  <div className={styles.summaryDivider} />
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryValue}>
                      {projectTasks.length > 0
                        ? `${tasksDone}/${projectTasks.length}`
                        : '—'}
                    </span>
                    <span className={styles.summaryLabel}>Tasks done</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}