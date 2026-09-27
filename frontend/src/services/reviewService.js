import api from './api'

// Backend: POST /api/reviews, GET /api/reviews/product/{productId}
export const reviewService = {
  async create({ productId, rating, comment }) {
    const { data } = await api.post('/reviews', { productId, rating, comment })
    return data
  },
  async getByProduct(productId, { page = 1, pageSize = 20 } = {}) {
    const { data } = await api.get(`/reviews/product/${productId}`, { params: { page, pageSize } })
    return data
  },
}
