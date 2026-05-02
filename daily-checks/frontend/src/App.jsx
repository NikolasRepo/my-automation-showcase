// frontend/src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Navbar from './components/Navbar'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import InspectionForm from './pages/InspectionForm'
import InspectionHistory from './pages/InspectionHistory'
import Alerts from './pages/Alerts'
import Reports from './pages/Reports'
import AdminPanel from './pages/AdminPanel'
import { useAuth } from './context/AuthContext'
 
function Layout({ children }) {
  const { isAuthenticated } = useAuth()
  return (
    <>
      {isAuthenticated && <Navbar />}
      <main>{children}</main>
    </>
  )
}
 
function AppRoutes() {
  return (
    <Layout>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={
          <ProtectedRoute><Dashboard /></ProtectedRoute>
        } />
        <Route path="/inspect" element={
          <ProtectedRoute roles={['operator', 'admin']}><InspectionForm /></ProtectedRoute>
        } />
        <Route path="/history" element={
          <ProtectedRoute><InspectionHistory /></ProtectedRoute>
        } />
        <Route path="/alerts" element={
          <ProtectedRoute roles={['leader', 'admin']}><Alerts /></ProtectedRoute>
        } />
        <Route path="/reports" element={
          <ProtectedRoute roles={['leader', 'admin']}><Reports /></ProtectedRoute>
        } />
        <Route path="/admin" element={
          <ProtectedRoute roles={['admin']}><AdminPanel /></ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  )
}
 
export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}