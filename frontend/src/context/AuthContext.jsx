import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { tokenStorage } from '../services/api'
import { authService } from '../services/authService'
import { userService } from '../services/userService'

const AuthContext = createContext(null)

function decodeJwt(token) {
  try {
    const payload = token.split('.')[1]
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchMe = useCallback(async () => {
    try {
      const res = await userService.getMe()
      setUser(res.data)
      return res.data
    } catch {
      setUser(null)
      return null
    }
  }, [])

  // Khởi động: nếu có token thì lấy /me, decode role nhanh để render guard
  useEffect(() => {
    const boot = async () => {
      const token = tokenStorage.getAccess()
      if (!token) {
        setLoading(false)
        return
      }
      const claims = decodeJwt(token)
      if (claims) {
        setUser((prev) => prev ?? {
          id: claims['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'],
          username: claims['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'],
          role: claims['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'],
        })
      }
      await fetchMe()
      setLoading(false)
    }
    boot()

    const onLogout = () => setUser(null)
    const onRefreshed = () => fetchMe()
    window.addEventListener('auth:logout', onLogout)
    window.addEventListener('auth:refreshed', onRefreshed)
    return () => {
      window.removeEventListener('auth:logout', onLogout)
      window.removeEventListener('auth:refreshed', onRefreshed)
    }
  }, [fetchMe])

  const login = useCallback(async (payload) => {
    const res = await authService.login(payload)
    setUser(res.data.user)
    return res
  }, [])

  const register = useCallback(async (payload) => {
    const res = await authService.register(payload)
    setUser(res.data.user)
    return res
  }, [])

  const logout = useCallback(async () => {
    await authService.logout()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: !!user,
      isAdmin: user?.role === 'Admin',
      login,
      register,
      logout,
      refreshMe: fetchMe,
      setUser,
    }),
    [user, loading, login, register, logout, fetchMe],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth phải dùng trong <AuthProvider>')
  return ctx
}
