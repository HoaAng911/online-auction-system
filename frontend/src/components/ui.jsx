/* ============================================================
   UI kit dùng chung — chỉ dùng design token trong index.css
   Theme: technical print (giấy trắng + mực + vàng gold)
   (không hardcode mã màu/hex để đổi theme 1 chỗ là xong)
   ============================================================ */

export function Field({ label, error, children, hint }) {
  return (
    <label className="block">
      <span className="label-tech mb-2 block">{label}</span>
      {children}
      {hint && !error && (
        <span className="mt-1.5 block text-[12px] text-[var(--color-text-dim)]">{hint}</span>
      )}
      {error && (
        <span className="mt-1.5 block text-[12px] text-[var(--color-danger)]">{error}</span>
      )}
    </label>
  )
}

export function TextInput({ className = '', ...props }) {
  return (
    <input
      {...props}
      className={`w-full rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-surface)] px-3.5 py-2.5 text-[14px] text-[var(--color-text)] placeholder:text-[var(--color-text-dim)] outline-none transition focus:border-[var(--color-brand)] focus:ring-[3px] focus:ring-[var(--color-brand)]/18 ${className}`}
    />
  )
}

export function PrimaryButton({ children, loading, className = '', ...props }) {
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className={`flex w-full items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-[var(--color-brand)] px-4 py-2.5 text-[13px] font-semibold uppercase tracking-[0.08em] text-[var(--color-on-brand)] transition-colors hover:bg-[var(--color-brand-strong)] focus-visible:ring-[3px] focus-visible:ring-[var(--color-brand)]/30 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      {loading ? 'Đang xử lý…' : children}
    </button>
  )
}

export function GhostButton({ children, className = '', ...props }) {
  return (
    <button
      {...props}
      className={`flex w-full items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-[var(--color-line-strong)] bg-transparent px-4 py-2.5 text-[13px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text)] transition-colors hover:border-[var(--color-text)] hover:bg-[var(--color-surface-2)] focus-visible:ring-[3px] focus-visible:ring-[var(--color-brand)]/30 ${className}`}
    >
      {children}
    </button>
  )
}

const ALERT_STYLES = {
  error: 'border-[var(--color-danger)]/35 bg-[var(--color-danger)]/[0.06] text-[var(--color-danger)]',
  success: 'border-[var(--color-success)]/35 bg-[var(--color-success)]/[0.06] text-[var(--color-success)]',
  warning: 'border-[var(--color-warning)]/40 bg-[var(--color-warning)]/[0.08] text-[var(--color-warning)]',
}

export function Alert({ type = 'error', children }) {
  if (!children) return null
  return (
    <div
      className={`rounded-[var(--radius-sm)] border px-3.5 py-2.5 text-[13px] ${ALERT_STYLES[type] || ALERT_STYLES.error
        }`}
    >
      {children}
    </div>
  )
}

/* Panel nền tảng — viền mảnh, không đổ bóng nặng */
export function Card({ children, className = '' }) {
  return (
    <div
      className={`rounded-[var(--radius)] border border-[var(--color-line)] bg-[var(--color-surface)] ${className}`}
    >
      {children}
    </div>
  )
}

/* Nhãn nhỏ phía trên tiêu đề section — chữ hoa mono */
export function Eyebrow({ children, className = '' }) {
  return (
    <p
      className={`inline-flex items-center gap-2 font-[var(--font-mono)] text-[11px] font-medium uppercase tracking-[0.22em] text-[var(--color-brand-strong)] ${className}`}
    >
      <span aria-hidden className="h-[1px] w-6 bg-[var(--color-brand)]" />
      {children}
    </p>
  )
}

export function AuthCard({ eyebrow, title, subtitle, children, footer }) {
  return (
    <div className="mx-auto w-full max-w-[440px]">
      <div className="rounded-[var(--radius)] border border-[var(--color-line)] bg-[var(--color-surface)]">
        {/* thanh gold trên đỉnh — dấu nhận diện */}
        <div className="h-[3px] w-full rounded-t-[var(--radius)] bg-[var(--color-brand)]" />
        <div className="p-6 sm:p-8">
          <Eyebrow>{eyebrow}</Eyebrow>
          <h1 className="mt-3 text-[26px] font-bold leading-tight tracking-[-0.01em] text-[var(--color-text)]">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 text-[13px] leading-relaxed text-[var(--color-text-muted)]">
              {subtitle}
            </p>
          )}
          <div className="mt-7 flex flex-col gap-4">{children}</div>
          {footer && (
            <div className="mt-7 border-t border-[var(--color-line)] pt-5 text-[13px] text-[var(--color-text-muted)]">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
