import api from './axios'

export const hospitalApi = {
  // Public / patient
  getAll:       ()         => api.get('/patient/hospitals'),
  getNearby:    (lat, lng, radius = 10) =>
                api.get(`/patient/hospitals/nearby?lat=${lat}&lng=${lng}&radius=${radius}`),
  getById:      (id)       => api.get(`/patient/hospitals/${id}`),

  // Hospital self management
  getProfile:   ()         => api.get('/hospital/profile'),
  createProfile:(data)     => api.post('/hospital/profile', data),
  getDashboard: ()         => api.get('/hospital/dashboard'),

  // Beds
  getBeds:      ()         => api.get('/hospital/beds'),
  updateBed:    (data)     => api.put('/hospital/beds', data),

  // Ambulances
  getAmbulances: ()        => api.get('/hospital/ambulances'),
  updateAmbulanceStatus: (id, status) =>
                api.patch(`/hospital/ambulances/${id}/status?status=${status}`),

  // Requests
  getActiveRequests: ()    => api.get('/hospital/requests/active'),
  getAllRequests:     ()    => api.get('/hospital/requests'),
  updateRequestStatus: (id, data) =>
                api.patch(`/hospital/requests/${id}/status`, data),
}
