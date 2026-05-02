// frontend/src/context/AuthContext.jsx
import { createContext, useContext, useState, useCallback } from 'react'
import api from '../api/client'
 
const AuthContext = createContext(null)
 
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = sessionStorage.getItem('user')
      return stored ? JSON.parse(stored) : null
    } catch { return null }
  })
  const [token, setToken] = useState(() => sessionStorage.getItem('token') || null)
 
  const _storeSession = (data) => {
    sessionStorage.setItem('token', data.access_token)
    sessionStorage.setItem('user', JSON.stringify(data.user))
    setToken(data.access_token)
    setUser(data.user)
    return data.user
  }
 
  // Operator login — name only, no password
  const loginOperator = useCallback(async (fullName) => {
    const { data } = await api.post('/auth/token/operator', { full_name: fullName })
    return _storeSession(data)
  }, [])
 
  // Leader / Admin login — username and password
  const loginLeader = useCallback(async (username, password) => {
    const params = new URLSearchParams()
    params.append('username', username)
    params.append('password', password)
    const { data } = await api.post('/auth/token', params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    })
    return _storeSession(data)
  }, [])
 
  const logout = useCallback(() => {
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('user')
    setToken(null)
    setUser(null)
  }, [])
 
  return (
    <AuthContext.Provider value={{
      user,
      token,
      loginOperator,
      loginLeader,
      logout,
      isAuthenticated: !!token,
    }}>
      {children}
    </AuthContext.Provider>
  )
}
 
export const useAuth = () => useContext(AuthContext)