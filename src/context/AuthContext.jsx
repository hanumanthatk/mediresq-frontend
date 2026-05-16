import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authApi } from '../api/authApi'
import toast from 'react-hot-toast'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  // Restore session from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('user')
    const token  = localStorage.getItem('accessToken')
    if (stored && token) {
      try { setUser(JSON.parse(stored)) } catch { localStorage.clear() }
    }
    setLoading(false)
  }, [])

  const login = useCallback(async (email, password) => {
    const { data } = await authApi.login({ email, password })
    localStorage.setItem('accessToken',  data.accessToken)
    localStorage.setItem('refreshToken', data.refreshToken)
    localStorage.setItem('user', JSON.stringify({
      id:       data.userId,
      email:    data.email,
      name:     data.fullName,
      role:     data.role,
      hospitalId: data.hospitalId ?? null,
    }))
    setUser({ id: data.userId, email: data.email, name: data.fullName,
              role: data.role, hospitalId: data.hospitalId ?? null })
    return data
  }, [])

  const register = useCallback(async (payload) => {
    const { data } = await authApi.register(payload)
    localStorage.setItem('accessToken',  data.accessToken)
    localStorage.setItem('refreshToken', data.refreshToken)
    const u = { id: data.userId, email: data.email, name: data.fullName,
                role: data.role, hospitalId: null }
    localStorage.setItem('user', JSON.stringify(u))
    setUser(u)
    return data
  }, [])

  const logout = useCallback(() => {
    localStorage.clear()
    setUser(null)
    toast.success('Logged out successfully')
  }, [])

  const isAdmin    = user?.role === 'ADMIN'
  const isHospital = user?.role === 'HOSPITAL'
  const isPatient  = user?.role === 'PATIENT'

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout,
                                    isAdmin, isHospital, isPatient }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
