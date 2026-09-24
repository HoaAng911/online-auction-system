import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navLinks = [
  { to: '/', label: 'Khám phá', end: true },
  { href: '#categories', label: 'Danh mục' },
  { href: '#how', label: 'Cách hoạt động' },
]

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const navigate = useNavigate()

  const onSearch = (e) => {
    e.preventDefault()
    if (!q.trim()) return
    navigate(`/?q=${encodeURIComponent(q.trim())}`)
  }

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const initials = (user?.fullName || user?.username || 'HN').slice(0, 2).toUpperCase()

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-line)] bg-[var(--color-bg)]/90 backdrop-blur-md">
      <div className="mx-auto flex h-[64px] max-w-[1320px] items-center gap-4 px-4 lg:px-6">
        {/* Logo */}
        <Link to="/" className="flex shrink-0 items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-[6px] bg-[var(--color-brand)] font-[var(--font-mono)] text-[14px] font-bold text-[var(--color-on-brand)]">
            A
          </span>
          <span className="font-[var(--font-mono)] text-[14px] font-bold uppercase tracking-[0.14em]">
            <span className="text-[var(--color-text)]">AUCTION</span>
            <span className="text-[var(--color-brand-strong)]">.VN</span>
          </span>
        </Link>

        {/* Nav — gạch chân gold khi active */}
        <nav className="ml-4 hidden items-center gap-6 md:flex">
          {navLinks.map((l) =>
            l.to ? (
              <NavLink
                key={l.label}
                to={l.to}
                end={l.end}
                className={({ isActive }) =>
                  `label-tech border-b-2 pb-1 transition-colors ${isActive
                    ? 'border-[var(--color-brand)] text-[var(--color-text)]'
                    : 'border-transparent hover:text-[var(--color-text)]'
                  }`
                }
              >
                {l.label}
              </NavLink>
            ) : (
              <a
                key={l.label}
                href={l.href}
                className="label-tech border-b-2 border-transparent pb-1 transition-colors hover:text-[var(--color-text)]"
              >
                {l.label}
              </a>
            ),
          )}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          {/* Search */}
          <form
            onSubmit={onSearch}
            className="hidden items-center gap-2 border-b border-[var(--color-line-strong)] px-1 py-1.5 transition-colors focus-within:border-[var(--color-brand)] sm:flex"
          >
            <span aria-hidden className="font-[var(--font-mono)] text-[var(--color-text-dim)]">⌕</span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm kiếm sản phẩm…"
              className="w-[190px] bg-transparent text-[13px] text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-dim)]"
            />
          </form>

          {/* Auth */}
          {!isAuthenticated ? (
            <div className="flex items-center gap-2">
              <Link to="/login" className="label-tech hidden transition-colors hover:text-[var(--color-text)] sm:inline">
                Đăng nhập
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] bg-[var(--color-brand)] px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--color-on-brand)] transition-colors hover:bg-[var(--color-brand-strong)]"
              >
                Đăng tin
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/me"
                className="hidden text-[13px] text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)] sm:inline"
                title={user?.fullName}
              >
                {user?.fullName || user?.username}
              </Link>
              {isAdmin && (
                <Link
                  to="/admin/users"
                  className="label-tech hidden border border-[var(--color-line-strong)] px-2.5 py-1 transition-colors hover:border-[var(--color-text)] hover:text-[var(--color-text)] sm:inline"
                >
                  Quản trị
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="label-tech hidden transition-colors hover:text-[var(--color-danger)] sm:inline"
              >
                Đăng xuất
              </button>
              <Link
                to="/me"
                className="grid h-8 w-8 place-items-center rounded-full border border-[var(--color-brand)] font-[var(--font-mono)] text-[11px] font-bold text-[var(--color-brand-strong)]"
              >
                {initials}
              </Link>
            </div>
          )}

          {/* Mobile menu */}
          <button
            onClick={() => setOpen((v) => !v)}
            className="grid h-9 w-9 place-items-center rounded-[6px] border border-[var(--color-line-strong)] text-[var(--color-text)] md:hidden"
            aria-label="Menu"
          >
            {open ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-[var(--color-line)] bg-[var(--color-bg)] px-4 py-4 md:hidden">
          <form
            onSubmit={onSearch}
            className="mb-4 flex items-center gap-2 border-b border-[var(--color-line-strong)] px-1 py-2"
          >
            <span aria-hidden className="font-[var(--font-mono)] text-[var(--color-text-dim)]">⌕</span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm kiếm sản phẩm…"
              className="w-full bg-transparent text-[13px] text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-dim)]"
            />
          </form>
          <div className="flex flex-col text-[14px]">
            {navLinks.map((l) =>
              l.to ? (
                <Link key={l.label} to={l.to} onClick={() => setOpen(false)} className="border-b border-[var(--color-line)] py-3 text-[var(--color-text-muted)]">
                  {l.label}
                </Link>
              ) : (
                <a key={l.label} href={l.href} onClick={() => setOpen(false)} className="border-b border-[var(--color-line)] py-3 text-[var(--color-text-muted)]">
                  {l.label}
                </a>
              ),
            )}
            {!isAuthenticated ? (
              <div className="mt-4 flex flex-col gap-3">
                <Link to="/login" onClick={() => setOpen(false)} className="text-center text-[var(--color-text)]">
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  onClick={() => setOpen(false)}
                  className="rounded-[var(--radius-sm)] bg-[var(--color-brand)] px-4 py-2.5 text-center text-[13px] font-semibold uppercase tracking-[0.08em] text-[var(--color-on-brand)]"
                >
                  Đăng tin
                </Link>
              </div>
            ) : (
              <div className="mt-4 flex flex-col gap-3">
                <Link to="/me" onClick={() => setOpen(false)} className="text-[var(--color-text)]">
                  Hồ sơ
                </Link>
                {isAdmin && (
                  <Link to="/admin/users" onClick={() => setOpen(false)} className="text-[var(--color-text)]">
                    Quản trị
                  </Link>
                )}
                <button onClick={handleLogout} className="text-left text-[var(--color-danger)]">
                  Đăng xuất
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
