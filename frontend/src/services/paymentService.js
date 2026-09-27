import api from './api'

// Backend: /api/payments/{id}/mock-pay, /api/payments/my
export const paymentService = {
  async getMy({ page = 1, pageSize = 20 } = {}) {
    const { data } = await api.get('/payments/my', { params: { page, pageSize } })
    return data
  },
  async mockPay(auctionWinnerId, paymentMethod) {
    const { data } = await api.post(`/payments/${auctionWinnerId}/mock-pay`, { paymentMethod })
    return data
  },
}

export const PAYMENT_METHODS = ['VNPay', 'Momo', 'COD', 'BankTransfer']
