export default function Footer() {
  return (
    <footer className="border-t border-[var(--color-line)] bg-white">
      <div className="container-page py-16">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          {/* Thương hiệu */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center bg-black font-[var(--font-display)] text-[16px] font-black leading-none text-white">
                A
              </span>
              <span className="font-[var(--font-display)] text-[17px] font-black uppercase tracking-[0.14em]">
                <span className="text-black">Auction</span>
                <span className="text-[var(--color-brand)]">.vn</span>
              </span>
            </div>
            <p className="max-w-[36ch] text-[13px] leading-relaxed text-[var(--color-text-muted)]">
              Sàn đấu giá trực tuyến minh bạch — nơi người bán đăng tin và người
              mua trả giá theo thời gian thực.
            </p>
          </div>

          {/* Điều hướng */}
          <nav className="flex flex-col gap-3" aria-label="Liên kết chân trang">
            <p className="label-tech text-[var(--color-brand)]">Sản phẩm</p>
            <a href="#categories" className="text-[13px] text-[var(--color-text-muted)] transition-colors hover:text-black">Danh mục</a>
            <a href="#how" className="text-[13px] text-[var(--color-text-muted)] transition-colors hover:text-black">Cách hoạt động</a>
            <a href="#" className="text-[13px] text-[var(--color-text-muted)] transition-colors hover:text-black">Điều khoản</a>
            <a href="#" className="text-[13px] text-[var(--color-text-muted)] transition-colors hover:text-black">Bảo mật</a>
          </nav>

          {/* Liên hệ */}
          <div className="flex flex-col gap-3">
            <p className="label-tech text-[var(--color-brand)]">Liên hệ</p>
            <a href="mailto:hello@auction.vn" className="text-[13px] text-[var(--color-text-muted)] transition-colors hover:text-black">
              hello@auction.vn
            </a>
            <a href="#" className="text-[13px] text-[var(--color-text-muted)] transition-colors hover:text-black">
              Trung tâm hỗ trợ
            </a>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-[var(--color-line)] pt-6 md:flex-row md:items-center md:justify-between">
          <span className="label-tech">© 2026 Online Auction System</span>
          <span className="label-tech">Sport minimal — Adidas inspired</span>
        </div>
      </div>
    </footer>
  )
}
