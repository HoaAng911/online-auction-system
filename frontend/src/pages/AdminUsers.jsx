import { useCallback, useEffect, useState } from 'react'
import { Alert, TextInput } from '../components/ui'
import { getApiErrorMessage } from '../services/api'
import { userService } from '../services/userService'

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await userService.getAll({ search, page: 1, pageSize: 20 })
      setUsers(res.data || [])
    } catch (err) {
      setError(getApiErrorMessage(err, 'Tải danh sách thất bại'))
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    const t = setTimeout(load, 400)
    return () => clearTimeout(t)
  }, [load])

  const toggleStatus = async (u) => {
    setActing(u.id)
    try {
      await userService.updateStatus(u.id, !u.isActive)
      await load()
    } catch (err) {
      setError(getApiErrorMessage(err, 'Cập nhật trạng thái thất bại'))
    } finally {
      setActing('')
    }
  }

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-10 lg:px-6">
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--color-accent)]">Quản trị</p>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[28px] font-bold text-[var(--color-text)]">Người dùng</h1>
        <div className="w-full max-w-[320px]">
          <TextInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm theo tên, email..." />
        </div>
      </div>

      <div className="mt-4">
        <Alert>{error}</Alert>
      </div>

      <div className="mt-4 overflow-x-auto rounded-[var(--radius)] border border-[var(--color-line)]">
        <table className="w-full min-w-[720px] bg-[var(--color-surface)] text-left text-[13px]">
          <thead>
            <tr className="border-b border-[var(--color-line)] text-[11px] uppercase tracking-wider text-[var(--color-text-dim)]">
              <th className="px-4 py-3">Người dùng</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Vai trò</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-[var(--color-text-dim)]">Đang tải...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-[var(--color-text-dim)]">Không có dữ liệu</td></tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="border-b border-[var(--color-line)] last:border-0 hover:bg-[var(--color-surface-2)]">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-[var(--color-text)]">{u.fullName}</p>
                    <p className="text-[12px] text-[var(--color-text-dim)]">@{u.username}</p>
                  </td>
                  <td className="px-4 py-3 text-[var(--color-text-muted)]">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-[var(--radius-sm)] border border-[var(--color-line-strong)] px-2 py-0.5 text-[12px] text-[var(--color-text-muted)]">{u.role}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={u.isActive ? 'text-emerald-400' : 'text-red-400'}>
                      {u.isActive ? 'Hoạt động' : 'Đã khóa'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => toggleStatus(u)}
                      disabled={acting === u.id}
                      className="rounded-[var(--radius-sm)] border border-[var(--color-line-strong)] px-3 py-1.5 text-[12px] font-semibold text-[var(--color-text)] hover:border-[var(--color-text-dim)] disabled:opacity-50"
                    >
                      {acting === u.id ? '...' : u.isActive ? 'Khóa' : 'Mở khóa'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
