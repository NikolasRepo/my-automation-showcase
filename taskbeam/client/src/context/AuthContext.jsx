import { createContext, useContext, useState, useEffect } from 'react'
import { getToken, getUser, saveAuth, clearAuth, isAuthenticated } from '../services/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isAuthenticated()) {
      setUser(getUser())
      setToken(getToken())
    }
    setLoading(false)
  }, [])

  function login(accessToken, userData) {
    saveAuth(accessToken, userData)
    setToken(accessToken)
    setUser(userData)
  }

  function logout() {
    clearAuth()
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}