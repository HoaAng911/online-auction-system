import api from './api'

// Backend: /api/notifications, /api/notifications/unread-count, /api/notifications/{id}/read, /api/notifications/read-all
export const notificationService = {
  async getMy({ page = 1, pageSize = 20 } = {}) {
    const { data } = await api.get('/notifications', { params: { page, pageSize } })
    return data
  },
  async getUnreadCount() {
    const { data } = await api.get('/notifications/unread-count')
    return data
  },
  async markAsRead(id) {
    const { data } = await api.put(`/notifications/${id}/read`)
    return data
  },
  async markAllAsRead() {
    const { data } = await api.put('/notifications/read-all')
    return data
  },
}
