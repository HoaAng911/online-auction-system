/* ============================================================
   UI kit dùng chung — refactor trên nền shadcn/ui primitives.
   Giữ nguyên API cũ (Field, TextInput, PrimaryButton, GhostButton,
   Alert, Card, StatCell, Eyebrow, AuthCard) để không phá vỡ
   các trang đang import. Theme vẫn lấy design token trong index.css.
   ============================================================ */

import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card as ShadCard } from './ui/card'
import { Alert as ShadAlert } from './ui/alert'
import { Label } from './ui/label'

export function Field({ label, error, children, hint, htmlFor }) {
  return (
    <div className="block">
      <Label htmlFor={htmlFor} className="label-tech mb-2 block">
        {label}
      </Label>
      {children}
      {hint && !error && (
        <span className="mt-1.5 block text-[12px] text-[var(--color-text-dim)]">{hint}</span>
      )}
      {error && (
        <span className="mt-1.5 block text-[12px] text-[var(--color-danger)]">{error}</span>
      )}
    </div>
  )
}

export function TextInput({ className = '', ...props }) {
  return <Input className={className} {...props} />
}

export function PrimaryButton({ children, loading, className = '', ...props }) {
  return (
    <Button
      {...props}
      disabled={loading || props.disabled}
      aria-busy={loading || undefined}
      className={`w-full ${className}`}
    >
      {loading ? 'Đang xử lý…' : children}
    </Button>
  )
}

export function GhostButton({ children, className = '', ...props }) {
  return (
    <Button
      variant="ghost"
      {...props}
      className={`w-full ${className}`}
    >
      {children}
    </Button>
  )
}

const ALERT_VARIANTS = {
  error: 'destructive',
  success: 'success',
  warning: 'warning',
}

export function Alert({ type = 'error', children }) {
  if (!children) return null
  return (
    <ShadAlert variant={ALERT_VARIANTS[type] || 'destructive'}>
      <span aria-hidden className="mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
      <span>{children}</span>
    </ShadAlert>
  )
}

/* Panel nền tảng — viền hairline, bo góc lớn, bóng mềm rất nhẹ */
export function Card({ children, className = '' }) {
  return <ShadCard className={className}>{children}</ShadCard>
}

/* Khung dữ liệu — nhãn nhỏ + giá trị số serif thanh lịch */
export function StatCell({ label, value, className = '' }) {
  return (
    <div className={`flex flex-col gap-2 p-5 sm:p-6 ${className}`}>
      <span className="label-tech">{label}</span>
      <span className="font-display text-[clamp(24px,3vw,32px)] font-semibold leading-none tracking-[-0.01em] text-[var(--color-text)]">
        {value}
      </span>
    </div>
  )
}

/* Nhãn nhỏ phía trên tiêu đề section — chữ hoa giãn nhẹ, có gạch đồng */
export function Eyebrow({ children, className = '' }) {
  return (
    <p
      className={`inline-flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--color-brand-strong)] ${className}`}
    >
      <span aria-hidden className="h-[1px] w-7 bg-[var(--color-brand)]" />
      {children}
    </p>
  )
}

export function AuthCard({ eyebrow, title, subtitle, children, footer }) {
  return (
    <div className="mx-auto w-full max-w-[460px]">
      <ShadCard className="overflow-hidden rounded-[var(--radius-lg)]">
        {/* thanh đồng mảnh trên đỉnh — dấu nhận diện thương hiệu */}
        <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[var(--color-brand)] to-transparent" />
        <div className="p-6 sm:p-10">
          {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
          <h1 className="display-tight font-display mt-3 text-[clamp(26px,5vw,32px)] font-semibold text-[var(--color-text)]">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-3 text-[13.5px] leading-relaxed text-[var(--color-text-muted)]">
              {subtitle}
            </p>
          )}
          <div className="mt-9 flex flex-col gap-4">{children}</div>
          {footer && (
            <div className="mt-9 border-t border-[var(--color-line)] pt-6 text-[13px] text-[var(--color-text-muted)]">
              {footer}
            </div>
          )}
        </div>
      </ShadCard>
    </div>
  )
}
