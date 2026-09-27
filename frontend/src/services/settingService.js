import api from './api'

// Backend: /api/settings (Admin only)
export const settingService = {
  async getAll() {
    const { data } = await api.get('/settings')
    return data
  },
  async getByKey(key) {
    const { data } = await api.get(`/settings/${encodeURIComponent(key)}`)
    return data
  },
  async updateByKey(key, { value, description }) {
    const { data } = await api.put(`/settings/${encodeURIComponent(key)}`, { value, description })
    return data
  },
  async upsert({ key, value, description }) {
    const { data } = await api.post('/settings', { key, value, description })
    return data
  },
}
