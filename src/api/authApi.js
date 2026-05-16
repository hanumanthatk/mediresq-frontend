import api from './axios'

export const authApi = {

  register: (data) =>
    api.post('/auth/register', data),

  login: (data) =>
    api.post('/auth/login', data),

  refresh: (token) =>
    api.post('/auth/refresh', null, {
      headers: {
        'Refresh-Token': token
      }
    }),
}