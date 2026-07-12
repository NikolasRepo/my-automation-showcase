import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useState } from 'react'
import Layout from './components/layout/Layout'
import Projects from './pages/Projects'
import Rooms from './pages/Rooms'
import Materials from './pages/Materials'
import Estimates from './pages/Estimates'
import Tasks from './pages/Tasks'
import ClientView from './pages/ClientView'

function App() {
  const [projects, setProjects] = useState([])
  const [activeProjectId, setActiveProjectId] = useState(null)

  const activeProject = projects.find(p => p.id === activeProjectId) || null

  function updateActiveProject(field, value) {
    setProjects(projects.map(p =>
      p.id === activeProjectId ? { ...p, [field]: value } : p
    ))
  }

  const rooms = activeProject?.rooms || []
  const materials = activeProject?.materials || []
  const tasks = activeProject?.tasks || []

  function setRooms(value) {
    updateActiveProject('rooms', typeof value === 'function' ? value(rooms) : value)
  }

  function setMaterials(value) {
    updateActiveProject('materials', typeof value === 'function' ? value(materials) : value)
  }

  function setTasks(value) {
    updateActiveProject('tasks', typeof value === 'function' ? value(tasks) : value)
  }

  return (
    <BrowserRouter>
      <Layout activeProject={activeProject}>
        <Routes>
          <Route path="/" element={
            <Projects
              projects={projects}
              setProjects={setProjects}
              activeProjectId={activeProjectId}
              setActiveProjectId={setActiveProjectId}
            />}
          />
          <Route path="/rooms" element={<Rooms rooms={rooms} setRooms={setRooms} />} />
          <Route path="/materials" element={<Materials rooms={rooms} materials={materials} setMaterials={setMaterials} />} />
          <Route path="/estimates" element={<Estimates rooms={rooms} materials={materials} />} />
          <Route path="/tasks" element={<Tasks rooms={rooms} tasks={tasks} setTasks={setTasks} />} />
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