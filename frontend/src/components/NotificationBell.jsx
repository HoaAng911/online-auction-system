import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { notificationService } from '../services/notificationService'

/** Chuông thông báo trên navbar — hiển thị số chưa đọc, tự refresh khi có sự kiện. */
export default function NotificationBell({ onNavigate }) {
  const { isAuthenticated } = useAuth()
  const [count, setCount] = useState(0)

  const load = useCallback(async () => {
    if (!isAuthenticated) {
      setCount(0)
      return
    }
    try {
      const res = await notificationService.getUnreadCount()
      setCount(res.data ?? 0)
    } catch {
      // Im lặng — không chặn navbar khi API lỗi
    }
  }, [isAuthenticated])

  useEffect(() => {
    load()
    const refresh = () => load()
    window.addEventListener('notifications:changed', refresh)
    window.addEventListener('auth:refreshed', refresh)
    const timer = setInterval(load, 60000) // poll mỗi phút
    return () => {
      window.removeEventListener('notifications:changed', refresh)
      window.removeEventListener('auth:refreshed', refresh)
      clearInterval(timer)
    }
  }, [load])

  if (!isAuthenticated) return null

  return (
    <Link
      to="/notifications"
      onClick={onNavigate}
      aria-label={`Thông báo${count > 0 ? `, ${count} chưa đọc` : ''}`}
      className="relative grid h-9 w-9 place-items-center rounded-[var(--radius-sm)] border border-[var(--color-line-strong)] text-[15px] text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-brand)] hover:text-[var(--color-text)]"
    >
      <span aria-hidden>🔔</span>
      {count > 0 && (
        <span className="absolute -right-1.5 -top-1.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-[var(--color-brand)] px-1 font-[var(--font-mono)] text-[10px] font-bold leading-none text-white">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  )
}
