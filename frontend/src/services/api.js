import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

const ACCESS_KEY = 'auction.accessToken'
const REFRESH_KEY = 'auction.refreshToken'

export const tokenStorage = {
  getAccess: () => localStorage.getItem(ACCESS_KEY),
  getRefresh: () => localStorage.getItem(REFRESH_KEY),
  set: (access, refresh) => {
    if (access) localStorage.setItem(ACCESS_KEY, access)
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh)
  },
  clear: () => {
    localStorage.removeItem(ACCESS_KEY)
    localStorage.removeItem(REFRESH_KEY)
  },
}

// Gắn access token vào mọi request
api.interceptors.request.use((config) => {
  const token = tokenStorage.getAccess()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Tự động refresh khi gặp 401 (trừ chính endpoint refresh/logout)
let isRefreshing = false
let queue = []

function flushQueue(error, token) {
  queue.forEach((p) => (error ? p.reject(error) : p.resolve(token)))
  queue = []
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    const status = error.response?.status
    const url = original?.url || ''

    if (status === 401 && !original._retry && !url.includes('refresh-token') && !url.includes('logout')) {
      const refreshToken = tokenStorage.getRefresh()
      if (!refreshToken) {
        tokenStorage.clear()
        return Promise.reject(error)
      }
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          queue.push({ resolve, reject })
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`
          return api(original)
        })
      }
      original._retry = true
      isRefreshing = true
      try {
        const { data } = await axios.post(`${API_BASE}/auth/refresh-token`, { refreshToken })
        const payload = data?.data
        tokenStorage.set(payload.accessToken, payload.refreshToken)
        window.dispatchEvent(new CustomEvent('auth:refreshed', { detail: payload }))
        flushQueue(null, payload.accessToken)
        original.headers.Authorization = `Bearer ${payload.accessToken}`
        return api(original)
      } catch (e) {
        flushQueue(e, null)
        tokenStorage.clear()
        window.dispatchEvent(new Event('auth:logout'))
        return Promise.reject(e)
      } finally {
        isRefreshing = false
      }
    }
    return Promise.reject(error)
  },
)

// Chuẩn hóa lỗi ApiResponse backend -> message tiếng Việt dễ hiển thị
export function getApiErrorMessage(error, fallback = 'Đã có lỗi xảy ra') {
  const res = error?.response?.data
  if (!res) return error?.message || fallback
  if (res.errors?.length) return res.errors.join('; ')
  return res.message || fallback
}

export default api
