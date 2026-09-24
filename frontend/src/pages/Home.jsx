import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function formatVND(n) {
  return new Intl.NumberFormat('vi-VN').format(n) + ' ₫'
}

function useCountdown(targetMs) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])
  const diff = Math.max(0, targetMs - now)
  const h = String(Math.floor(diff / 3600000)).padStart(2, '0')
  const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0')
  const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0')
  return `${h}:${m}:${s}`
}

// Ô danh mục dạng "packet" — bản vẽ kỹ thuật (thay bằng ảnh thật khi có API).
const heroTiles = [
  { code: '01', label: 'ĐIỆN TỬ', meta: '028 · đang mở' },
  { code: '02', label: 'SƯU TẦM', meta: '014 · đang mở' },
  { code: '03', label: 'XE & PHỤ KIỆN', meta: '009 · đang mở' },
]

const categories = [
  { name: 'Điện tử', desc: 'Điện thoại, laptop, console', count: '2.4k phiên' },
  { name: 'Thời trang', desc: 'Đồng hồ, túi xách, giày', count: '1.1k phiên' },
  { name: 'Sưu tầm', desc: 'Đồ cổ, nghệ thuật, tem', count: '860 phiên' },
  { name: 'Xe & Phụ kiện', desc: 'Xe, linh kiện, phụ tùng', count: '540 phiên' },
]

const steps = [
  { n: '01', tag: 'Xác thực', title: 'Đăng ký & xác thực email', desc: 'Tạo tài khoản, xác thực email, đăng nhập và làm mới phiên an toàn.', links: [['Đăng ký', '/register'], ['Đăng nhập', '/login'], ['Xác thực email', '/verify-email']] },
  { n: '02', tag: 'Tài khoản', title: 'Hồ sơ & bảo mật', desc: 'Xem/cập nhật hồ sơ, đổi mật khẩu, quên/đặt lại mật khẩu.', links: [['Hồ sơ', '/me'], ['Quên mật khẩu', '/forgot-password']] },
  { n: '03', tag: 'Quản trị', title: 'Quản lý người dùng', desc: 'Admin xem danh sách, tìm kiếm, khóa/mở tài khoản.', links: [['Mở trang quản trị', '/admin/users']] },
]

