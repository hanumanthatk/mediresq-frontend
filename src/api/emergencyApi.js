import api from './axios'

export const emergencyApi = {
  createRequest:  (data)   => api.post('/patient/emergency/request', data),
  sendSOS:        (lat, lng, address) =>
                  api.post(`/patient/emergency/sos?lat=${lat}&lng=${lng}&address=${encodeURIComponent(address || '')}`),
  getMyRequests:  ()       => api.get('/patient/emergency/requests'),
  trackRequest:   (id)     => api.get(`/patient/emergency/requests/${id}`),
  cancelRequest:  (id)     => api.patch(`/patient/emergency/requests/${id}/cancel`),
}
