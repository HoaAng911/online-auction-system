export default function Footer() {
  return (
    <footer className="border-t border-[var(--color-line)] bg-[var(--color-bg)]">
      <div className="mx-auto max-w-[1320px] px-4 py-10 lg:px-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-8 w-8 place-items-center rounded-[6px] bg-[var(--color-brand)] font-[var(--font-mono)] text-[14px] font-bold text-[var(--color-on-brand)]">
              A
            </span>
            <span className="font-[var(--font-mono)] text-[14px] font-bold uppercase tracking-[0.14em]">
              <span className="text-[var(--color-text)]">AUCTION</span>
              <span className="text-[var(--color-brand-strong)]">.VN</span>
            </span>
            <span className="label-tech md:ml-3">© 2026 Online Auction System</span>
          </div>
          <div className="flex gap-6">
            <a href="#" className="label-tech transition-colors hover:text-[var(--color-text)]">Điều khoản</a>
            <a href="#" className="label-tech transition-colors hover:text-[var(--color-text)]">Bảo mật</a>
            <a href="#" className="label-tech transition-colors hover:text-[var(--color-text)]">Liên hệ</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
