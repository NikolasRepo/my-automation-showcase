import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Layout from './components/layout/Layout'
import Projects from './pages/Projects'
import Rooms from './pages/Rooms'
import Materials from './pages/Materials'
import Estimates from './pages/Estimates'
import Tasks from './pages/Tasks'
import ClientView from './pages/ClientView'
import { api } from './services/api'

function App() {
  const [projects, setProjects] = useState([])
  const [activeProjectId, setActiveProjectId] = useState(null)
  const [rooms, setRooms] = useState([])
  const [materials, setMaterials] = useState([])
  const [tasks, setTasks] = useState([])
  const [summaries, setSummaries] = useState({})
  const [loading, setLoading] = useState(true)

  const activeProject = projects.find(p => p.id === activeProjectId) || null

  useEffect(() => {
    async function init() {
      try {
        const [data, summaryData] = await Promise.all([
          api.getProjects(),
          api.getProjectSummaries(),
        ])
        setProjects(data)
        const summaryMap = {}
        summaryData.forEach(s => { summaryMap[s.id] = s })
        setSummaries(summaryMap)
        if (data.length > 0) setActiveProjectId(data[0].id)
      } catch (err) {
        console.error('Failed to load projects:', err)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  useEffect(() => {
    if (!activeProjectId) {
      setRooms([])
      setMaterials([])
      setTasks([])
      return
    }
    async function loadProjectData() {
      try {
        const [r, m, t] = await Promise.all([
          api.getRooms(activeProjectId),
          api.getMaterials(activeProjectId),
          api.getTasks(activeProjectId),
        ])
        setRooms(r)
        setMaterials(m)
        setTasks(t)
      } catch (err) {
        console.error('Failed to load project data:', err)
      }
    }
    loadProjectData()
  }, [activeProjectId])

  async function refreshSummaries() {
    try {
      const summaryData = await api.getProjectSummaries()
      const summaryMap = {}
      summaryData.forEach(s => { summaryMap[s.id] = s })
      setSummaries(summaryMap)
    } catch (err) {
      console.error('Failed to refresh summaries:', err)
    }
  }

  async function handleCreateProject(data) {
    const project = await api.createProject(data)
    setProjects(prev => [...prev, project])
    setActiveProjectId(project.id)
    refreshSummaries()
    return project
  }

  async function handleUpdateProject(id, data) {
    const project = await api.updateProject(id, data)
    setProjects(prev => prev.map(p => p.id === id ? project : p))
    return project
  }

  async function handleDeleteProject(id) {
    await api.deleteProject(id)
    setProjects(prev => {
      const remaining = prev.filter(p => p.id !== id)
      if (activeProjectId === id) {
        setActiveProjectId(remaining.length > 0 ? remaining[0].id : null)
      }
      return remaining
    })
    refreshSummaries()
  }

  async function handleCreateRoom(data) {
    const room = await api.createRoom({ ...data, project_id: activeProjectId })
    setRooms(prev => [...prev, room])
    refreshSummaries()
    return room
  }

  async function handleUpdateRoom(id, data) {
    const room = await api.updateRoom(id, data)
    setRooms(prev => prev.map(r => r.id === id ? room : r))
    refreshSummaries()
    return room
  }

  async function handleDeleteRoom(id) {
    await api.deleteRoom(id)
    setRooms(prev => prev.filter(r => r.id !== id))
    refreshSummaries()
  }

  async function handleCreateMaterial(data) {
    const material = await api.createMaterial({ ...data, project_id: activeProjectId })
    setMaterials(prev => [...prev, material])
    refreshSummaries()
    return material
  }

  async function handleUpdateMaterial(id, data) {
    const material = await api.updateMaterial(id, data)
    setMaterials(prev => prev.map(m => m.id === id ? material : m))
    return material
  }

  async function handleDeleteMaterial(id) {
    await api.deleteMaterial(id)
    setMaterials(prev => prev.filter(m => m.id !== id))
    refreshSummaries()
  }

  async function handleCreateTask(data) {
    const task = await api.createTask({ ...data, project_id: activeProjectId })
    setTasks(prev => [...prev, task])
    refreshSummaries()
    return task
  }

  async function handleUpdateTask(id, data) {
    const task = await api.updateTask(id, data)
    setTasks(prev => prev.map(t => t.id === id ? task : t))
    return task
  }

  async function handleDeleteTask(id) {
    await api.deleteTask(id)
    setTasks(prev => prev.filter(t => t.id !== id))
    refreshSummaries()
  }

  if (loading) {
    return <div style={{ padding: '24px' }}>Loading...</div>
  }

  return (
    <BrowserRouter>
      <Layout activeProject={activeProject}>
        <Routes>
          <Route path="/" element={
            <Projects
              projects={projects}
              activeProjectId={activeProjectId}
              setActiveProjectId={setActiveProjectId}
              onCreateProject={handleCreateProject}
              onUpdateProject={handleUpdateProject}
              onDeleteProject={handleDeleteProject}
              summaries={summaries}
            />}
          />
          <Route path="/rooms" element={
            <Rooms
              rooms={rooms}
              onCreateRoom={handleCreateRoom}
              onUpdateRoom={handleUpdateRoom}
              onDeleteRoom={handleDeleteRoom}
            />}
          />
          <Route path="/materials" element={
            <Materials
              rooms={rooms}
              materials={materials}
              onCreateMaterial={handleCreateMaterial}
              onUpdateMaterial={handleUpdateMaterial}
              onDeleteMaterial={handleDeleteMaterial}
            />}
          />
          <Route path="/estimates" element={
            <Estimates rooms={rooms} materials={materials} activeProject={activeProject} />}
          />
          <Route path="/tasks" element={
            <Tasks
              rooms={rooms}
              tasks={tasks}
              onCreateTask={handleCreateTask}
              onUpdateTask={handleUpdateTask}
              onDeleteTask={handleDeleteTask}
            />}
          />
          <Route path="/client" element={
            <ClientView
              activeProject={activeProject}
              rooms={rooms}
              materials={materials}
              tasks={tasks}
            />}
          />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}

export default App