export default function Home() {
  const { isAuthenticated } = useAuth()
  // Demo phiên nổi bật — sau này thay bằng GET /api/products?status=Active
  const featured = {
    title: 'PlayStation 5',
    price: 12500000,
    endAt: Date.now() + 2 * 3600 * 1000 + 14 * 60 * 1000 + 9 * 1000,
  }
  const countdown = useCountdown(featured.endAt)

  return (
    <div className="bg-[var(--color-bg)]">
      {/* ============================ HERO ============================ */}
      <section className="relative border-b border-[var(--color-line)]">
        {/* Lưới bản vẽ mảnh */}
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.5]" style={{ backgroundImage: 'linear-gradient(var(--color-line) 1px, transparent 1px), linear-gradient(90deg, var(--color-line) 1px, transparent 1px)', backgroundSize: '56px 56px' }} />

        <div className="relative mx-auto max-w-[1320px] px-4 pt-16 lg:px-6 lg:pt-24">
          <span className="label-tech inline-flex items-center gap-2 border border-[var(--color-brand)] px-3 py-1.5 text-[var(--color-brand-strong)]">
            <span className="h-1.5 w-1.5 bg-[var(--color-brand)]" />
            Nền tảng đấu giá trực tuyến
          </span>

          <h1 className="mt-6 max-w-[15ch] font-[var(--font-mono)] text-[40px] font-bold uppercase leading-[1.02] tracking-[0.01em] text-[var(--color-text)] sm:text-[64px] lg:text-[84px]">
            Mỗi lượt đặt giá.
            <br />
            <span className="text-[var(--color-brand-strong)]">Một giá trị thật.</span>
          </h1>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <p className="max-w-[560px] text-[15px] leading-7 text-[var(--color-text-muted)]">
              Nơi hội tụ những phiên đấu giá được tuyển chọn — người bán xác thực, cạnh tranh công bằng,
              và mọi lượt đặt giá đều được ghi nhận minh bạch.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                to={isAuthenticated ? '/me' : '/register'}
                className="inline-flex items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--color-brand)] px-6 py-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-[var(--color-on-brand)] transition-colors hover:bg-[var(--color-brand-strong)]"
              >
                Bắt đầu đấu giá
              </Link>
              <a
                href="#explore"
                className="inline-flex items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--color-line-strong)] px-6 py-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text)] transition-colors hover:border-[var(--color-brand)] hover:text-[var(--color-brand-strong)]"
              >
                Khám phá phiên
              </a>
            </div>
          </div>

          {/* Trạng thái hệ thống */}
          <div className="mt-12 flex flex-wrap items-center gap-x-10 gap-y-3 border-t border-dashed border-[var(--color-line-strong)] pt-5">
            <span className="label-tech inline-flex items-center gap-2 text-[var(--color-text-dim)]">
              <span className="h-1.5 w-1.5 bg-[var(--color-brand)]" /> Sẵn sàng
            </span>
            <span className="label-tech text-[var(--color-text-dim)]">PHIÊN LIÊN TỤC · 12.842</span>
            <span className="label-tech text-[var(--color-text-dim)]">DANH MỤC · 240</span>
            <span className="label-tech text-[var(--color-text-dim)]">NGƯỜI DÙNG · 5.2k</span>
          </div>

          {/* Ô "packet" danh mục — lưới kỹ thuật */}
          <div className="mt-12 grid grid-cols-1 gap-px overflow-hidden border border-[var(--color-line)] bg-[var(--color-line)] sm:grid-cols-3">
            {heroTiles.map((tile) => (
              <div key={tile.code} className="group relative bg-[var(--color-bg)] p-6 transition-colors hover:bg-[var(--color-surface)]">
                <svg viewBox="0 0 120 90" className="h-24 w-full text-[var(--color-brand)] opacity-30 transition-opacity group-hover:opacity-60" fill="none" stroke="currentColor" strokeWidth="1">
                  <rect x="1" y="1" width="118" height="88" />
                  <path d="M1 61h30l10-10h48" strokeDasharray="4 3" />
                  <path d="M119 29h-24l-12 12H1" strokeDasharray="4 3" />
                </svg>
                <div className="mt-5 flex items-center justify-between">
                  <span className="font-[var(--font-mono)] text-[13px] font-bold tracking-[0.14em] text-[var(--color-text)]">
                    {tile.code} · {tile.label}
                  </span>
                  <span className="text-[var(--color-brand-strong)] transition-transform group-hover:translate-x-1">→</span>
                </div>
                <p className="label-tech mt-2 text-[var(--color-text-dim)]">{tile.meta}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== PHIÊN NỔI BẬT ===================== */}
      <section className="mx-auto max-w-[1320px] px-4 py-16 lg:px-6 lg:py-24">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="label-tech text-[var(--color-brand-strong)]">Phiên nổi bật</p>
            <h2 className="mt-3 text-[30px] font-black leading-tight tracking-tight text-[var(--color-text)] sm:text-[40px]">
              Một phiên đấu giá
              <br />
              <span className="text-[var(--color-text-dim)]">đang nóng lên.</span>
            </h2>
            <p className="mt-4 max-w-[480px] text-[14px] leading-6 text-[var(--color-text-muted)]">
              Theo dõi giá theo thời gian thực và chốt ưu thế trước khi đồng hồ kết thúc.
            </p>
            <div className="mt-8 grid grid-cols-3 gap-px border border-[var(--color-line)] bg-[var(--color-line)]">
              {[['98%', 'Thành công'], ['24/7', 'Hỗ trợ'], ['5.2k', 'Người dùng']].map(([v, l]) => (
                <div key={l} className="bg-[var(--color-bg)] px-4 py-5">
                  <p className="font-[var(--font-mono)] text-[24px] font-bold text-[var(--color-text)]">{v}</p>
                  <p className="label-tech mt-1 text-[var(--color-text-dim)]">{l}</p>
                </div>
              ))}
            </div>
            <Link
              to={isAuthenticated ? '/me' : '/register'}
              className="mt-8 inline-flex items-center gap-2 border-b-2 border-[var(--color-brand)] pb-1 text-[13px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text)] transition-colors hover:text-[var(--color-brand-strong)]"
            >
              Tạo phiên đấu giá →
            </Link>
          </div>

          {/* Card phiên nổi bật */}
          <div className="rounded-[var(--radius)] border border-[var(--color-line)] bg-[var(--color-surface)] p-3">
            <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden border border-[var(--color-line)] bg-[var(--color-bg)]">
              <div aria-hidden className="absolute inset-0 opacity-60" style={{ backgroundImage: 'linear-gradient(var(--color-line) 1px, transparent 1px), linear-gradient(90deg, var(--color-line) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
              <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 bg-[var(--color-brand)] px-3 py-1 font-[var(--font-mono)] text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--color-on-brand)]">
                <span className="h-1.5 w-1.5 bg-[var(--color-on-brand)]" /> Sắp kết thúc
              </span>
              <div className="relative grid h-40 w-40 rotate-45 place-items-center border border-[var(--color-line-strong)]">
                <div className="grid h-32 w-32 place-items-center border border-[var(--color-line-strong)]">
                  <span className="-rotate-45 font-[var(--font-mono)] text-[30px] font-bold tracking-tighter text-[var(--color-brand)]">PS5</span>
                </div>
              </div>
            </div>
            <div className="mt-3 flex items-end justify-between gap-4 px-2">
              <div>
                <p className="label-tech text-[var(--color-text-dim)]">{featured.title} · giá hiện tại</p>
                <p className="mt-1 font-[var(--font-mono)] text-[22px] font-bold text-[var(--color-text)]">{formatVND(featured.price)}</p>
              </div>
              <div className="text-right">
                <p className="label-tech text-[var(--color-brand-strong)]">Còn lại</p>
                <p className="mt-1 font-[var(--font-mono)] text-[20px] font-bold text-[var(--color-text)]">{countdown}</p>
              </div>
            </div>
            <Link
              to="/login"
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-[var(--color-brand)] py-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-[var(--color-on-brand)] transition-colors hover:bg-[var(--color-brand-strong)]"
            >
              Xem phiên đấu giá →
            </Link>
          </div>
        </div>
      </section>

      {/* ===================== DANH MỤC ===================== */}
      <section id="categories" className="border-y border-[var(--color-line)] bg-[var(--color-surface)]">
        <div className="mx-auto max-w-[1320px] px-4 py-16 lg:px-6 lg:py-24" id="explore">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="label-tech text-[var(--color-brand-strong)]">Khám phá</p>
              <h2 className="mt-3 text-[28px] font-black tracking-tight text-[var(--color-text)] sm:text-[38px]">Danh mục nổi bật</h2>
            </div>
            <p className="label-tech text-[var(--color-text-dim)]">Hơn 4.900 phiên đang mở</p>
          </div>

          <div className="mt-8 grid gap-px overflow-hidden border border-[var(--color-line)] bg-[var(--color-line)] sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((c) => (
              <div key={c.name} className="group bg-[var(--color-bg)] p-5 transition-colors hover:bg-[var(--color-surface)]">
                <div className="flex items-start justify-between">
                  <p className="text-[16px] font-semibold text-[var(--color-text)]">{c.name}</p>
                  <span className="text-[var(--color-text-dim)] transition-colors group-hover:text-[var(--color-brand-strong)]">→</span>
                </div>
                <p className="mt-2 text-[12px] text-[var(--color-text-dim)]">{c.desc}</p>
                <p className="label-tech mt-4 text-[var(--color-brand-strong)]">{c.count}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== CÁCH HOẠT ĐỘNG ===================== */}
      <section id="how" className="mx-auto max-w-[1320px] px-4 py-16 lg:px-6 lg:py-24">
        <p className="label-tech text-[var(--color-brand-strong)]">Cách hoạt động</p>
        <h2 className="mt-3 text-[28px] font-black tracking-tight text-[var(--color-text)] sm:text-[38px]">Từ đăng ký đến chốt giá</h2>

        <div className="mt-8 grid gap-px overflow-hidden border border-[var(--color-line)] bg-[var(--color-line)] lg:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="bg-[var(--color-bg)] p-6">
              <p className="font-[var(--font-mono)] text-[12px] font-bold tracking-[0.14em] text-[var(--color-brand-strong)]">{s.n} — {s.tag}</p>
              <h3 className="mt-3 text-[17px] font-semibold text-[var(--color-text)]">{s.title}</h3>
              <p className="mt-2 text-[13px] leading-6 text-[var(--color-text-dim)]">{s.desc}</p>
              <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2">
                {s.links.map(([label, to]) => (
                  <Link
                    key={to}
                    to={to}
                    className="text-[12px] font-semibold text-[var(--color-brand-strong)] transition-colors hover:text-[var(--color-text)]"
                  >
                    {label} →
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===================== CTA ===================== */}
      <section className="mx-auto max-w-[1320px] px-4 pb-24 lg:px-6">
        <div className="relative overflow-hidden rounded-[var(--radius)] border border-[var(--color-brand)] px-6 py-12 text-center lg:px-16 lg:py-16">
          <div aria-hidden className="absolute inset-x-0 top-0 h-1 bg-[var(--color-brand)]" />
          <h2 className="relative text-[26px] font-black tracking-tight text-[var(--color-text)] sm:text-[36px]">
            Sẵn sàng chốt phiên tiếp theo?
          </h2>
          <p className="relative mx-auto mt-4 max-w-[520px] text-[14px] text-[var(--color-text-muted)]">
            Tạo tài khoản miễn phí và bắt đầu theo dõi những phiên đấu giá giá trị thật ngay hôm nay.
          </p>
          <Link
            to={isAuthenticated ? '/me' : '/register'}
            className="relative mt-8 inline-flex items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--color-brand)] px-6 py-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-[var(--color-on-brand)] transition-colors hover:bg-[var(--color-brand-strong)]"
          >
            {isAuthenticated ? 'Vào hồ sơ của tôi' : 'Đăng ký miễn phí'}
          </Link>
        </div>
      </section>
    </div>
  )
}
