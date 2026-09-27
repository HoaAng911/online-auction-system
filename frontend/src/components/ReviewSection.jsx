import { useCallback, useEffect, useState } from 'react'
import { getApiErrorMessage } from '../services/api'
import { reviewService } from '../services/reviewService'
import { useAuth } from '../context/AuthContext'
import { Alert, Card, Eyebrow, Field, PrimaryButton, TextInput } from './ui'

function Stars({ value, onPick, readonly }) {
  return (
    <div className="flex items-center gap-1" role={readonly ? 'img' : 'radiogroup'} aria-label={`Đánh giá ${value}/5`}>
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          disabled={readonly}
          onClick={() => onPick?.(s)}
          aria-label={`${s} sao`}
          className={`text-[20px] leading-none transition-colors ${s <= value ? 'text-[var(--color-warning)]' : 'text-[var(--color-line-strong)]'} ${readonly ? 'cursor-default' : 'hover:text-[var(--color-warning)]'}`}
        >
          ★
        </button>
      ))}
    </div>
  )
}

function formatDate(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('vi-VN')
}

/**
 * Khối đánh giá sản phẩm — dùng trong trang chi tiết sản phẩm (Module Long).
 * Props: productId (Guid, bắt buộc).
 */
export default function ReviewSection({ productId }) {
  const { isAuthenticated } = useAuth()
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [formError, setFormError] = useState('')
  const [formMsg, setFormMsg] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(async () => {
    if (!productId) return
    setLoading(true)
    setError('')
    try {
      const res = await reviewService.getByProduct(productId, { page: 1, pageSize: 20 })
      setReviews(res.data || [])
    } catch (err) {
      setError(getApiErrorMessage(err, 'Tải đánh giá thất bại'))
    } finally {
      setLoading(false)
    }
  }, [productId])

  useEffect(() => {
    load()
  }, [load])

  const submit = async (e) => {
    e.preventDefault()
    setFormError('')
    setFormMsg('')
    if (!productId) {
      setFormError('Thiếu mã sản phẩm')
      return
    }
    if (rating < 1 || rating > 5) {
      setFormError('Vui lòng chọn số sao từ 1 đến 5')
      return
    }
    setSubmitting(true)
    try {
      const res = await reviewService.create({ productId, rating, comment: comment.trim() || undefined })
      setFormMsg(res.message || 'Đánh giá thành công')
      setComment('')
      await load()
    } catch (err) {
      setFormError(getApiErrorMessage(err, 'Gửi đánh giá thất bại'))
    } finally {
      setSubmitting(false)
    }
  }

  const avg = reviews.length
    ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : null

  return (
    <Card className="p-5 sm:p-6">
      <Eyebrow>Đánh giá</Eyebrow>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h2 className="font-display text-[20px] font-semibold text-[var(--color-text)]">Nhận xét từ người thắng</h2>
        {avg && (
          <span className="inline-flex items-center gap-1.5 text-[14px] text-[var(--color-text-muted)]">
            <span className="text-[var(--color-warning)]">★</span>
            <strong className="text-[var(--color-text)]">{avg}</strong>/5 · {reviews.length} lượt
          </span>
        )}
      </div>

      {isAuthenticated && (
        <form onSubmit={submit} className="mt-4 border-t border-[var(--color-line)] pt-4">
          <Field label="Số sao của bạn">
            <Stars value={rating} onPick={setRating} />
          </Field>
          <div className="mt-3">
            <Field label="Nhận xét (tùy chọn)">
              <TextInput
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Chia sẻ cảm nhận về sản phẩm…"
                maxLength={2000}
              />
            </Field>
          </div>
          <div className="mt-3">
            <Alert type="error">{formError}</Alert>
            <Alert type="success">{formMsg}</Alert>
          </div>
          <div className="mt-3 max-w-[220px]">
            <PrimaryButton loading={submitting}>Gửi đánh giá</PrimaryButton>
          </div>
          <p className="mt-2 text-[12px] text-[var(--color-text-dim)]">
            Chỉ người thắng đấu giá mới được đánh giá, mỗi sản phẩm một lần.
          </p>
        </form>
      )}

      <div className="mt-4 flex flex-col gap-3 border-t border-[var(--color-line)] pt-4">
        <Alert type="error">{error}</Alert>
        {loading ? (
          <p className="py-4 text-center text-[13px] text-[var(--color-text-dim)]">Đang tải đánh giá...</p>
        ) : reviews.length === 0 ? (
          <p className="py-4 text-center text-[13px] text-[var(--color-text-dim)]">Chưa có đánh giá nào</p>
        ) : (
          reviews.map((r) => (
            <div key={r.id} className="rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-bg-elev)] p-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[13px] font-semibold text-[var(--color-text)]">
                  {r.reviewerName || 'Người dùng ẩn danh'}
                </span>
                <span className="font-[var(--font-mono)] text-[11px] text-[var(--color-text-dim)]">{formatDate(r.createdAt)}</span>
              </div>
              <div className="mt-1.5">
                <Stars value={r.rating} readonly />
              </div>
              {r.comment && (
                <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--color-text-muted)]">{r.comment}</p>
              )}
            </div>
          ))
        )}
      </div>
    </Card>
  )
}
