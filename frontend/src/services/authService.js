import api, { tokenStorage } from './api'

// Backend: POST /api/auth/* — ApiResponse bọc { success, message, data, errors }
export const authService = {
  async register(payload) {
    const { data } = await api.post('/auth/register', payload)
    if (data?.data) tokenStorage.set(data.data.accessToken, data.data.refreshToken)
    return data
  },
  async login(payload) {
    const { data } = await api.post('/auth/login', payload)
    if (data?.data) tokenStorage.set(data.data.accessToken, data.data.refreshToken)
    return data
  },
  async logout() {
    const refreshToken = tokenStorage.getRefresh()
    try {
      if (refreshToken) await api.post('/auth/logout', { refreshToken })
    } finally {
      tokenStorage.clear()
    }
  },
  async verifyEmail(token) {
    const { data } = await api.post('/auth/verify-email', { token })
    return data
  },
  async forgotPassword(email) {
    const { data } = await api.post('/auth/forgot-password', { email })
    return data
  },
  async resetPassword(token, newPassword) {
    const { data } = await api.post('/auth/reset-password', { token, newPassword })
    return data
  },
}
