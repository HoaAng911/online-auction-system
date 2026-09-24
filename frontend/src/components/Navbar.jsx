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
    <header className="sticky top-0 z-50 border-b border-[var(--color-line)] bg-[var(--color-bg)]/85 backdrop-blur-xl">
      <div className="mx-auto flex h-[64px] max-w-[1320px] items-center gap-4 px-4 lg:px-6">
        {/* Logo */}
        <Link to="/" className="flex shrink-0 items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-gradient-to-br from-[var(--color-brand)] to-[var(--color-accent)] text-[14px] font-black text-[#04101f] shadow-[0_0_20px_-4px_var(--color-brand)]">
            A
          </span>
          <span className="text-[15px] font-bold tracking-tight">
            <span className="text-white">AUCTION</span>
            <span className="text-[var(--color-accent)]">.VN</span>
          </span>
        </Link>

        {/* Nav — pill kiểu Northwall */}
        <nav className="ml-4 hidden items-center gap-1 rounded-full border border-[var(--color-line)] bg-[var(--color-surface)]/60 p-1 text-[13px] font-medium text-zinc-400 md:flex">
          {navLinks.map((l) =>
            l.to ? (
              <NavLink
                key={l.label}
                to={l.to}
                end={l.end}
                className={({ isActive }) =>
                  `rounded-full px-3.5 py-1.5 transition-colors ${isActive ? 'bg-white/10 text-white' : 'hover:text-white'
                  }`
                }
              >
                {l.label}
              </NavLink>
            ) : (
              <a key={l.label} href={l.href} className="rounded-full px-3.5 py-1.5 transition-colors hover:text-white">
                {l.label}
              </a>
            ),
          )}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          {/* Search */}
          <form
            onSubmit={onSearch}
            className="hidden items-center gap-2 rounded-full border border-[var(--color-line)] bg-[var(--color-surface)]/60 px-3.5 py-1.5 transition-colors focus-within:border-[var(--color-brand)] sm:flex"
          >
            <span className="text-zinc-500">⌕</span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm kiếm sản phẩm..."
              className="w-[200px] bg-transparent text-[13px] text-white outline-none placeholder:text-zinc-500"
            />
          </form>

          {/* Auth */}
          {!isAuthenticated ? (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="hidden text-[13px] font-medium text-zinc-300 transition-colors hover:text-white sm:inline"
              >
                Đăng nhập
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center gap-1.5 rounded-md bg-white px-4 py-2 text-[13px] font-semibold text-[#04101f] transition-colors hover:bg-[var(--color-accent-soft)]"
              >
                <span aria-hidden>›</span> Đăng tin
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/me"
                className="hidden text-[13px] text-zinc-300 transition-colors hover:text-white sm:inline"
                title={user?.fullName}
              >
                {user?.fullName || user?.username}
              </Link>
              {isAdmin && (
                <Link
                  to="/admin/users"
                  className="hidden rounded-full border border-[var(--color-line)] px-3 py-1.5 text-[12px] text-zinc-300 transition-colors hover:border-[var(--color-line-strong)] hover:text-white sm:inline"
                >
                  Quản trị
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="hidden text-[13px] text-zinc-400 transition-colors hover:text-white sm:inline"
              >
                Đăng xuất
              </button>
              <Link
                to="/me"
                className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-[var(--color-brand)] to-[var(--color-accent)] text-[12px] font-bold text-[#04101f]"
              >
                {initials}
              </Link>
            </div>
          )}

          {/* Mobile menu */}
          <button
            onClick={() => setOpen((v) => !v)}
            className="grid h-9 w-9 place-items-center rounded-md border border-[var(--color-line)] text-zinc-300 md:hidden"
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
            className="mb-4 flex items-center gap-2 rounded-full border border-[var(--color-line)] bg-[var(--color-surface)]/60 px-3.5 py-2"
          >
            <span className="text-zinc-500">⌕</span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm kiếm sản phẩm..."
              className="w-full bg-transparent text-[13px] text-white outline-none placeholder:text-zinc-500"
            />
          </form>
          <div className="flex flex-col gap-1 text-[14px]">
            {navLinks.map((l) =>
              l.to ? (
                <Link key={l.label} to={l.to} onClick={() => setOpen(false)} className="rounded-md px-2 py-2 text-zinc-300 hover:bg-white/5">
                  {l.label}
                </Link>
              ) : (
                <a key={l.label} href={l.href} onClick={() => setOpen(false)} className="rounded-md px-2 py-2 text-zinc-300 hover:bg-white/5">
                  {l.label}
                </a>
              ),
            )}
            {!isAuthenticated ? (
              <>
                <Link to="/login" onClick={() => setOpen(false)} className="rounded-md px-2 py-2 text-white">
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  onClick={() => setOpen(false)}
                  className="mt-1 rounded-md bg-white px-4 py-2.5 text-center font-semibold text-[#04101f]"
                >
                  Đăng tin
                </Link>
              </>
            ) : (
              <>
                <Link to="/me" onClick={() => setOpen(false)} className="rounded-md px-2 py-2 text-white">
                  Hồ sơ
                </Link>
                {isAdmin && (
                  <Link to="/admin/users" onClick={() => setOpen(false)} className="rounded-md px-2 py-2 text-white">
                    Quản trị
                  </Link>
                )}
                <button onClick={handleLogout} className="rounded-md px-2 py-2 text-left text-zinc-400">
                  Đăng xuất
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
