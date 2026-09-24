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

// Ảnh minh hoạ danh mục — thay bằng ảnh thật từ backend khi có API.
const heroTiles = [
  { label: 'ĐIỆN TỬ', tone: 'from-[#0b2a52] via-[#071b34] to-[#04101f]' },
  { label: 'SƯU TẦM', tone: 'from-[#0a3a55] via-[#082a44] to-[#04101f]' },
  { label: 'XE & PHỤ KIỆN', tone: 'from-[#123a5e] via-[#0a2540] to-[#04101f]' },
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
      <section className="relative overflow-hidden">
        {/* Glow nền xanh */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full opacity-40 blur-[120px]"
          style={{ background: 'radial-gradient(circle, var(--color-brand) 0%, transparent 65%)' }}
        />

        <div className="relative mx-auto max-w-[1320px] px-4 pt-14 lg:px-6 lg:pt-20">
          {/* Eyebrow */}
          <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-line)] bg-white/5 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-brand">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--color-accent)]" />
              Nền tảng đấu giá trực tuyến
            </span>

            <h1 className="mt-6 text-[42px] font-black leading-[0.98] tracking-tight text-[var(--color-text)] sm:text-[64px] lg:text-[76px]">
              Đấu giá giá trị thật.
              <br />
              <span className="text-gradient">Trong tích tắc.</span>
            </h1>

            <p className="mt-6 max-w-[620px] text-[15px] leading-7 text-[var(--color-text-muted)]">
              Nơi hội tụ những phiên đấu giá được tuyển chọn — giá trị thật, người bán xác thực và
              cạnh tranh công bằng. Đặt giá chỉ trong vài giây.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                to={isAuthenticated ? '/me' : '/register'}
                className="group inline-flex items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--color-brand)] px-6 py-3 text-[14px] font-semibold text-white transition-transform hover:-translate-y-0.5 hover:bg-[var(--color-brand-strong)]"
              >
                <span aria-hidden>›</span> Bắt đầu đấu giá
              </Link>
              <a
                href="#explore"
                className="inline-flex items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--color-line-strong)] px-6 py-3 text-[14px] font-semibold text-[var(--color-text)] transition-colors hover:border-[var(--color-brand)] hover:text-[var(--color-accent)]"
              >
                Khám phá phiên
              </a>
            </div>
          </div>

          {/* Dải 3 cột ảnh — staggered kiểu Northwall */}
          <div className="mt-14 grid grid-cols-1 gap-3 sm:grid-cols-3 lg:mt-20 lg:items-start">
            {heroTiles.map((tile, i) => (
              <div
                key={tile.label}
                className={`group relative h-[300px] overflow-hidden rounded-xl border border-[var(--color-line)] sm:h-[360px] lg:h-[420px] ${i === 1 ? 'lg:-mt-8 lg:h-[470px]' : ''
                  }`}
              >
                <div className={`absolute inset-0 bg-gradient-to-b ${tile.tone} transition-transform duration-700 group-hover:scale-105`} />
                <div
                  aria-hidden
                  className="absolute inset-0 opacity-30"
                  style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)', backgroundSize: '22px 22px' }}
                />
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between p-5">
                  <span className={`text-[13px] font-semibold tracking-[0.18em] ${i === 1 ? 'text-white' : 'text-white/60'} group-hover:text-white`}>
                    {tile.label}
                  </span>
                  <span className="text-white/40 transition-transform group-hover:translate-x-1 group-hover:text-white">→</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== PHIÊN NỔI BẬT ===================== */}
      <section className="mx-auto max-w-[1320px] px-4 py-16 lg:px-6 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-brand">Phiên nổi bật</p>
            <h2 className="mt-3 text-[32px] font-black leading-tight tracking-tight text-[var(--color-text)] sm:text-[40px]">
              Một phiên đấu giá
              <br />
              <span className="text-[var(--color-text-dim)]">đang nóng lên.</span>
            </h2>
            <p className="mt-4 max-w-[480px] text-[14px] leading-6 text-[var(--color-text-muted)]">
              Theo dõi giá theo thời gian thực và chốt ưu thế trước khi đồng hồ kết thúc. Mọi lượt đặt giá đều được ghi nhận minh bạch.
            </p>
            <div className="mt-6 flex gap-8">
              <div>
                <p className="font-mono text-[24px] font-bold text-[var(--color-text)]">98%</p>
                <p className="text-[12px] text-[var(--color-text-dim)]">Giao dịch thành công</p>
              </div>
              <div>
                <p className="font-mono text-[24px] font-bold text-[var(--color-text)]">24/7</p>
                <p className="text-[12px] text-[var(--color-text-dim)]">Hỗ trợ trực tuyến</p>
              </div>
              <div>
                <p className="font-mono text-[24px] font-bold text-[var(--color-text)]">5.2k</p>
                <p className="text-[12px] text-[var(--color-text-dim)]">Người dùng hoạt động</p>
              </div>
            </div>
            <Link
              to={isAuthenticated ? '/me' : '/register'}
              className="mt-8 inline-flex items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--color-line-strong)] px-5 py-3 text-[13px] font-semibold text-[var(--color-text)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
            >
              Tạo phiên đấu giá <span aria-hidden>→</span>
            </Link>
          </div>

          {/* Card phiên nổi bật */}
          <div className="rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-gradient-to-b from-[var(--color-surface)] to-[var(--color-bg)] p-3">
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-gradient-to-br from-[var(--tile-1-a)] via-[var(--tile-1-b)] to-[var(--color-bg)]">
              <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-[var(--color-accent)] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[var(--color-on-brand)]">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--color-on-brand)]" /> Sắp kết thúc
              </div>
              <div className="flex h-full items-center justify-center">
                <div className="grid h-40 w-40 rotate-45 place-items-center border border-white/10">
                  <div className="grid h-32 w-32 place-items-center border border-white/10">
                    <span className="-rotate-45 text-[30px] font-black tracking-tighter text-white/25">PS5</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-3 flex items-end justify-between gap-4 px-2">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-[var(--color-text-dim)]">{featured.title} — Giá hiện tại</p>
                <p className="mt-1 font-mono text-[22px] font-bold text-[var(--color-text)]">{formatVND(featured.price)}</p>
              </div>
              <div className="text-right">
                <p className="text-[11px] uppercase tracking-wider text-brand">Còn lại</p>
                <p className="mt-1 font-mono text-[20px] font-bold text-[var(--color-accent)]">{countdown}</p>
              </div>
            </div>
            <Link
              to="/login"
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-[var(--color-brand)] py-3 text-[13px] font-semibold text-white transition-colors hover:bg-[var(--color-brand-strong)]"
            >
              Xem phiên đấu giá <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ===================== DANH MỤC ===================== */}
      <section id="categories" className="border-y border-[var(--color-line)] bg-[var(--color-surface)]/40">
        <div className="mx-auto max-w-[1320px] px-4 py-16 lg:px-6 lg:py-20" id="explore">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-brand">Khám phá</p>
              <h2 className="mt-3 text-[30px] font-black tracking-tight text-[var(--color-text)] sm:text-[38px]">Danh mục nổi bật</h2>
            </div>
            <p className="text-[13px] text-[var(--color-text-dim)]">Hơn 4.900 phiên đang mở</p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((c) => (
              <div
                key={c.name}
                className="group relative overflow-hidden rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)]/60 p-5 transition-colors hover:border-[var(--color-line-strong)]"
              >
                <div className="flex items-start justify-between">
                  <p className="text-[16px] font-semibold text-[var(--color-text)]">{c.name}</p>
                  <span className="text-[var(--color-text-dim)] transition-colors group-hover:text-[var(--color-accent)]">→</span>
                </div>
                <p className="mt-2 text-[12px] text-[var(--color-text-dim)]">{c.desc}</p>
                <p className="mt-4 text-[11px] font-semibold uppercase tracking-wider text-brand">{c.count}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== CÁCH HOẠT ĐỘNG ===================== */}
      <section id="how" className="mx-auto max-w-[1320px] px-4 py-16 lg:px-6 lg:py-20">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-brand">Cách hoạt động</p>
        <h2 className="mt-3 text-[30px] font-black tracking-tight text-[var(--color-text)] sm:text-[38px]">Từ đăng ký đến chốt giá</h2>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)]/60 p-6">
              <p className="font-mono text-[12px] font-bold tracking-wider text-brand">{s.n} — {s.tag}</p>
              <h3 className="mt-3 text-[17px] font-semibold text-[var(--color-text)]">{s.title}</h3>
              <p className="mt-2 text-[13px] leading-6 text-[var(--color-text-dim)]">{s.desc}</p>
              <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2">
                {s.links.map(([label, to]) => (
                  <Link
                    key={to}
                    to={to}
                    className="text-[12px] font-semibold text-[var(--color-accent)] transition-colors hover:text-[var(--color-text)]"
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
      <section className="mx-auto max-w-[1320px] px-4 pb-20 lg:px-6">
        <div className="relative overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-gradient-to-r from-[var(--tile-1-a)] to-[var(--color-bg)] px-6 py-12 text-center lg:px-16 lg:py-16">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full opacity-40 blur-[100px]"
            style={{ background: 'radial-gradient(circle, var(--color-accent) 0%, transparent 65%)' }}
          />
          <h2 className="relative text-[28px] font-black tracking-tight text-[var(--color-text)] sm:text-[36px]">
            Sẵn sàng chốt phiên tiếp theo?
          </h2>
          <p className="relative mx-auto mt-4 max-w-[520px] text-[14px] text-[var(--color-text-muted)]">
            Tạo tài khoản miễn phí và bắt đầu theo dõi những phiên đấu giá giá trị thật ngay hôm nay.
          </p>
          <Link
            to={isAuthenticated ? '/me' : '/register'}
            className="relative mt-8 inline-flex items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--color-brand)] px-6 py-3 text-[14px] font-semibold text-white transition-transform hover:-translate-y-0.5 hover:bg-[var(--color-brand-strong)]"
          >
            <span aria-hidden>›</span> {isAuthenticated ? 'Vào hồ sơ của tôi' : 'Đăng ký miễn phí'}
          </Link>
        </div>
      </section>
    </div>
  )
}
