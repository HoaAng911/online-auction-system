import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Alert, Field, PrimaryButton, TextInput } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { getApiErrorMessage } from '../services/api'
import { userService } from '../services/userService'

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
    <div className="mx-auto max-w-[1280px] px-4 py-10 lg:px-6">
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#0a66ff]">Tài khoản</p>
      <h1 className="mt-2 text-[28px] font-bold text-white">Hồ sơ cá nhân</h1>

      <div className="mt-6 grid gap-4 lg:grid-cols-[320px_1fr]">
        {/* Card thông tin */}
        <div className="h-fit border border-[#1e1e22] bg-[#0b0b0c] p-5">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-[#1e3a8a] text-[15px] font-bold text-white">
              {(user?.fullName || user?.username || 'U').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="text-[15px] font-semibold text-white">{user?.fullName}</p>
              <p className="text-[12px] text-zinc-500">@{user?.username}</p>
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-2 text-[13px]">
            <div className="flex justify-between border-t border-[#1e1e22] pt-2">
              <span className="text-zinc-500">Email</span>
              <span className="text-white">{user?.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Vai trò</span>
              <span className="text-white">{user?.role}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Email xác thực</span>
              <span className={user?.isEmailVerified ? 'text-emerald-400' : 'text-amber-400'}>
                {user?.isEmailVerified ? 'Đã xác thực' : 'Chưa xác thực'}
              </span>
            </div>
            {!user?.isEmailVerified && (
              <Link to="/verify-email" className="mt-1 text-[12px] font-semibold text-[#0a66ff] hover:underline">
                Xác thực ngay →
              </Link>
            )}
          </div>
          <div className="mt-4 flex flex-col gap-2">
            <Link to="/me/change-password" className="border border-[#2a2a2e] px-3 py-2 text-center text-[13px] font-semibold text-white hover:border-zinc-500">
              Đổi mật khẩu
            </Link>
          </div>
        </div>

        {/* Form cập nhật */}
        <div className="border border-[#1e1e22] bg-[#0b0b0c] p-5 sm:p-6">
          <h2 className="text-[16px] font-semibold text-white">Cập nhật hồ sơ</h2>
          <form onSubmit={submit} className="mt-4 flex flex-col gap-4">
            <Alert>{error}</Alert>
            {msg && <Alert type="success">{msg}</Alert>}
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
        </div>
      </div>
    </div>
  )
}
