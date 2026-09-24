import api from './api'

// Backend: /api/users/me, /api/users, /api/users/{id}/status
export const userService = {
  async getMe() {
    const { data } = await api.get('/users/me')
    return data
  },
  async updateMe(payload) {
    const { data } = await api.put('/users/me', payload)
    return data
  },
  async changePassword(currentPassword, newPassword) {
    const { data } = await api.post('/users/me/change-password', { currentPassword, newPassword })
    return data
  },
  async getAll({ search = '', page = 1, pageSize = 20 } = {}) {
    const { data } = await api.get('/users', { params: { search, page, pageSize } })
    return data
  },
  async updateStatus(id, isActive) {
    const { data } = await api.put(`/users/${id}/status`, { isActive })
    return data
  },
}
