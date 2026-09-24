/* ============================================================
   Mock adapter — giả lập backend khi VITE_USE_MOCK=true.
   Không gọi mạng, trả về đúng shape ApiResponse của backend:
   { success, message, data, errors }
   ============================================================ */
import usersData from './users.json'
import auctionsData from './auctions.json'

// Bản sao có thể chỉnh sửa khi chạy (đăng ký, đổi trạng thái...)
let users = structuredClone(usersData.users)
const auctions = structuredClone(auctionsData.auctions)
const categories = structuredClone(auctionsData.categories)

/* ---------- Tiện ích ---------- */
const ok = (data, message = '') => ({ success: true, message, data, errors: null })
const fail = (message, errors = []) => ({
  success: false,
  message,
  data: null,
  errors: Array.isArray(errors) ? errors : [errors],
})

const uuid = () =>
  (crypto.randomUUID && crypto.randomUUID()) ||
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })

// Giả lập độ trễ mạng
const wait = (ms = 300) => new Promise((r) => setTimeout(r, ms))

// Bỏ token khỏi object user trước khi trả về client
function publicUser(u) {
  if (!u) return null
  const { password, ...rest } = u
  return rest
}

function findUserById(id) {
  return users.find((u) => u.id === id) || null
}

/* ---------- Route handlers ---------- */

// POST /auth/login
function login(body) {
  const { email, password } = body || {}
  if (!email || !password) return fail('Vui lòng nhập email và mật khẩu.')
  const user = users.find((u) => u.email.toLowerCase() === String(email).toLowerCase())
  if (!user || password !== usersData.defaultPassword) {
    return fail('Email hoặc mật khẩu không đúng.')
  }
  if (user.isActive === false) {
    return fail('Tài khoản đã bị khoá. Vui lòng liên hệ quản trị viên.')
  }
  return ok(
    {
      accessToken: `mock.access.${user.id}`,
      refreshToken: `mock.refresh.${user.id}`,
      user: publicUser(user),
    },
    'Đăng nhập thành công.',
  )
}

// POST /auth/register
function register(body) {
  const { username, email, password, fullName } = body || {}
  if (!username || !email || !password) return fail('Thiếu thông tin bắt buộc.')
  if (users.some((u) => u.email.toLowerCase() === String(email).toLowerCase())) {
    return fail('Email đã được sử dụng.')
  }
  if (users.some((u) => u.username.toLowerCase() === String(username).toLowerCase())) {
    return fail('Tên đăng nhập đã tồn tại.')
  }
  const user = {
    id: uuid(),
    username,
    email,
    fullName: fullName || username,
    phone: null,
    address: null,
    role: 'User',
    isActive: true,
    isEmailVerified: false,
    avatarUrl: `https://i.pravatar.cc/160?u=${encodeURIComponent(email)}`,
    createdAt: new Date().toISOString(),
  }
  users.push(user)
  return ok(
    {
      accessToken: `mock.access.${user.id}`,
      refreshToken: `mock.refresh.${user.id}`,
      user: publicUser(user),
    },
    'Đăng ký thành công. Vui lòng kiểm tra email để xác thực.',
  )
}

// POST /auth/logout, /auth/forgot-password, /auth/reset-password, /auth/verify-email...
function authGeneric(urlKey, body) {
  switch (urlKey) {
    case 'logout':
      return ok(null, 'Đã đăng xuất.')
    case 'refresh-token':
      return ok({ accessToken: `mock.access.${uuid()}`, refreshToken: `mock.refresh.${uuid()}` })
    case 'forgot-password':
      return ok(null, 'Nếu email tồn tại, liên kết đặt lại mật khẩu đã được gửi.')
    case 'reset-password':
      return ok(null, 'Đặt lại mật khẩu thành công.')
    case 'verify-email':
      return ok(null, 'Xác thực email thành công.')
    case 'change-password':
      return ok(null, 'Đổi mật khẩu thành công.')
    default:
      return ok(null)
  }
}

// GET /users/me
function getMe(config) {
  const token = config?.headers?.Authorization?.replace('Bearer ', '') || ''
  const id = token.startsWith('mock.access.') ? token.slice('mock.access.'.length) : null
  const user = findUserById(id)
  if (!user) return fail('Chưa đăng nhập.')
  return ok(publicUser(user))
}

// GET /users
function listUsers() {
  return ok(users.map(publicUser))
}

// PUT /users/{id}/status  body { isActive }
function setUserStatus(id, body) {
  const user = findUserById(id)
  if (!user) return fail('Không tìm thấy người dùng.')
  user.isActive = !!body?.isActive
  return ok(publicUser(user), 'Cập nhật trạng thái thành công.')
}

// GET /auctions
function listAuctions(config) {
  const params = config?.params || {}
  let list = [...auctions]
  if (params.categoryId) list = list.filter((a) => a.categoryId === params.categoryId)
  if (params.q) {
    const q = String(params.q).toLowerCase()
    list = list.filter((a) => a.title.toLowerCase().includes(q))
  }
  if (params.status) list = list.filter((a) => a.status === params.status)
  // Sắp xếp: mới tạo trước
  list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  return ok({ items: list, total: list.length })
}

// GET /auctions/{id}
function getAuction(id) {
  const auction = auctions.find((a) => a.id === id || a.slug === id)
  return auction ? ok(auction) : fail('Không tìm thấy phiên đấu giá.')
}

// GET /categories
function listCategories() {
  return ok(categories)
}

/* ---------- Bộ định tuyến mock ---------- */
const delayRandom = () => wait(150 + Math.floor(Math.random() * 250))

export async function handleMockRequest(config) {
  await delayRandom()
  const method = (config.method || 'get').toLowerCase()
  const url = (config.url || '').replace(/^\/+/, '').replace(/\?.*$/, '')
  const body =
    typeof config.data === 'string' ? safeParse(config.data) : config.data || {}

  // /auth/*
  if (url.startsWith('auth/')) {
    const key = url.replace('auth/', '')
    if (method === 'post' && key === 'login') return login(body)
    if (method === 'post' && key === 'register') return register(body)
    return authGeneric(key, body)
  }

  // /users/*
  if (url === 'users/me') return getMe(config)
  if (url === 'users') return listUsers()
  const statusMatch = url.match(/^users\/([^/]+)\/status$/)
  if (statusMatch) return setUserStatus(statusMatch[1], body)

  // /auctions/*
  if (url === 'auctions') return listAuctions(config)
  const auctionMatch = url.match(/^auctions\/([^/]+)$/)
  if (auctionMatch) return getAuction(auctionMatch[1])

  // /categories
  if (url === 'categories') return listCategories()

  return fail(`Mock chưa hỗ trợ: ${method.toUpperCase()} /${url}`)
}

function safeParse(str) {
  try {
    return JSON.parse(str)
  } catch {
    return {}
  }
}
