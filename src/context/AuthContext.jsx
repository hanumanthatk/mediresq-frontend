import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authApi } from '../api/authApi'
import toast from 'react-hot-toast'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {

  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Restore session
  useEffect(() => {

    const storedUser = localStorage.getItem('user')
    const token = localStorage.getItem('accessToken')

    if (storedUser && token) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (error) {
        localStorage.clear()
      }
    }

    setLoading(false)

  }, [])

  // LOGIN
  const login = useCallback(async (email, password) => {

    try {

      const response = await authApi.login({
        email,
        password
      })

      const data = response.data

      localStorage.setItem('accessToken', data.accessToken)
      localStorage.setItem('refreshToken', data.refreshToken)

      const currentUser = {
        id: data.userId,
        email: data.email,
        name: data.fullName,
        role: data.role,
        hospitalId: data.hospitalId ?? null
      }

      localStorage.setItem('user', JSON.stringify(currentUser))

      setUser(currentUser)

      toast.success('Login successful')

      return data

    } catch (error) {

      console.error('LOGIN ERROR:', error)

      toast.error(
        error?.response?.data?.message || 'Invalid credentials'
      )

      throw error
    }

  }, [])

  // REGISTER
  const register = useCallback(async (payload) => {

    try {

      const response = await authApi.register(payload)

      const data = response.data

      localStorage.setItem('accessToken', data.accessToken)
      localStorage.setItem('refreshToken', data.refreshToken)

      const currentUser = {
        id: data.userId,
        email: data.email,
        name: data.fullName,
        role: data.role,
        hospitalId: null
      }

      localStorage.setItem('user', JSON.stringify(currentUser))

      setUser(currentUser)

      toast.success('Registration successful')

      return data

    } catch (error) {

      console.error('REGISTER ERROR:', error)

      toast.error(
        error?.response?.data?.message || 'Registration failed'
      )

      throw error
    }

  }, [])

  // LOGOUT
  const logout = useCallback(() => {

    localStorage.clear()

    setUser(null)

    toast.success('Logged out successfully')

  }, [])

  const isAdmin = user?.role === 'ADMIN'
  const isHospital = user?.role === 'HOSPITAL'
  const isPatient = user?.role === 'PATIENT'

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        isAdmin,
        isHospital,
        isPatient
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {

  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return context
}