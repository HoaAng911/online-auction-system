import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import motorcycle from '../assets/Bitmap.png'

const HEADER_OFFSET = 64 // chiều cao navbar, dùng để cuộn đúng vị trí khi bấm tab

// Các bước điều hướng theo phong cách "model selector" trong ảnh reference
const STEPS = [
  { n: '01', key: 'explore', label: 'KHÁM PHÁ', target: 'explore' },
  { n: '02', key: 'categories', label: 'DANH MỤC', target: 'categories' },
  { n: '03', key: 'how', label: 'CÁCH HOẠT ĐỘNG', target: 'how' },
  { n: '04', key: 'featured', label: 'NỔI BẬT', target: 'featured' },
  { n: '05', key: 'cta', label: 'THAM GIA', target: 'cta' },
]

const FEATURED = [
  { name: 'Rolex Submariner', desc: 'Đồng hồ cơ Thuỵ Sĩ, hộp full.', price: '2.450.000.000 ₫', tag: '08' },
  { name: 'Patek Philippe Nautilus', desc: 'Bản giới hạn, chưa qua sử dụng.', price: '5.900.000.000 ₫', tag: '05' },
  { name: 'Hermès Birkin 25', desc: 'Da Togo, màu Gold, tem vàng.', price: '1.780.000.000 ₫', tag: '12' },
  { name: 'PS5 Digital Edition', desc: 'Máy nguyên seal, bảo hành 12 tháng.', price: '12.990.000 ₫', tag: '31' },
]

const CATEGORIES = [
  { name: 'Đồng hồ & Trang sức', count: 248, glyph: '⌚' },
  { name: 'Đồ điện tử', count: 512, glyph: '⌗' },
  { name: 'Nghệ thuật & Sưu tầm', count: 129, glyph: '🖼' },
  { name: 'Xe & Phụ tùng', count: 87, glyph: '⛭' },
]

