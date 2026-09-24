import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Alert, AuthCard, Field, PrimaryButton, TextInput } from '../components/ui'
import { getApiErrorMessage } from '../services/api'
import { userService } from '../services/userService'

export default function ChangePassword() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '' })
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setMsg('')
    if (!form.currentPassword) return setError('Vui lòng nhập mật khẩu hiện tại')
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(form.newPassword))
      return setError('Mật khẩu mới phải có chữ hoa, chữ thường và số, tối thiểu 8 ký tự')
    setLoading(true)
    try {
      const res = await userService.changePassword(form.currentPassword, form.newPassword)
      setMsg(res.message || 'Đổi mật khẩu thành công')
      setForm({ currentPassword: '', newPassword: '' })
    } catch (err) {
      setError(getApiErrorMessage(err, 'Đổi mật khẩu thất bại'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-12 lg:px-6">
      <AuthCard
        eyebrow="Bảo mật"
        title="Đổi mật khẩu"
        subtitle="Yêu cầu đăng nhập. Mật khẩu mới phải khác mật khẩu cũ."
        footer={<Link to="/me" className="font-semibold text-[var(--color-accent)] hover:underline">Quay lại hồ sơ →</Link>}
      >
        <form onSubmit={submit} className="flex flex-col gap-4">
          <Alert>{error}</Alert>
          {msg && <Alert type="success">{msg}</Alert>}
          <Field label="Mật khẩu hiện tại">
            <TextInput type="password" value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} />
          </Field>
          <Field label="Mật khẩu mới">
            <TextInput type="password" value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} />
          </Field>
          <PrimaryButton loading={loading}>Đổi mật khẩu</PrimaryButton>
        </form>
      </AuthCard>
    </div>
  )
}
