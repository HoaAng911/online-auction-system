import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Alert } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { getApiErrorMessage } from '../services/api'
import sideImage from '../assets/logintheme.png'

/* Icon SVG nội tuyến (không phụ thuộc thư viện) */
function IconUser(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5.5 19.5a6.5 6.5 0 0 1 13 0" />
    </svg>
  )
}
function IconLock(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="4.5" y="10.5" width="15" height="10" rx="2.4" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
      <circle cx="12" cy="15.5" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  )
}
function IconMail(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2.4" />
      <path d="m4 7 8 5.5L20 7" />
    </svg>
  )
}
function IconPhone(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M6.5 3.5h3l1.5 4-2 1.4a12 12 0 0 0 5.1 5.1l1.4-2 4 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.5 5.7a2 2 0 0 1 2-2.2Z" />
    </svg>
  )
}
function IconPin(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 21s6.5-5.6 6.5-10.5A6.5 6.5 0 0 0 5.5 10.5C5.5 15.4 12 21 12 21Z" />
      <circle cx="12" cy="10.5" r="2.3" />
    </svg>
  )
}
function IconArrow(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 12h15M13 6l6 6-6 6" />
    </svg>
  )
}
function IconGoogle(props) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path fill="#EA4335" d="M12 10.2v3.9h5.5a4.7 4.7 0 0 1-2 3.1l3.2 2.5c1.9-1.7 3-4.3 3-7.4 0-.7-.1-1.4-.2-2H12Z" />
      <path fill="#34A853" d="M12 22c2.7 0 4.9-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1a5.9 5.9 0 0 1-5.6-4.1l-3.3 2.6A10 10 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.4 14a6 6 0 0 1 0-3.8L3.1 7.6a10 10 0 0 0 0 8.9L6.4 14Z" />
      <path fill="#4285F4" d="M12 6.1c1.5 0 2.8.5 3.8 1.5l2.8-2.8A10 10 0 0 0 3.1 7.6l3.3 2.6A5.9 5.9 0 0 1 12 6.1Z" />
    </svg>
  )
}
function IconFacebook(props) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <rect width="24" height="24" rx="5" fill="#1877F2" />
      <path fill="#fff" d="M15.6 12.5h-2.2V20h-3v-7.5H8.7V9.9h1.7V8.3c0-2 1.2-3.3 3.1-3.3.9 0 1.8.2 1.8.2v2h-1c-1 0-1.3.6-1.3 1.3v1.4h2.3l-.4 2.6Z" />
    </svg>
  )
}

const BLANK = {
  username: '',
  email: '',
  password: '',
  fullName: '',
  phoneNumber: '',
  address: '',
}

