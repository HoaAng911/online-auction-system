import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Alert, AuthCard, Field, PrimaryButton, TextInput } from '../components/ui'
import { getApiErrorMessage } from '../services/api'
import { authService } from '../services/authService'

export default function VerifyEmail() {
  const [params] = useSearchParams()
  const [token, setToken] = useState(params.get('token') || '')
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  // Chống double-call khi React StrictMode remount (token chỉ dùng được 1 lần).
  const autoRan = useRef(false)

  const submit = async (e) => {
    e?.preventDefault()
    setError('')
    setMsg('')
    if (!token.trim()) return setError('Vui lòng nhập token xác thực')
    setLoading(true)
    try {
      const res = await authService.verifyEmail(token.trim())
      setMsg(res.message || 'Xác thực email thành công')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Xác thực thất bại'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (params.get('token') && !autoRan.current) {
      autoRan.current = true
      submit()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-12 lg:px-6">
      <AuthCard
        eyebrow="Bảo mật tài khoản"
        title="Xác thực email"
        subtitle="Nhập token từ email hoặc mở link xác thực được gửi sau khi đăng ký."
        footer={<Link to="/login" className="font-semibold text-[var(--color-accent)] hover:underline">Quay lại đăng nhập →</Link>}
      >
        <form onSubmit={submit} className="flex flex-col gap-4">
          <Alert>{error}</Alert>
          {msg && <Alert type="success">{msg}</Alert>}
          <Field label="Token xác thực">
            <TextInput value={token} onChange={(e) => setToken(e.target.value)} placeholder="Dán token từ email" />
          </Field>
          <PrimaryButton loading={loading}>Xác thực</PrimaryButton>
        </form>
      </AuthCard>
    </div>
  )
}
