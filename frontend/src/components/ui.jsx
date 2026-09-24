/* ============================================================
   UI kit dùng chung — chỉ dùng design token trong index.css
   (không hardcode mã màu/hex để đổi theme 1 chỗ là xong)
   ============================================================ */

export function Field({ label, error, children, hint }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
        {label}
      </span>
      {children}
      {hint && !error && (
        <span className="mt-1 block text-[12px] text-[var(--color-text-dim)]">{hint}</span>
      )}
      {error && <span className="mt-1 block text-[12px] text-[var(--color-danger)]">{error}</span>}
    </label>
  )
}

export function TextInput({ className = '', ...props }) {
  return (
    <input
      {...props}
      className={`w-full rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-surface)] px-3.5 py-2.5 text-[14px] text-[var(--color-text)] placeholder:text-[var(--color-text-dim)] outline-none transition focus:border-[var(--color-brand)] focus:ring-4 focus:ring-[var(--color-brand)]/15 ${className}`}
    />
  )
}

export function PrimaryButton({ children, loading, className = '', ...props }) {
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className={`flex w-full items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-[var(--color-brand)] px-4 py-2.5 text-[14px] font-semibold text-white shadow-[0_10px_30px_-12px_rgba(37,99,235,0.8)] transition hover:bg-[var(--color-brand-strong)] focus-visible:ring-4 focus-visible:ring-[var(--color-brand)]/25 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      {loading ? 'Đang xử lý...' : children}
    </button>
  )
}

export function GhostButton({ children, className = '', ...props }) {
  return (
    <button
      {...props}
      className={`flex w-full items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-white/[0.02] px-4 py-2.5 text-[14px] font-semibold text-[var(--color-text)] transition hover:border-[var(--color-line-strong)] hover:bg-white/[0.05] focus-visible:ring-4 focus-visible:ring-white/10 ${className}`}
    >
      {children}
    </button>
  )
}

const ALERT_STYLES = {
  error: 'border-[var(--color-danger)]/40 bg-[var(--color-danger)]/10 text-[var(--color-danger)]',
  success: 'border-[var(--color-success)]/40 bg-[var(--color-success)]/10 text-[var(--color-success)]',
  warning: 'border-[var(--color-warning)]/40 bg-[var(--color-warning)]/10 text-[var(--color-warning)]',
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

/* Card nền tảng — dùng lại cho mọi panel */
export function Card({ children, className = '' }) {
  return (
    <div
      className={`rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] shadow-[var(--shadow-card)] ${className}`}
    >
      {children}
    </div>
  )
}

/* Nhãn nhỏ phía trên tiêu đề section */
export function Eyebrow({ children, className = '' }) {
  return (
    <p
      className={`text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--color-accent)] ${className}`}
    >
      {children}
    </p>
  )
}

export function AuthCard({ eyebrow, title, subtitle, children, footer }) {
  return (
    <div className="mx-auto w-full max-w-[440px]">
      <Card className="p-6 sm:p-8">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1 className="mt-2 text-[24px] font-bold text-[var(--color-text)]">{title}</h1>
        {subtitle && <p className="mt-1 text-[13px] text-[var(--color-text-muted)]">{subtitle}</p>}
        <div className="mt-6 flex flex-col gap-4">{children}</div>
        {footer && (
          <div className="mt-6 border-t border-[var(--color-line)] pt-4 text-[13px] text-[var(--color-text-muted)]">
            {footer}
          </div>
        )}
      </Card>
    </div>
  )
}
