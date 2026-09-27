import { useCallback, useEffect, useState } from 'react'
import { Alert, Eyebrow } from '../components/ui'
import { getApiErrorMessage } from '../services/api'
import { notificationService } from '../services/notificationService'
import { Button } from '../components/ui/button'

const PAGE_SIZE = 20

function formatDate(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString('vi-VN')
}

export default function Notifications() {
  const [items, setItems] = useState([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')
  const [acting, setActing] = useState('')

  const load = useCallback(async (targetPage, append = false) => {
    if (append) setLoadingMore(true)
    else setLoading(true)
    setError('')
    try {
      const res = await notificationService.getMy({ page: targetPage, pageSize: PAGE_SIZE })
      const list = res.data || []
      setItems((prev) => (append ? [...prev, ...list] : list))
      setHasMore(list.length === PAGE_SIZE)
      setPage(targetPage)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Tải thông báo thất bại'))
    } finally {
      if (append) setLoadingMore(false)
      else setLoading(false)
    }
  }, [])

  useEffect(() => {
    load(1)
  }, [load])

  const markOne = async (id) => {
    setActing(id)
    try {
      await notificationService.markAsRead(id)
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)))
      window.dispatchEvent(new Event('notifications:changed'))
    } catch (err) {
      setError(getApiErrorMessage(err, 'Đánh dấu đã đọc thất bại'))
    } finally {
      setActing('')
    }
  }

  const markAll = async () => {
    setActing('all')
    try {
      await notificationService.markAllAsRead()
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })))
      window.dispatchEvent(new Event('notifications:changed'))
    } catch (err) {
      setError(getApiErrorMessage(err, 'Đánh dấu tất cả thất bại'))
    } finally {
      setActing('')
    }
  }

  const unread = items.filter((n) => !n.isRead).length

  return (
    <div className="container-page section-pad">
      <Eyebrow>Thông báo</Eyebrow>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <h1 className="display-tight font-display text-[clamp(24px,4vw,34px)] font-semibold text-[var(--color-text)]">
          Thông báo của bạn
        </h1>
        <div className="flex items-center gap-3">
          {unread > 0 && (
            <span className="rounded-[var(--radius-sm)] bg-[var(--color-brand)] px-2.5 py-1 font-[var(--font-mono)] text-[11px] font-semibold text-white">
              {unread} chưa đọc
            </span>
          )}
          <Button variant="ghost" size="sm" onClick={markAll} disabled={acting === 'all' || unread === 0}>
            {acting === 'all' ? 'Đang xử lý…' : 'Đánh dấu tất cả đã đọc'}
          </Button>
        </div>
      </div>

      <div className="mt-4">
        <Alert type="error">{error}</Alert>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        {loading ? (
          <p className="rounded-[var(--radius)] border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-8 text-center text-[13px] text-[var(--color-text-dim)]">
            Đang tải...
          </p>
        ) : items.length === 0 ? (
          <p className="rounded-[var(--radius)] border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-8 text-center text-[13px] text-[var(--color-text-dim)]">
            Chưa có thông báo nào
          </p>
        ) : (
          items.map((n) => (
            <article
              key={n.id}
              className={`flex items-start gap-3 rounded-[var(--radius)] border px-4 py-3.5 transition-colors ${n.isRead
                ? 'border-[var(--color-line)] bg-[var(--color-surface)]'
                : 'border-[var(--color-brand)]/40 bg-[var(--color-brand)]/[0.05]'
                }`}
            >
              <span
                aria-hidden
                className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.isRead ? 'bg-[var(--color-line-strong)]' : 'bg-[var(--color-brand)]'}`}
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-[14px] font-semibold text-[var(--color-text)]">{n.title}</h2>
                  {n.type && (
                    <span className="rounded-[var(--radius-sm)] border border-[var(--color-line-strong)] px-1.5 py-0.5 font-[var(--font-mono)] text-[10px] uppercase tracking-wider text-[var(--color-text-dim)]">
                      {n.type}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-[13px] leading-relaxed text-[var(--color-text-muted)]">{n.message}</p>
                <p className="mt-1.5 font-[var(--font-mono)] text-[11px] text-[var(--color-text-dim)]">{formatDate(n.createdAt)}</p>
              </div>
              {!n.isRead && (
                <button
                  onClick={() => markOne(n.id)}
                  disabled={acting === n.id}
                  className="shrink-0 text-[12px] font-medium text-[var(--color-brand)] hover:underline disabled:opacity-50"
                >
                  {acting === n.id ? '…' : 'Đã đọc'}
                </button>
              )}
            </article>
          ))
        )}
      </div>

      {hasMore && !loading && items.length > 0 && (
        <div className="mt-4 text-center">
          <Button variant="ghost" onClick={() => load(page + 1, true)} disabled={loadingMore}>
            {loadingMore ? 'Đang tải…' : 'Xem thêm'}
          </Button>
        </div>
      )}
    </div>
  )
}
