export const normalizePricePln = (price?: number | string): string => {
  if (typeof price === 'number') {
    return Number.isFinite(price) ? String(price) : '0'
  }

  if (typeof price === 'string') {
    const trimmed = price.trim()
    if (!trimmed) return '0'

    // Preserve ranges like "200-300" or "200 – 300" while normalizing dash/spacing
    if (trimmed.includes('-') || /\u2013/.test(trimmed)) {
      return trimmed.replace(/\u2013/g, '-').replace(/\s+/g, '') || '0'
    }

    const numeric = Number.parseInt(trimmed.replace(/[^\d]/g, ''), 10)
    return Number.isFinite(numeric) && numeric > 0 ? String(numeric) : '0'
  }

  return '0'
}
