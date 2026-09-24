export default function Footer() {
  return (
    <footer className="border-t border-[var(--color-line)] bg-[var(--color-bg)]">
      <div className="mx-auto max-w-[1320px] px-4 py-10 lg:px-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-8 w-8 place-items-center rounded-md bg-[var(--color-brand)] text-[14px] font-black text-white">A</span>
            <span className="text-[14px] font-bold tracking-tight">
              <span className="text-white">AUCTION</span>
              <span className="text-[var(--color-accent)]">.VN</span>
            </span>
            <span className="text-[12px] text-zinc-500 md:ml-3">© 2026 Online Auction System</span>
          </div>
          <div className="flex gap-6 text-[12px] text-zinc-500">
            <a href="#" className="transition-colors hover:text-white">Điều khoản</a>
            <a href="#" className="transition-colors hover:text-white">Bảo mật</a>
            <a href="#" className="transition-colors hover:text-white">Liên hệ</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
