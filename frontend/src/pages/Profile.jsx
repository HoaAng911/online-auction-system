import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Alert, Field, PrimaryButton, TextInput } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { getApiErrorMessage } from '../services/api'
import { userService } from '../services/userService'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'

export default function Profile() {
  const { user, refreshMe } = useAuth()
  const [form, setForm] = useState({ fullName: '', phone: '', address: '', avatarUrl: '' })
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) {
      setForm({
        fullName: user.fullName || '',
        phone: user.phone || '',
        address: user.address || '',
        avatarUrl: user.avatarUrl || '',
      })
    }
  }, [user])

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setMsg('')
    setLoading(true)
    try {
      const payload = {
        fullName: form.fullName.trim() || undefined,
        phone: form.phone.trim() || undefined,
        address: form.address.trim() || undefined,
        avatarUrl: form.avatarUrl.trim() || undefined,
      }
      const res = await userService.updateMe(payload)
      await refreshMe()
      setMsg(res.message || 'Cập nhật hồ sơ thành công')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Cập nhật thất bại'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container-page section-pad">
      <p className="label-tech text-[var(--color-brand-strong)]">Tài khoản</p>
      <h1 className="mt-2 font-[var(--font-mono)] text-[clamp(22px,4vw,28px)] font-bold uppercase tracking-tight text-[var(--color-text)]">Hồ sơ cá nhân</h1>

      <div className="mt-6 grid gap-4 lg:grid-cols-[320px_1fr]">
        {/* Card thông tin */}
        <Card className="reveal h-fit">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-[var(--radius-sm)] bg-[var(--color-brand)] font-[var(--font-mono)] text-[15px] font-bold text-[var(--color-on-brand)]">
              {(user?.fullName || user?.username || 'U').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="text-[15px] font-semibold text-[var(--color-text)]">{user?.fullName}</p>
              <p className="text-[12px] text-[var(--color-text-dim)]">@{user?.username}</p>
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-2 text-[13px]">
            <div className="flex justify-between border-t border-[var(--color-line)] pt-2">
              <span className="text-[var(--color-text-dim)]">Email</span>
              <span className="text-[var(--color-text)]">{user?.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-text-dim)]">Vai trò</span>
              <span className="text-[var(--color-text)]">{user?.role}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-text-dim)]">Email xác thực</span>
              <span className={user?.isEmailVerified ? 'text-[var(--color-text)]' : 'text-[var(--color-brand-strong)]'}>
                {user?.isEmailVerified ? 'Đã xác thực' : 'Chưa xác thực'}
              </span>
            </div>
            {!user?.isEmailVerified && (
              <Link to="/verify-email" className="mt-1 text-[12px] font-semibold text-[var(--color-brand-strong)] hover:underline">
                Xác thực ngay →
              </Link>
            )}
          </div>
          <div className="mt-4 flex flex-col gap-2">
            <Button asChild variant="outline" className="w-full">
              <Link to="/me/change-password">Đổi mật khẩu</Link>
            </Button>
          </div>
        </Card>

        {/* Form cập nhật */}
        <Card className="reveal reveal-delay-2">
          <CardHeader>
            <CardTitle>Cập nhật hồ sơ</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="mt-4 flex flex-col gap-4">
              <Alert type="error">{error}</Alert>
              <Alert type="success">{msg}</Alert>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Họ tên">
                  <TextInput value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
                </Field>
                <Field label="Số điện thoại">
                  <TextInput value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </Field>
              </div>
              <Field label="Địa chỉ">
                <TextInput value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </Field>
              <Field label="Avatar URL">
                <TextInput value={form.avatarUrl} onChange={(e) => setForm({ ...form, avatarUrl: e.target.value })} placeholder="https://..." />
              </Field>
              <div className="max-w-[240px]">
                <PrimaryButton loading={loading}>Lưu thay đổi</PrimaryButton>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
