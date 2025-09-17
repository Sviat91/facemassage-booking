/// <reference types='vitest' />

import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Mock } from 'vitest'

vi.mock('../../src/lib/google/calendar', () => ({
  freeBusy: vi.fn(),
  createEvent: vi.fn(),
}))

vi.mock('../../src/lib/google/sheets', () => ({
  readProcedures: vi.fn(),
}))

vi.mock('../../src/lib/cache', () => ({
  cacheSetNX: vi.fn(),
  cacheDel: vi.fn(),
  cacheGet: vi.fn(),
  cacheSet: vi.fn(),
  rateLimit: vi.fn(),
}))

vi.mock('../../src/lib/turnstile', () => ({
  verifyTurnstile: vi.fn(),
}))

vi.mock('../../src/lib/availability', () => ({
  getAvailableDays: vi.fn(),
  getDaySlots: vi.fn(),
}))

vi.mock('../../src/lib/sentry', () => ({
  reportError: vi.fn().mockResolvedValue(undefined),
}))

beforeEach(() => {
  vi.resetModules()
  vi.clearAllMocks()
})

describe('API smoke checks', () => {
  it('POST /api/book returns success for valid payload', async () => {
    const calendar = await import('../../src/lib/google/calendar')
    ;(calendar.freeBusy as unknown as Mock).mockResolvedValue([])
    ;(calendar.createEvent as unknown as Mock).mockResolvedValue({ id: 'evt-123' })

    const sheets = await import('../../src/lib/google/sheets')
    ;(sheets.readProcedures as unknown as Mock).mockResolvedValue([
      { id: 'proc-1', name_pl: 'Massage', duration_min: 60, is_active: true },
    ])

    const cache = await import('../../src/lib/cache')
    ;(cache.rateLimit as unknown as Mock).mockResolvedValue({ allowed: true })
    ;(cache.cacheSetNX as unknown as Mock).mockResolvedValue(true)

    const turnstile = await import('../../src/lib/turnstile')
    ;(turnstile.verifyTurnstile as unknown as Mock).mockResolvedValue({ ok: true })

    const { POST } = await import('../../src/app/api/book/route')

    const headers = new Headers({ 'x-forwarded-for': '127.0.0.1' })
    const req = {
      json: () =>
        Promise.resolve({
          startISO: '2025-09-18T10:00:00+02:00',
          endISO: '2025-09-18T11:00:00+02:00',
          name: 'Client',
          phone: '+48123456789',
          email: 'client@example.com',
        }),
      headers,
    }

    const res = await POST(req as any)
    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({ ok: true, eventId: 'evt-123' })
  })

  it('POST /api/book blocks duplicate submissions via idempotency key', async () => {
    const calendar = await import('../../src/lib/google/calendar')
    ;(calendar.freeBusy as unknown as Mock).mockResolvedValue([])

    const cache = await import('../../src/lib/cache')
    ;(cache.rateLimit as unknown as Mock).mockResolvedValue({ allowed: true })
    ;(cache.cacheSetNX as unknown as Mock).mockResolvedValue(false)

    const { POST } = await import('../../src/app/api/book/route')

    const headers = new Headers({ 'x-forwarded-for': '10.0.0.5' })
    const req = {
      json: () =>
        Promise.resolve({
          startISO: '2025-09-18T10:00:00+02:00',
          endISO: '2025-09-18T11:00:00+02:00',
          name: 'Dup',
          phone: '+48111111111',
        }),
      headers,
    }

    const res = await POST(req as any)
    expect(res.status).toBe(409)
    await expect(res.json()).resolves.toMatchObject({ code: 'DUPLICATE' })
  })

  it('GET /api/availability returns 400 when dates are missing', async () => {
    const { GET } = await import('../../src/app/api/availability/route')
    const req = { url: 'https://example.com/api/availability' }

    const res = await GET(req as any)
    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toMatchObject({ error: 'from/until required' })
  })

  it('GET /api/procedures surfaces server errors and reports them', async () => {
    const sheets = await import('../../src/lib/google/sheets')
    ;(sheets.readProcedures as unknown as Mock).mockRejectedValue(new Error('sheets unavailable'))

    const sentry = await import('../../src/lib/sentry')
    const reportError = sentry.reportError as unknown as Mock

    const { GET } = await import('../../src/app/api/procedures/route')

    const res = await GET()
    expect(res.status).toBe(500)
    await expect(res.json()).resolves.toMatchObject({ error: 'Failed to fetch procedures' })
    expect(reportError).toHaveBeenCalledTimes(1)
  })
})


