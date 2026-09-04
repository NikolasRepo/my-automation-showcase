import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Layout from './components/layout/Layout'
import Projects from './pages/Projects'
import Rooms from './pages/Rooms'
import Materials from './pages/Materials'
import Estimates from './pages/Estimates'
import Tasks from './pages/Tasks'
import ClientView from './pages/ClientView'
import Files from './pages/Files'
import FloorPlan from './pages/FloorPlan'
import Login from './pages/Login'
import Register from './pages/Register'
import Confirm from './pages/Confirm'
import { api } from './services/api'
import { AuthProvider, useAuth } from './context/AuthContext'

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return <div style={{ padding: '24px' }}>Loading...</div>
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return children
}

function AppRoutes() {
  const [projects, setProjects] = useState([])
  const [activeProjectId, setActiveProjectIdState] = useState(null)
  const [rooms, setRooms] = useState([])
  const [materials, setMaterials] = useState([])
  const [tasks, setTasks] = useState([])
  const [laborCosts, setLaborCosts] = useState({})
  const [files, setFiles] = useState([])
  const [summaries, setSummaries] = useState({})
  const [loading, setLoading] = useState(true)
  const { isAuthenticated, logout } = useAuth()

  const activeProject = projects.find(p => p.id === activeProjectId) || null
  const unitSystem = activeProject?.unit_system || 'imperial'

  function setActiveProjectId(id) {
    setActiveProjectIdState(id)
    if (id) {
      localStorage.setItem('taskbeam_active_project', id)
    } else {
      localStorage.removeItem('taskbeam_active_project')
    }
  }

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false)
      return
    }
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
        if (data.length > 0) {
          const savedId = localStorage.getItem('taskbeam_active_project')
          const savedProject = savedId && data.find(p => p.id === savedId)
          setActiveProjectIdState(savedProject ? savedId : data[0].id)
        }
      } catch (err) {
        console.error('Failed to load projects:', err)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [isAuthenticated])

  useEffect(() => {
    if (!activeProjectId) {
      setRooms([])
      setMaterials([])
      setTasks([])
      setLaborCosts({})
      setFiles([])
      return
    }
    async function loadProjectData() {
      try {
        const [r, m, t, l, f] = await Promise.all([
          api.getRooms(activeProjectId),
          api.getMaterials(activeProjectId),
          api.getTasks(activeProjectId),
          api.getLaborCosts(activeProjectId),
          api.getFiles(activeProjectId),
        ])
        setRooms(r)
        setMaterials(m)
        setTasks(t)
        const laborMap = {}
        l.forEach(lc => { laborMap[lc.room_id] = lc.amount })
        setLaborCosts(laborMap)
        setFiles(f)
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

  async function handleSaveLaborCost(roomId, amount) {
    try {
      await api.saveLaborCost({
        project_id: activeProjectId,
        room_id: roomId,
        amount: parseFloat(amount) || 0,
      })
      setLaborCosts(prev => ({ ...prev, [roomId]: amount }))
    } catch (err) {
      console.error('Failed to save labor cost:', err)
    }
  }

  if (loading && isAuthenticated) {
    return <div style={{ padding: '24px' }}>Loading...</div>
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/confirm" element={<Confirm />} />
      <Route path="*" element={
        <ProtectedRoute>
          <Layout activeProject={activeProject} onLogout={logout}>
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
                  unitSystem={unitSystem}
                />}
              />
              <Route path="/floorplan" element={
                <FloorPlan
                  rooms={rooms}
                  onUpdateRoom={handleUpdateRoom}
                />}
              />
              <Route path="/materials" element={
                <Materials
                  rooms={rooms}
                  materials={materials}
                  onCreateMaterial={handleCreateMaterial}
                  onUpdateMaterial={handleUpdateMaterial}
                  onDeleteMaterial={handleDeleteMaterial}
                  unitSystem={unitSystem}
                />}
              />
              <Route path="/estimates" element={
                <Estimates
                  rooms={rooms}
                  materials={materials}
                  activeProject={activeProject}
                  unitSystem={unitSystem}
                  laborCosts={laborCosts}
                  onSaveLaborCost={handleSaveLaborCost}
                />}
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
              <Route path="/files" element={
                <Files
                  files={files}
                  setFiles={setFiles}
                  activeProjectId={activeProjectId}
                />}
              />
              <Route path="/client" element={
                <ClientView
                  activeProject={activeProject}
                  rooms={rooms}
                  materials={materials}
                  tasks={tasks}
                  unitSystem={unitSystem}
                  files={files}
                />}
              />
            </Routes>
          </Layout>
        </ProtectedRoute>
      } />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App