export default function Auth({ mode }) {
  const isLogin = mode === 'login'
  const navigate = useNavigate()
  const location = useLocation()
  const { login, register } = useAuth()

  const [form, setForm] = useState(BLANK)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(false)
  // key đổi mỗi lần chuyển form -> remount để replay animation
  const [animKey, setAnimKey] = useState(0)

  useEffect(() => {
    setError('')
    setNotice('')
    setForm(BLANK)
    setAnimKey((k) => k + 1)
  }, [mode])

  const update = (key) => (e) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }))

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setNotice('')

    if (isLogin) {
      if (!form.email.trim() || !form.password) {
        setError('Vui lòng nhập đầy đủ email và mật khẩu.')
        return
      }
    } else {
      if (!form.username.trim() || !form.email.trim() || !form.password || !form.fullName.trim()) {
        setError('Vui lòng nhập đầy đủ tên đăng nhập, họ tên, email và mật khẩu.')
        return
      }
    }

    setLoading(true)
    try {
      if (isLogin) {
        await login({ usernameOrEmail: form.email.trim(), password: form.password })
        const to = location.state?.from ?? '/'
        navigate(to, { replace: true })
      } else {
        await register({
          username: form.username.trim(),
          email: form.email.trim(),
          password: form.password,
          fullName: form.fullName.trim(),
          phone: form.phoneNumber.trim(),
          address: form.address.trim(),
        })
        setNotice('Đăng ký thành công! Bạn có thể kiểm tra email để xác thực tài khoản.')
        setForm(BLANK)
      }
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const inputBase =
    'h-14 w-full rounded-2xl bg-white/[0.03] pl-12 pr-4 text-[15px] text-zinc-100 placeholder-zinc-500 outline-none ring-1 ring-inset ring-white/10 transition focus:bg-white/[0.05] focus:ring-2 focus:ring-[var(--color-accent)]/60'
  const iconClass =
    'pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-zinc-500'

  // Panel ảnh trượt sang phải khi ở Register, sang trái khi ở Login (desktop)
  const imageOrder = isLogin ? 'lg:order-2' : 'lg:order-1'
  const formOrder = isLogin ? 'lg:order-1' : 'lg:order-2'
  // Animation: form mới trượt vào từ phía đối diện
  const animName = isLogin ? 'auth-in-left' : 'auth-in-right'

  return (
    <div className="relative flex min-h-[100dvh] items-center justify-center bg-[var(--color-bg)] px-4 py-10">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[var(--color-brand)]/20 blur-[120px]" />
        <div className="absolute -bottom-32 right-0 h-80 w-80 rounded-full bg-[var(--color-accent)]/15 blur-[140px]" />
      </div>

      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-[32px] bg-[var(--color-surface)] shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9)] ring-1 ring-[var(--color-line)] lg:grid-cols-2">
        {/* Panel ảnh */}
        <div className={`relative order-1 p-3 sm:p-4 ${imageOrder}`}>
          <div className="relative h-56 w-full overflow-hidden rounded-[24px] lg:h-full lg:min-h-[560px]">
            <img
              key={animKey}
              src={sideImage}
              alt=""
              className="h-full w-full object-cover"
              style={{ animation: 'auth-fade-swap 0.7s var(--ease-out-expo) both' }}
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-[var(--color-bg)]/70 via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 text-white">
              <p className="font-[var(--font-display)] text-2xl font-semibold drop-shadow">
                {isLogin ? 'Chào mừng trở lại' : 'Tham gia cộng đồng'}
              </p>
              <p className="mt-1 max-w-xs text-sm text-white/80">
                {isLogin
                  ? 'Đăng nhập để tiếp tục đấu giá và theo dõi các phiên yêu thích.'
                  : 'Tạo tài khoản để bắt đầu đặt giá và sở hữu những món đồ độc đáo.'}
              </p>
            </div>
          </div>
        </div>

        {/* Panel form */}
        <div className={`order-2 p-7 sm:p-10 ${formOrder}`}>
          <div
            key={animKey}
            className="mx-auto flex h-full max-w-sm flex-col justify-center"
            style={{ animation: `${animName} 0.55s var(--ease-out-expo) both` }}
          >
            <h1 className="font-[var(--font-display)] text-4xl font-extrabold tracking-tight text-white">
              {isLogin ? 'Welcome' : 'Create account'}
            </h1>
            <p className="mt-2 text-sm text-zinc-400">
              {isLogin
                ? 'We are glad to see you back with us'
                : 'Một vài thông tin để bắt đầu hành trình đấu giá'}
            </p>

            <form onSubmit={onSubmit} className="mt-7 flex flex-col gap-3.5">
              {notice && <Alert kind="success">{notice}</Alert>}
              {error && <Alert kind="error">{error}</Alert>}

              {!isLogin && (
                <>
                  <div className="relative">
                    <IconUser className={iconClass} />
                    <input
                      className={inputBase}
                      placeholder="Username"
                      value={form.username}
                      onChange={update('username')}
                      autoComplete="username"
                    />
                  </div>
                  <div className="relative">
                    <IconUser className={iconClass} />
                    <input
                      className={inputBase}
                      placeholder="Họ và tên"
                      value={form.fullName}
                      onChange={update('fullName')}
                      required
                    />
                  </div>
                </>
              )}

              <div className="relative">
                <IconMail className={iconClass} />
                <input
                  type="email"
                  className={inputBase}
                  placeholder="Email"
                  value={form.email}
                  onChange={update('email')}
                  autoComplete="email"
                />
              </div>

              <div className="relative">
                <IconLock className={iconClass} />
                <input
                  type="password"
                  className={inputBase}
                  placeholder="Password"
                  value={form.password}
                  onChange={update('password')}
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                />
              </div>

              {!isLogin && (
                <>
                  <div className="relative">
                    <IconPhone className={iconClass} />
                    <input
                      className={inputBase}
                      placeholder="Số điện thoại (tuỳ chọn)"
                      value={form.phoneNumber}
                      onChange={update('phoneNumber')}
                    />
                  </div>
                  <div className="relative">
                    <IconPin className={iconClass} />
                    <input
                      className={inputBase}
                      placeholder="Địa chỉ (tuỳ chọn)"
                      value={form.address}
                      onChange={update('address')}
                    />
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-2 inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--color-accent)] text-[15px] font-semibold text-[var(--color-bg)] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Đang xử lý...' : isLogin ? 'Login' : 'Đăng ký'}
                {!loading && <IconArrow className="h-[18px] w-[18px]" />}
              </button>
            </form>

            {/* Social — chỉ hiện ở Login như ảnh mẫu */}
            {isLogin && (
              <>
                <div className="my-6 flex items-center gap-4 text-xs font-medium text-zinc-400">
                  <span className="h-px flex-1 bg-white/10" />
                  Login with Others
                  <span className="h-px flex-1 bg-white/10" />
                </div>
                <div className="flex flex-col gap-3">
                  <button
                    type="button"
                    className="inline-flex h-12 w-full items-center justify-center gap-3 rounded-2xl bg-white/[0.03] text-sm font-medium text-white ring-1 ring-inset ring-white/10 transition hover:bg-white/[0.06]"
                  >
                    <IconGoogle className="h-5 w-5" />
                    Login with <span className="font-semibold">Google</span>
                  </button>
                  <button
                    type="button"
                    className="inline-flex h-12 w-full items-center justify-center gap-3 rounded-2xl bg-white/[0.03] text-sm font-medium text-white ring-1 ring-inset ring-white/10 transition hover:bg-white/[0.06]"
                  >
                    <IconFacebook className="h-5 w-5" />
                    Login with <span className="font-semibold">Facebook</span>
                  </button>
                </div>
              </>
            )}

            {/* Chuyển đổi Login <-> Register (mượt, không tải lại) */}
            <p className="mt-7 text-center text-sm text-zinc-400">
              {isLogin ? (
                <>
                  Chưa có tài khoản?{' '}
                  <Link
                    to="/register"
                    state={location.state}
                    className="font-semibold text-[var(--color-accent)] transition hover:text-white"
                  >
                    Đăng ký
                  </Link>
                </>
              ) : (
                <>
                  Đã có tài khoản?{' '}
                  <Link
                    to="/login"
                    state={location.state}
                    className="font-semibold text-[var(--color-accent)] transition hover:text-white"
                  >
                    Đăng nhập
                  </Link>
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
