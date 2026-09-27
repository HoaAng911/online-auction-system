import { useEffect, useState } from 'react'
import { Alert, Card, Eyebrow, StatCell } from '../components/ui'
import { getApiErrorMessage } from '../services/api'
import { adminService } from '../services/adminService'

function formatVnd(value) {
  const n = Number(value)
  if (Number.isNaN(n)) return String(value ?? '0')
  return n.toLocaleString('vi-VN') + ' ₫'
}

export default function AdminDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await adminService.getDashboard()
        if (alive) setData(res.data)
      } catch (err) {
        if (alive) setError(getApiErrorMessage(err, 'Tải dashboard thất bại'))
      } finally {
        if (alive) setLoading(false)
      }
    }
    load()
    return () => { alive = false }
  }, [])

  if (loading) {
    return (
      <div className="container-page section-pad">
        <p className="py-12 text-center text-[13px] text-[var(--color-text-dim)]">Đang tải thống kê...</p>
      </div>
    )
  }

  return (
    <div className="container-page section-pad">
      <Eyebrow>Quản trị</Eyebrow>
      <h1 className="display-tight font-display mt-2 text-[clamp(24px,4vw,34px)] font-semibold text-[var(--color-text)]">
        Tổng quan hệ thống
      </h1>
      <p className="mt-2 text-[13px] text-[var(--color-text-muted)]">
        Số liệu tổng hợp từ người dùng, phiên thắng, thanh toán, đánh giá và thông báo.
      </p>

      <div className="mt-4">
        <Alert type="error">{error}</Alert>
      </div>

      {data && (
        <>
          <div className="tech-grid mt-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCell label="Tổng người dùng" value={String(data.totalUsers ?? 0)} />
            <StatCell label="Phiên thắng" value={String(data.totalAuctionWinners ?? 0)} />
            <StatCell label="Tổng thanh toán" value={String(data.totalPayments ?? 0)} />
            <StatCell label="Doanh thu" value={formatVnd(data.totalRevenue ?? 0)} />
          </div>
          <div className="tech-grid mt-px sm:grid-cols-2 lg:grid-cols-4">
            <StatCell label="Tổng đánh giá" value={String(data.totalReviews ?? 0)} />
            <StatCell label="Rating trung bình" value={data.averageRating != null ? Number(data.averageRating).toFixed(1) : '—'} />
            <StatCell label="Thanh toán chờ" value={String(data.pendingPayments ?? 0)} />
            <StatCell label="Thông báo chưa đọc" value={String(data.unreadNotifications ?? 0)} />
          </div>

          <Card className="mt-4 p-5">
            <h2 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">Chi tiết</h2>
            <dl className="mt-3 grid gap-2 text-[13px] sm:grid-cols-2">
              <div className="flex justify-between border-b border-[var(--color-line)] py-2">
                <dt className="text-[var(--color-text-dim)]">Doanh thu</dt>
                <dd className="font-semibold text-[var(--color-text)]">{formatVnd(data.totalRevenue)}</dd>
              </div>
              <div className="flex justify-between border-b border-[var(--color-line)] py-2">
                <dt className="text-[var(--color-text-dim)]">Rating trung bình</dt>
                <dd className="font-semibold text-[var(--color-text)]">{data.averageRating?.toFixed?.(1) ?? '—'}</dd>
              </div>
            </dl>
          </Card>
        </>
      )}
    </div>
  )
}
