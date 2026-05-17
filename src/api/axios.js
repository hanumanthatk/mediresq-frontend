// src/api/axios.js
import axios from 'axios'
import toast from 'react-hot-toast'

// ── Base URL ─────────────────────────────────────────────
// Uses environment variable for flexibility across environments
// Local:      /api  (proxied by Vite to localhost:8080)
// Production: https://mediresq-backend-6bwv.onrender.com/api
const BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : 'https://mediresq-backend-6bwv.onrender.com/api'

// ── Axios Instance ───────────────────────────────────────
const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 60000, // 60s — Render free tier has cold start delay of 30-60s
})

// ── Request Interceptor: Attach JWT ─────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error)
)

// ── Response Interceptor: Handle Errors ──────────────────
api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config

    // ── No response (server down / cold start) ──
    if (!error.response) {
      toast.error(
        'Server is starting up. Please wait 30 seconds and try again.',
        { duration: 6000 }
      )
      return Promise.reject(error)
    }

    // ── 401 Unauthorized: Try token refresh ──
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('refreshToken')
        if (!refreshToken) throw new Error('No refresh token')

        const { data } = await axios.post(
          `${BASE_URL}/auth/refresh`,
          null,
          {
            headers: { 'Refresh-Token': refreshToken },
            timeout: 60000,
          }
        )

        // Save new access token
        localStorage.setItem('accessToken', data.accessToken)

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`
        return api(originalRequest)

      } catch (refreshError) {
        // Refresh failed — clear storage and redirect to login
        localStorage.clear()
        toast.error('Session expired. Please login again.')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    // ── 403 Forbidden ──
    if (error.response?.status === 403) {
      toast.error('Access denied. You do not have permission.')
    }

    // ── 404 Not Found ──
    if (error.response?.status === 404) {
      toast.error('Resource not found.')
    }

    // ── 500 Server Error ──
    if (error.response?.status === 500) {
      toast.error('Server error. Please try again.')
    }

    // ── 503 Service Unavailable (Render sleeping) ──
    if (error.response?.status === 503) {
      toast.error(
        'Server is waking up. Please try again in 30 seconds.',
        { duration: 6000 }
      )
    }

    return Promise.reject(error)
  }
)

export default api