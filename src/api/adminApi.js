import api from './axios'

export const adminApi = {
  getStats:           ()         => api.get('/admin/dashboard/stats'),
  getUsers:           ()         => api.get('/admin/users'),
  getUsersByRole:     (role)     => api.get(`/admin/users/role/${role}`),
  toggleUserStatus:   (id)       => api.patch(`/admin/users/${id}/toggle-status`),
  getHospitals:       ()         => api.get('/admin/hospitals'),
  verifyHospital:     (id, v)    => api.patch(`/admin/hospitals/${id}/verify?verified=${v}`),
  toggleHospital:     (id)       => api.patch(`/admin/hospitals/${id}/toggle-status`),
  getAllRequests:      ()         => api.get('/admin/requests'),
  getNotifications:   ()         => api.get('/patient/notifications'),
  markAllRead:        ()         => api.patch('/patient/notifications/read-all'),
  getUnreadCount:     ()         => api.get('/patient/notifications/unread-count'),
}
