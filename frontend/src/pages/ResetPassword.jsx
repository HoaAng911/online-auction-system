import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Alert, AuthCard, Field, PrimaryButton, TextInput } from '../components/ui'
import { getApiErrorMessage } from '../services/api'
import { authService } from '../services/authService'

export default function ResetPassword() {
  const [params] = useSearchParams()
  const [token, setToken] = useState(params.get('token') || '')
  const [newPassword, setNewPassword] = useState('')
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setMsg('')
    if (!token.trim()) return setError('Token là bắt buộc')
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(newPassword))
      return setError('Mật khẩu phải có chữ hoa, chữ thường và số, tối thiểu 8 ký tự')
    setLoading(true)
    try {
      const res = await authService.resetPassword(token.trim(), newPassword)
      setMsg(res.message || 'Đặt lại mật khẩu thành công. Hãy đăng nhập lại.')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Đặt lại mật khẩu thất bại'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-12 lg:px-6">
      <AuthCard
        eyebrow="Đặt lại mật khẩu"
        title="Tạo mật khẩu mới"
        subtitle="Token có hiệu lực 1 giờ. Sau khi đổi, mọi phiên đăng nhập cũ sẽ bị thu hồi."
        footer={<Link to="/login" className="font-semibold text-[var(--color-accent)] hover:underline">Đăng nhập →</Link>}
      >
        <form onSubmit={submit} className="flex flex-col gap-4">
          <Alert>{error}</Alert>
          {msg && <Alert type="success">{msg}</Alert>}
          <Field label="Token đặt lại">
            <TextInput value={token} onChange={(e) => setToken(e.target.value)} placeholder="Dán token từ email" />
          </Field>
          <Field label="Mật khẩu mới">
            <TextInput type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" autoComplete="new-password" />
          </Field>
          <PrimaryButton loading={loading}>Đặt lại mật khẩu</PrimaryButton>
        </form>
      </AuthCard>
    </div>
  )
}