export default function Home() {
  const { isAuthenticated } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [activeStep, setActiveStep] = useState('explore')

  // Khi tab được bấm từ navbar (điều hướng kèm state), cuộn tới section tương ứng
  useEffect(() => {
    const target = location.state?.scrollTo
    if (!target) return
    const el = document.getElementById(target)
    if (!el) return
    const top = el.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET
    window.scrollTo({ top, behavior: 'smooth' })
    setActiveStep(target)
  }, [location.state])

  const goTo = (id) => {
    setActiveStep(id)
    const el = document.getElementById(id)
    if (!el) return
    const top = el.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET
    window.scrollTo({ top, behavior: 'smooth' })
  }

  return (
    <div id="explore" className="bg-white">
      {/* ============ HERO — Adidas style: white, bold, minimal ============ */}
      <section className="border-b border-[var(--color-line)]">
        <div className="grid lg:grid-cols-[38%_62%]">
          {/* ---------- PANEL TRÁI (white) ---------- */}
          <div className="relative bg-white">
            <div className="flex">
              {/* Sidebar dọc: logo trên, hamburger giữa */}
              <aside className="flex w-16 shrink-0 flex-col items-center border-r border-[var(--color-line)] py-6">
                <span className="grid h-9 w-9 place-items-center bg-black font-[var(--font-display)] text-[15px] font-black leading-none text-white">
                  A
                </span>
                <div className="mt-auto flex flex-col gap-1.5" aria-hidden>
                  <span className="block h-[2px] w-5 bg-black" />
                  <span className="block h-[2px] w-5 bg-black" />
                  <span className="block h-[2px] w-5 bg-black" />
                </div>
              </aside>

              {/* Nội dung: thanh số bước + danh sách item */}
              <div className="min-w-0 flex-1">
                {/* Thanh bước 01–05 — Adidas style: black bg, white text, red active */}
                <div className="flex overflow-x-auto border-b border-[var(--color-line)] bg-black">
                  {STEPS.map((s) => {
                    const on = activeStep === s.target
                    return (
                      <button
                        key={s.n}
                        onClick={() => goTo(s.target)}
                        className={`min-w-[104px] shrink-0 border-r border-white/10 px-4 py-3 text-left transition-colors last:border-r-0 ${on ? 'bg-white' : 'bg-black hover:bg-black/80'}`}
                      >
                        <span className={`block font-[var(--font-mono)] text-[11px] font-bold ${on ? 'text-[var(--color-brand)]' : 'text-white/70'}`}>
                          {s.n}
                        </span>
                        <span className={`mt-0.5 block text-[10px] font-bold uppercase tracking-[0.14em] ${on ? 'text-black' : 'text-white/55'}`}>
                          {s.label}
                        </span>
                      </button>
                    )
                  })}
                </div>

                {/* Danh sách item ảnh + text */}
                <div className="divide-y divide-[var(--color-line)]">
                  {FEATURED.map((f, i) => {
                    const on = i === 0
                    return (
                      <button
                        key={f.name}
                        onClick={() => navigate('/items')}
                        className={`flex w-full items-center gap-4 px-4 py-5 text-left transition-colors ${on ? 'bg-[var(--color-bg-elev)]' : 'hover:bg-[var(--color-bg-elev)]'}`}
                      >
                        {/* Khối ảnh thumbnail sản phẩm */}
                        <span className="grid h-20 w-24 shrink-0 place-items-center overflow-hidden border border-[var(--color-line)] bg-white">
                          <img src={motorcycle} alt="" className="h-full w-full object-contain p-1.5" />
                        </span>
                        <span className="min-w-0">
                          <span className={`block font-[var(--font-display)] text-[18px] font-black uppercase leading-tight ${on ? 'text-[var(--color-brand)]' : 'text-black'}`}>
                            {f.name}
                          </span>
                          <span className="mt-1 block text-[11px] text-[var(--color-text-muted)]">
                            {f.desc}
                          </span>
                          <span className="mt-1 block font-[var(--font-mono)] text-[12px] text-black">
                            {f.price}
                          </span>
                        </span>
                      </button>
                    )
                  })}
                </div>

                {/* Footer panel trái: link phụ */}
                <div className="flex items-center gap-5 px-4 py-5 text-[var(--color-text-muted)]">
                  <span className="font-[var(--font-mono)] text-[11px] uppercase tracking-[0.16em]">@auction.vn</span>
                  <span className="font-[var(--font-mono)] text-[11px] uppercase tracking-[0.16em]">FAQ</span>
                </div>
              </div>
            </div>
          </div>

          {/* ---------- PANEL PHẢI (white, minimal) ---------- */}
          <div id="featured" className="relative min-h-[78vh] overflow-hidden bg-white">
            {/* Nav trên cùng bên phải */}
            <div className="relative z-20 flex items-center justify-end gap-6 px-8 pt-6">
              {['Khám phá', 'Về chúng tôi', 'Liên hệ'].map((t) => (
                <a key={t} href="#" className="text-[12px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-muted)] transition-colors hover:text-black">
                  {t}
                </a>
              ))}
              <a href="#" aria-label="Tìm kiếm" className="text-[12px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-muted)] transition-colors hover:text-black">⌕</a>
              <a href="#" aria-label="Thông báo" className="text-[12px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-muted)] transition-colors hover:text-black">◔</a>
            </div>

            {/* Wordmark khổng lồ mờ phía sau vật thể */}
            <span
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-[42%] z-0 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap font-[var(--font-display)] text-[clamp(80px,17vw,240px)] font-black uppercase leading-none tracking-[0.02em] text-black/[0.04]"
            >
              Auction
            </span>

            {/* Vật thể trung tâm: ảnh sản phẩm chủ lực */}
            <div className="relative z-10 flex min-h-[62vh] items-center justify-center px-8">
              <img
                src={motorcycle}
                alt="Sản phẩm chủ lực của phiên đấu giá"
                className="w-full max-w-[620px] object-contain"
              />
            </div>

            {/* Caption nhỏ trái + 360° phải */}
            <div className="relative z-20 flex items-center justify-between px-8 pb-6">
              <span className="text-[12px] font-bold uppercase tracking-[0.22em] text-black">Phiên chủ lực · 01</span>
              <button onClick={() => goTo('explore')} className="grid h-12 w-12 place-items-center border border-black text-[12px] font-bold uppercase tracking-[0.08em] text-black transition-colors hover:bg-black hover:text-white">
                360°
              </button>
            </div>

            {/* Thanh CTA 2 khối ở đáy: TỔNG QUAN (trắng) + ĐẶT GIÁ (đỏ) */}
            <div className="relative z-20 grid grid-cols-2 border-t border-[var(--color-line)]">
              <button
                onClick={() => goTo('how')}
                className="cta-btn border-r border-[var(--color-line)] bg-white py-6 text-center font-[var(--font-display)] text-[14px] font-black uppercase tracking-[0.2em] text-black transition-colors hover:bg-[var(--color-bg-elev)]"
              >
                Tổng quan
              </button>
              <button
                onClick={() => navigate(isAuthenticated ? '/items' : '/register')}
                className="cta-btn cta-btn-brand bg-[var(--color-brand)] py-6 text-center font-[var(--font-display)] text-[14px] font-black uppercase tracking-[0.2em] text-white transition-colors hover:bg-[var(--color-brand-strong)]"
              >
                Đặt giá
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ============ CÁCH HOẠT ĐỘNG ============ */}
      <section id="how" className="border-b border-[var(--color-line)]">
        <div className="container-page py-16">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="font-[var(--font-mono)] text-[12px] uppercase tracking-[0.2em] text-[var(--color-brand)]">02 — Cách hoạt động</p>
              <h2 className="mt-4 font-[var(--font-display)] text-[34px] font-black leading-[1.02] tracking-[-0.02em] text-black sm:text-[46px]">
                Bốn bước để chốt phiên.
              </h2>
            </div>
            <div className="grid gap-px overflow-hidden border border-[var(--color-line)] bg-[var(--color-line)] sm:grid-cols-2">
              {[
                { n: '01', t: 'Đăng nhập', d: 'Tạo tài khoản hoặc đăng nhập để theo dõi phiên.' },
                { n: '02', t: 'Chọn món', d: 'Lọc theo danh mục và đọc kỹ thông tin phiên đấu giá.' },
                { n: '03', t: 'Đặt giá', d: 'Trả giá theo thời gian thực, hệ thống cập nhật tức thời.' },
                { n: '04', t: 'Chốt phiên', d: 'Người trả cao nhất thắng khi đồng hồ đếm ngược về 0.' },
              ].map((s) => (
                <div key={s.n} className="bg-white p-7 transition-colors hover:bg-[var(--color-bg-elev)]">
                  <span className="font-[var(--font-mono)] text-[12px] font-bold text-[var(--color-brand)]">{s.n}</span>
                  <h3 className="mt-3 font-[var(--font-display)] text-[20px] font-black uppercase leading-tight text-black">{s.t}</h3>
                  <p className="desc-long mt-2 text-[13px] text-[var(--color-text-muted)]">{s.d}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ DANH MỤC ============ */}
      <section id="categories" className="border-b border-[var(--color-line)]">
        <div className="container-page py-16">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-[var(--font-mono)] text-[12px] uppercase tracking-[0.2em] text-[var(--color-brand)]">03 — Danh mục</p>
              <h2 className="mt-4 font-[var(--font-display)] text-[34px] font-black tracking-[-0.02em] text-black sm:text-[46px]">
                Theo lĩnh vực.
              </h2>
            </div>
            <Link to="/items" className="font-[var(--font-mono)] text-[12px] font-bold uppercase tracking-[0.1em] text-[var(--color-text-muted)] transition-colors hover:text-black">
              Xem tất cả →
            </Link>
          </div>

          <div className="mt-10 grid gap-px overflow-hidden border border-[var(--color-line)] bg-[var(--color-line)] sm:grid-cols-2 lg:grid-cols-4">
            {CATEGORIES.map((c) => (
              <Link key={c.name} to="/items" className="group relative flex min-h-[220px] flex-col justify-between bg-white p-6 transition-colors hover:bg-[var(--color-bg-elev)]">
                <span aria-hidden className="text-[34px] leading-none text-[var(--color-brand)]">{c.glyph}</span>
                <span>
                  <span className="block font-[var(--font-display)] text-[20px] font-black uppercase leading-tight text-black group-hover:text-[var(--color-brand)]">
                    {c.name}
                  </span>
                  <span className="mt-2 block font-[var(--font-mono)] text-[12px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
                    {c.count} phiên đang mở
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CTA ============ */}
      <section id="cta" className="relative overflow-hidden bg-black">
        <span
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap font-[var(--font-display)] text-[clamp(70px,16vw,220px)] font-black uppercase leading-none text-white/[0.06]"
        >
          Auction
        </span>
        <div className="container-page relative z-10 py-20 text-center">
          <p className="font-[var(--font-mono)] text-[12px] uppercase tracking-[0.22em] text-[var(--color-brand)]">05 — Tham gia</p>
          <h2 className="mx-auto mt-5 max-w-[20ch] font-[var(--font-display)] text-[38px] font-black leading-[1.02] tracking-[-0.02em] text-white sm:text-[58px]">
            Sẵn sàng chốt <span className="text-[var(--color-brand)]">phiên tiếp theo?</span>
          </h2>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-px">
            <Link to={isAuthenticated ? '/me' : '/register'} className="cta-btn bg-white px-10 py-4 font-[var(--font-display)] text-[13px] font-black uppercase tracking-[0.2em] text-black transition-colors hover:bg-[var(--color-bg-elev)]">
              {isAuthenticated ? 'Vào tài khoản' : 'Đăng ký miễn phí'}
            </Link>
            <Link to="/items" className="cta-btn cta-btn-brand bg-[var(--color-brand)] px-10 py-4 font-[var(--font-display)] text-[13px] font-black uppercase tracking-[0.2em] text-white transition-colors hover:bg-[var(--color-brand-strong)]">
              Xem phiên đang mở
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
