export function Field({ label, error, children, hint }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wider text-zinc-400">
        {label}
      </span>
      {children}
      {hint && !error && <span className="mt-1 block text-[12px] text-zinc-500">{hint}</span>}
      {error && <span className="mt-1 block text-[12px] text-red-400">{error}</span>}
    </label>
  )
}

export function TextInput(props) {
  return (
    <input
      {...props}
      className={`w-full rounded-lg border bg-[var(--color-surface)] px-3.5 py-2.5 text-[14px] text-white placeholder:text-zinc-600 outline-none transition focus:border-[var(--color-brand)] focus:ring-4 focus:ring-[var(--color-brand)]/15 ${props.className || 'border-[var(--color-line)]'
        }`}
    />
  )
}

export function PrimaryButton({ children, loading, ...props }) {
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--color-brand)] px-4 py-2.5 text-[14px] font-semibold text-white shadow-[0_10px_30px_-12px_rgba(37,99,235,0.8)] transition hover:bg-[var(--color-brand-strong)] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? 'Đang xử lý...' : children}
    </button>
  )
}

export function GhostButton({ children, ...props }) {
  return (
    <button
      {...props}
      className="flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--color-line)] bg-white/[0.02] px-4 py-2.5 text-[14px] font-semibold text-white transition hover:border-white/25 hover:bg-white/[0.05]"
    >
      {children}
    </button>
  )
}

export function Alert({ type = 'error', children }) {
  if (!children) return null
  const styles =
    type === 'error'
      ? 'border-red-500/40 bg-red-500/10 text-red-300'
      : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
  return <div className={`rounded-lg border px-3.5 py-2.5 text-[13px] ${styles}`}>{children}</div>
}

export function AuthCard({ eyebrow, title, subtitle, children, footer }) {
  return (
    <div className="mx-auto w-full max-w-[440px]">
      <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-6 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.9)] sm:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--color-accent)]">{eyebrow}</p>
        <h1 className="mt-2 text-[24px] font-bold text-white">{title}</h1>
        {subtitle && <p className="mt-1 text-[13px] text-zinc-400">{subtitle}</p>}
        <div className="mt-6 flex flex-col gap-4">{children}</div>
        {footer && <div className="mt-6 border-t border-[var(--color-line)] pt-4 text-[13px] text-zinc-400">{footer}</div>}
      </div>
    </div>
  )
}
