import { useCallback, useEffect, useState } from 'react'
import { Alert, Card, Eyebrow, Field, TextInput } from '../components/ui'
import { getApiErrorMessage } from '../services/api'
import { settingService } from '../services/settingService'
import { Button } from '../components/ui/button'

export default function AdminSettings() {
  const [settings, setSettings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(null) // key đang sửa
  const [editValue, setEditValue] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  // Form thêm mới
  const [newKey, setNewKey] = useState('')
  const [newValue, setNewValue] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [creating, setCreating] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await settingService.getAll()
      setSettings(res.data || [])
    } catch (err) {
      setError(getApiErrorMessage(err, 'Tải cấu hình thất bại'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const startEdit = (s) => {
    setEditing(s.key)
    setEditValue(s.value)
    setEditDesc(s.description || '')
    setMsg('')
  }

  const saveEdit = async (key) => {
    setSaving(true)
    setError('')
    setMsg('')
    try {
      await settingService.updateByKey(key, { value: editValue, description: editDesc || undefined })
      setMsg(`Đã cập nhật "${key}"`)
      setEditing(null)
      await load()
    } catch (err) {
      setError(getApiErrorMessage(err, 'Cập nhật thất bại'))
    } finally {
      setSaving(false)
    }
  }

  const createNew = async (e) => {
    e.preventDefault()
    setError('')
    setMsg('')
    if (!newKey.trim() || !newValue.trim()) {
      setError('Key và Value là bắt buộc')
      return
    }
    setCreating(true)
    try {
      const res = await settingService.upsert({ key: newKey.trim(), value: newValue.trim(), description: newDesc.trim() || undefined })
      setMsg(res.message || `Đã lưu "${newKey.trim()}"`)
      setNewKey('')
      setNewValue('')
      setNewDesc('')
      await load()
    } catch (err) {
      setError(getApiErrorMessage(err, 'Lưu cấu hình thất bại'))
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="container-page section-pad">
      <Eyebrow>Quản trị</Eyebrow>
      <h1 className="display-tight font-display mt-2 text-[clamp(24px,4vw,34px)] font-semibold text-[var(--color-text)]">
        Cấu hình hệ thống
      </h1>
      <p className="mt-2 text-[13px] text-[var(--color-text-muted)]">
        Quản lý các tham số như tỉ lệ hoa hồng, giá khởi điểm tối thiểu.
      </p>

      <div className="mt-4">
        <Alert type="error">{error}</Alert>
        <Alert type="success">{msg}</Alert>
      </div>

      {/* Thêm mới / upsert */}
      <Card className="mt-4 p-5 sm:p-6">
        <h2 className="text-[15px] font-semibold text-[var(--color-text)]">Thêm mới hoặc cập nhật</h2>
        <form onSubmit={createNew} className="mt-4 grid gap-3 sm:grid-cols-[220px_1fr_1fr_auto]">
          <Field label="Key">
            <TextInput value={newKey} onChange={(e) => setNewKey(e.target.value)} placeholder="CommissionRate" maxLength={100} />
          </Field>
          <Field label="Value">
            <TextInput value={newValue} onChange={(e) => setNewValue(e.target.value)} placeholder="5" />
          </Field>
          <Field label="Mô tả (tùy chọn)">
            <TextInput value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Tỉ lệ hoa hồng (%)" maxLength={255} />
          </Field>
          <div className="flex items-end">
            <Button type="submit" disabled={creating} className="whitespace-nowrap">
              {creating ? 'Đang lưu…' : 'Lưu'}
            </Button>
          </div>
        </form>
      </Card>

      {/* Danh sách */}
      <div className="mt-4 overflow-x-auto rounded-[var(--radius)] border border-[var(--color-line)]">
        <table className="w-full min-w-[680px] bg-[var(--color-surface)] text-left text-[13px]">
          <thead>
            <tr className="border-b border-[var(--color-line)] text-[11px] uppercase tracking-wider text-[var(--color-text-dim)]">
              <th className="px-4 py-3">Key</th>
              <th className="px-4 py-3">Value</th>
              <th className="px-4 py-3">Mô tả</th>
              <th className="px-4 py-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-[var(--color-text-dim)]">Đang tải...</td></tr>
            ) : settings.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-[var(--color-text-dim)]">Chưa có cấu hình nào</td></tr>
            ) : (
              settings.map((s) => (
                <tr key={s.key} className="border-b border-[var(--color-line)] align-top last:border-0 hover:bg-[var(--color-surface-2)]">
                  <td className="px-4 py-3 font-[var(--font-mono)] text-[12px] font-semibold text-[var(--color-brand)]">{s.key}</td>
                  <td className="px-4 py-3">
                    {editing === s.key ? (
                      <TextInput value={editValue} onChange={(e) => setEditValue(e.target.value)} />
                    ) : (
                      <span className="font-[var(--font-mono)] text-[12px] text-[var(--color-text)]">{s.value}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-text-muted)]">
                    {editing === s.key ? (
                      <TextInput value={editDesc} onChange={(e) => setEditDesc(e.target.value)} placeholder="Mô tả…" />
                    ) : (
                      s.description || '—'
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {editing === s.key ? (
                      <div className="inline-flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setEditing(null)}>Hủy</Button>
                        <Button size="sm" onClick={() => saveEdit(s.key)} disabled={saving}>
                          {saving ? '…' : 'Lưu'}
                        </Button>
                      </div>
                    ) : (
                      <Button variant="ghost" size="sm" onClick={() => startEdit(s)}>Sửa</Button>
                    )}
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
