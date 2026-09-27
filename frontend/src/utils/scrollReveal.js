/**
 * Scroll reveal nhẹ, không phụ thuộc thư viện.
 *
 * Quan sát mọi phần tử có class `reveal` và thêm `is-visible`
 * khi chúng lọt vào viewport. Dùng MutationObserver để tự áp dụng cho các
 * phần tử được render muộn (điều hướng SPA, danh sách bất đồng bộ).
 *
 * Tự tắt (thêm `is-visible` ngay) khi người dùng bật "giảm chuyển động"
 * hoặc trình duyệt không hỗ trợ IntersectionObserver.
 */

const REVEAL_CLASS = 'reveal'
const VISIBLE_CLASS = 'is-visible'

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

function showAll(elements) {
  elements.forEach((el) => el.classList.add(VISIBLE_CLASS))
}

export function initScrollReveal() {
  if (typeof window === 'undefined') return
  if (!('IntersectionObserver' in window) || prefersReducedMotion()) {
    showAll(document.querySelectorAll(`.${REVEAL_CLASS}`))
    return
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        entry.target.classList.add(VISIBLE_CLASS)
        observer.unobserve(entry.target)
      })
    },
    { rootMargin: '0px 0px -10% 0px', threshold: 0.08 },
  )

  const observeWithin = (root) => {
    root.querySelectorAll?.(`.${REVEAL_CLASS}:not(.${VISIBLE_CLASS})`).forEach((el) => {
      observer.observe(el)
    })
  }

  observeWithin(document)

  // Phần tử mới xuất hiện sau khi điều hướng / fetch xong.
  const mutation = new MutationObserver((records) => {
    records.forEach((record) => {
      record.addedNodes.forEach((node) => {
        if (node.nodeType !== 1) return
        if (node.classList?.contains(REVEAL_CLASS)) observer.observe(node)
        observeWithin(node)
      })
    })
  })
  mutation.observe(document.body, { childList: true, subtree: true })
}
