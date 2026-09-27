import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import NotificationBell from './NotificationBell'
import { Button } from './ui/button'
import { Input } from './ui/input'

// Mọi tab đều trỏ về section trên trang chủ (id tương ứng trong Home.jsx).
// Dùng chung cơ chế "điều hướng về '/' rồi cuộn tới id" để logic thống nhất.
const navLinks = [
  { id: 'explore', label: 'Khám phá' },
  { id: 'categories', label: 'Danh mục' },
  { id: 'how', label: 'Cách hoạt động' },
]

const HEADER_OFFSET = 64 // chiều cao header sticky

function scrollToSection(id) {
  const el = document.getElementById(id)
  if (!el) return
  const top = el.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET
  window.scrollTo({ top, behavior: 'smooth' })
}

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

  // Click tab: nếu đang ở trang chủ thì cuộn tới section, ngược lại điều hướng về '/' kèm state để Home tự cuộn.
  const goToSection = (id) => {
    setOpen(false)
    if (window.location.pathname === '/') {
      scrollToSection(id)
    } else {
      navigate('/', { state: { scrollTo: id } })
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const initials = (user?.fullName || user?.username || 'HN').slice(0, 2).toUpperCase()

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-line)] bg-white/95 backdrop-blur-md">
      <div className="container-page flex h-[64px] items-center gap-4">
        {/* Logo — Adidas style: bold, uppercase, sharp */}
        <Link to="/" className="group flex shrink-0 items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center bg-black font-display text-[16px] font-black leading-none text-white transition-colors duration-200 group-hover:bg-[var(--color-brand)]">
            A
          </span>
          <span className="font-display text-[17px] font-black uppercase tracking-[0.14em]">
            <span className="text-black">Auction</span>
            <span className="text-[var(--color-brand)]">.vn</span>
          </span>
        </Link>

        {/* Nav — uppercase, tracking rộng, underline đỏ khi active */}
        <nav className="ml-4 hidden items-center gap-7 md:flex">
          {navLinks.map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => goToSection(l.id)}
              className="relative py-1 text-[12px] font-bold uppercase tracking-[0.1em] text-[var(--color-text-muted)] transition-colors after:absolute after:-bottom-0.5 after:left-0 after:h-[2px] after:w-0 after:bg-[var(--color-brand)] after:transition-[width] after:duration-200 after:content-[''] hover:text-black hover:after:w-full"
            >
              {l.label}
            </button>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          {/* Search */}
          <form
            onSubmit={onSearch}
            className="hidden items-center gap-2 border border-[var(--color-line-strong)] bg-white px-3.5 py-1.5 transition-colors focus-within:border-black sm:flex"
          >
            <span aria-hidden className="text-[13px] text-[var(--color-text-dim)]">⌕</span>
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm kiếm sản phẩm…"
              className="h-auto w-[180px] border-0 bg-transparent px-0 py-0 text-[13px] shadow-none focus-visible:ring-0"
            />
          </form>

          {/* Auth */}
          {!isAuthenticated ? (
            <div className="flex items-center gap-2">
              <Link to="/login" className="hidden text-[12px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-muted)] transition-colors hover:text-black sm:inline">
                Đăng nhập
              </Link>
              <Button asChild size="sm">
                <Link to="/register">Đăng tin</Link>
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <NotificationBell />
              <Link
                to="/me"
                className="hidden text-[12px] font-medium text-[var(--color-text-muted)] transition-colors hover:text-black sm:inline"
                title={user?.fullName}
              >
                {user?.fullName || user?.username}
              </Link>
              <Link
                to="/me/payments"
                className="hidden text-[12px] font-medium text-[var(--color-text-muted)] transition-colors hover:text-black sm:inline"
              >
                Thanh toán
              </Link>
              {isAdmin && (
                <span className="hidden items-center gap-2 sm:inline-flex">
                  <Link
                    to="/admin/dashboard"
                    className="border border-[var(--color-brand)] bg-[var(--color-brand)] px-3.5 py-1 text-[11px] font-bold uppercase tracking-[0.1em] text-white transition-colors hover:bg-[var(--color-brand-strong)]"
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/admin/users"
                    className="text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--color-text-muted)] transition-colors hover:text-black"
                  >
                    Users
                  </Link>
                  <Link
                    to="/admin/settings"
                    className="text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--color-text-muted)] transition-colors hover:text-black"
                  >
                    Cài đặt
                  </Link>
                </span>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="hidden text-[12px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-danger)] sm:inline"
              >
                Đăng xuất
              </Button>
              <Link
                to="/me"
                aria-label="Hồ sơ cá nhân"
                className="grid h-8 w-8 place-items-center border border-black bg-black text-[11px] font-bold tracking-wide text-white transition-colors hover:bg-[var(--color-brand)] hover:border-[var(--color-brand)]"
              >
                {initials}
              </Link>
            </div>
          )}

          {/* Mobile menu */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => setOpen((v) => !v)}
            className="h-9 w-9 md:hidden"
            aria-label="Menu"
          >
            {open ? '✕' : '☰'}
          </Button>
        </div>
      </div>

      {open && (
        <div className="animate-fade-up border-t border-[var(--color-line)] bg-white px-4 py-4 md:hidden">
          <form
            onSubmit={onSearch}
            className="mb-4 flex items-center gap-2 border-b border-[var(--color-line-strong)] px-1 py-2"
          >
            <span aria-hidden className="font-[var(--font-mono)] text-[var(--color-text-dim)]">⌕</span>
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm kiếm sản phẩm…"
              className="h-auto w-full border-0 bg-transparent px-0 py-0 text-[13px] shadow-none focus-visible:ring-0"
            />
          </form>
          <div className="flex flex-col text-[14px]">
            {navLinks.map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => goToSection(l.id)}
                className="border-b border-[var(--color-line)] py-3 text-left text-[13px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-muted)] transition-colors hover:text-black"
              >
                {l.label}
              </button>
            ))}
            {!isAuthenticated ? (
              <div className="mt-4 flex flex-col gap-3">
                <Link to="/login" onClick={() => setOpen(false)} className="text-center text-[13px] font-bold uppercase tracking-[0.08em] text-black">
                  Đăng nhập
                </Link>
                <Button asChild className="w-full">
                  <Link to="/register" onClick={() => setOpen(false)}>
                    Đăng tin
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="mt-4 flex flex-col gap-3">
                <Link to="/me" onClick={() => setOpen(false)} className="text-[13px] font-bold uppercase tracking-[0.08em] text-black">
                  Hồ sơ
                </Link>
                <Link to="/me/payments" onClick={() => setOpen(false)} className="text-[13px] font-bold uppercase tracking-[0.08em] text-black">
                  Thanh toán của tôi
                </Link>
                <Link to="/notifications" onClick={() => setOpen(false)} className="text-[13px] font-bold uppercase tracking-[0.08em] text-black">
                  Thông báo
                </Link>
                {isAdmin && (
                  <>
                    <Link to="/admin/dashboard" onClick={() => setOpen(false)} className="text-[13px] font-bold uppercase tracking-[0.08em] text-black">
                      Dashboard
                    </Link>
                    <Link to="/admin/users" onClick={() => setOpen(false)} className="text-[13px] font-bold uppercase tracking-[0.08em] text-black">
                      Quản trị users
                    </Link>
                    <Link to="/admin/settings" onClick={() => setOpen(false)} className="text-[13px] font-bold uppercase tracking-[0.08em] text-black">
                      Cài đặt hệ thống
                    </Link>
                  </>
                )}
                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  className="justify-start px-0 text-left text-[13px] font-bold uppercase tracking-[0.08em] text-[var(--color-danger)] hover:text-[var(--color-danger)]"
                >
                  Đăng xuất
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
