import { beforeEach, describe, expect, it, vi } from 'vitest'

import { saveUserConsent } from '../../../src/lib/google/sheets'

const appendMock = vi.fn()

vi.mock('../../../src/lib/google/auth', () => ({
  getClients: () => ({
    sheets: {
      spreadsheets: {
        values: {
          append: appendMock,
          get: vi.fn(),
          update: vi.fn(),
        },
      },
    },
  }),
}))

describe('saveUserConsent timestamp', () => {
  beforeEach(() => {
    appendMock.mockReset()
    appendMock.mockResolvedValue({})
    vi.useRealTimers()
  })

  it('stores consent date in Europe/Warsaw timezone', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-02-01T10:00:00Z'))

    await saveUserConsent({
      phone: '+48 501 748 708',
      email: 'user@example.com',
      name: 'Sviatoslav Upirow',
      consentPrivacyV10: true,
      consentTermsV10: true,
      consentNotificationsV10: false,
      ip: '127.0.0.1',
    })

    expect(appendMock).toHaveBeenCalledTimes(1)
    const payload = appendMock.mock.calls[0][0]
    const row = payload.requestBody.values[0]

    expect(row[0]).toBe('48501748708')
    expect(row[3]).toMatch(/T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/)
    expect(new Date(row[3]).toISOString()).toBe('2024-02-01T10:00:00.000Z')

    vi.useRealTimers()
  })
})
