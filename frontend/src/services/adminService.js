import api from './api'

// Backend: /api/admin/dashboard (Admin only)
export const adminService = {
  async getDashboard() {
    const { data } = await api.get('/admin/dashboard')
    return data
  },
}
