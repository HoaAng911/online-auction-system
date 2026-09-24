import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Alert, AuthCard, Field, PrimaryButton, TextInput } from '../components/ui'
import { getApiErrorMessage } from '../services/api'
import { authService } from '../services/authService'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setMsg('')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError('Email không hợp lệ')
    setLoading(true)
    try {
      const res = await authService.forgotPassword(email.trim())
      setMsg(res.message || 'Nếu email tồn tại, link đặt lại mật khẩu đã được gửi')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Gửi yêu cầu thất bại'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-12 lg:px-6">
      <AuthCard
        eyebrow="Khôi phục truy cập"
        title="Quên mật khẩu"
        subtitle="Nhập email đăng ký để nhận link đặt lại mật khẩu."
        footer={<Link to="/login" className="font-semibold text-[var(--color-accent)] hover:underline">Quay lại đăng nhập →</Link>}
      >
        <form onSubmit={submit} className="flex flex-col gap-4">
          <Alert>{error}</Alert>
          {msg && <Alert type="success">{msg}</Alert>}
          <Field label="Email">
            <TextInput value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ban@email.com" autoComplete="email" />
          </Field>
          <PrimaryButton loading={loading}>Gửi link đặt lại</PrimaryButton>
        </form>
      </AuthCard>
    </div>
  )
}
