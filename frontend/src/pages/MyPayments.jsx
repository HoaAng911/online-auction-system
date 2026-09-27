import { useCallback, useEffect, useState } from 'react'
import { Alert, Card, Eyebrow } from '../components/ui'
import { getApiErrorMessage } from '../services/api'
import { PAYMENT_METHODS, paymentService } from '../services/paymentService'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'

const PAGE_SIZE = 20

function formatVnd(value) {
  const n = Number(value)
  if (Number.isNaN(n)) return String(value ?? '')
  return n.toLocaleString('vi-VN') + ' ₫'
}

function formatDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('vi-VN')
}

const STATUS_LABEL = {
  Success: 'Thành công',
  Pending: 'Đang chờ',
  Failed: 'Thất bại',
}

export default function MyPayments() {
  const [payments, setPayments] = useState([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')

  // Form mock-pay: nhập AuctionWinnerId + chọn phương thức (dùng khi Long chưa có UI thắng đấu giá)
  const [winnerId, setWinnerId] = useState('')
  const [method, setMethod] = useState(PAYMENT_METHODS[0])
  const [paying, setPaying] = useState(false)
  const [payMsg, setPayMsg] = useState('')
  const [payError, setPayError] = useState('')

  const load = useCallback(async (targetPage, append = false) => {
    if (append) setLoadingMore(true)
    else setLoading(true)
    setError('')
    try {
      const res = await paymentService.getMy({ page: targetPage, pageSize: PAGE_SIZE })
      const list = res.data || []
      setPayments((prev) => (append ? [...prev, ...list] : list))
      setHasMore(list.length === PAGE_SIZE)
      setPage(targetPage)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Tải lịch sử thanh toán thất bại'))
    } finally {
      if (append) setLoadingMore(false)
      else setLoading(false)
    }
  }, [])

  useEffect(() => {
    load(1)
  }, [load])

  const handleMockPay = async (e) => {
    e.preventDefault()
    setPayMsg('')
    setPayError('')
    const id = winnerId.trim()
    if (!id) {
      setPayError('Vui lòng nhập AuctionWinnerId')
      return
    }
    setPaying(true)
    try {
      const res = await paymentService.mockPay(id, method)
      setPayMsg(res.message || `Thanh toán thành công — ${formatVnd(res.data?.amount)}`)
      setWinnerId('')
      await load(1)
    } catch (err) {
      setPayError(getApiErrorMessage(err, 'Thanh toán thất bại'))
    } finally {
      setPaying(false)
    }
  }

  return (
    <div className="container-page section-pad">
      <Eyebrow>Thanh toán</Eyebrow>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <h1 className="display-tight font-display text-[clamp(24px,4vw,34px)] font-semibold text-[var(--color-text)]">
          Lịch sử thanh toán
        </h1>
        <span className="font-[var(--font-mono)] text-[12px] uppercase tracking-[0.16em] text-[var(--color-text-dim)]">
          {payments.length} giao dịch
        </span>
      </div>

      <div className="mt-4">
        <Alert type="error">{error}</Alert>
      </div>

      {/* Form mô phỏng thanh toán */}
      <Card className="mt-4 p-5 sm:p-6">
        <h2 className="text-[15px] font-semibold text-[var(--color-text)]">Mô phỏng thanh toán</h2>
        <p className="mt-1 text-[13px] text-[var(--color-text-muted)]">
          Nhập mã phiên thắng (AuctionWinnerId) của bạn và chọn phương thức để thanh toán thử.
        </p>
        <form onSubmit={handleMockPay} className="mt-4 grid gap-3 sm:grid-cols-[1fr_200px_auto]">
          <Input
            value={winnerId}
            onChange={(e) => setWinnerId(e.target.value)}
            placeholder="AuctionWinnerId (GUID)"
            className="font-[var(--font-mono)]"
          />
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="w-full rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-bg-elev)] px-3.5 py-2.5 text-[13px] text-[var(--color-text)] outline-none focus:border-[var(--color-brand)]"
          >
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <Button type="submit" disabled={paying} className="whitespace-nowrap">
            {paying ? 'Đang xử lý…' : 'Thanh toán'}
          </Button>
        </form>
        <div className="mt-3">
          <Alert type="error">{payError}</Alert>
          <Alert type="success">{payMsg}</Alert>
        </div>
      </Card>

      {/* Danh sách */}
      <div className="mt-4 overflow-x-auto rounded-[var(--radius)] border border-[var(--color-line)]">
        <table className="w-full min-w-[760px] bg-[var(--color-surface)] text-left text-[13px]">
          <thead>
            <tr className="border-b border-[var(--color-line)] text-[11px] uppercase tracking-wider text-[var(--color-text-dim)]">
              <th className="px-4 py-3">Mã giao dịch</th>
              <th className="px-4 py-3">Số tiền</th>
              <th className="px-4 py-3">Phương thức</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3">Thanh toán lúc</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-[var(--color-text-dim)]">Đang tải...</td></tr>
            ) : payments.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-[var(--color-text-dim)]">Chưa có giao dịch nào</td></tr>
            ) : (
              payments.map((p) => (
                <tr key={p.id} className="border-b border-[var(--color-line)] last:border-0 hover:bg-[var(--color-surface-2)]">
                  <td className="px-4 py-3">
                    <p className="font-[var(--font-mono)] text-[12px] text-[var(--color-text)]">{p.transactionId || '—'}</p>
                    <p className="font-[var(--font-mono)] text-[11px] text-[var(--color-text-dim)]">{p.id}</p>
                  </td>
                  <td className="px-4 py-3 font-semibold text-[var(--color-text)]">{formatVnd(p.amount)}</td>
                  <td className="px-4 py-3 text-[var(--color-text-muted)]">{p.paymentMethod}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 text-[12px] ${p.status === 'Success' ? 'text-[var(--color-success)]' : p.status === 'Failed' ? 'text-[var(--color-danger)]' : 'text-[var(--color-warning)]'}`}>
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      {STATUS_LABEL[p.status] || p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[var(--color-text-muted)]">{formatDate(p.paidAt || p.createdAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {hasMore && !loading && payments.length > 0 && (
        <div className="mt-4 text-center">
          <Button variant="ghost" onClick={() => load(page + 1, true)} disabled={loadingMore}>
            {loadingMore ? 'Đang tải…' : 'Xem thêm'}
          </Button>
        </div>
      )}
    </div>
  )
}
