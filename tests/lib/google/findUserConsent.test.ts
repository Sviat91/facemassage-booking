import { beforeEach, describe, expect, it, vi } from 'vitest'

import { findUserConsent, hasValidConsent } from '../../../src/lib/google/sheets'

const valuesGetMock = vi.fn()

function buildMockClients() {
  return {
    sheets: {
      spreadsheets: {
        values: {
          get: valuesGetMock,
          update: vi.fn(),
          append: vi.fn(),
        },
      },
    },
  }
}

vi.mock('../../../src/lib/google/auth', () => ({
  getClients: () => buildMockClients(),
}))

describe('findUserConsent / hasValidConsent with history', () => {
  const headerRow = [
    'phone',
    'email',
    'name',
    'consent_date',
    'ip_hash',
    'consent_privacy_v1.0',
    'consent_terms_v1.0',
    'consent_notifications_v1.0',
    'withdrawn_date',
    'withdrawal_method',
  ]

  beforeEach(() => {
    valuesGetMock.mockReset()
  })

  it('returns the most recent active consent when multiple entries exist', async () => {
    valuesGetMock.mockResolvedValue({
      data: {
        values: [
          headerRow,
          [
            '48501748708',
            'user@example.com',
            'Sviatoslav Upirow',
            '2024-01-01T10:00:00.000Z',
            '127.0.0.xxx',
            'FALSE',
            'FALSE',
            'FALSE',
            '2024-02-01T10:00:00.000Z',
            'support_form',
          ],
          [
            '48501748708',
            'user@example.com',
            'Sviatoslav Upirow',
            '2024-06-01T10:00:00.000Z',
            '127.0.0.xxx',
            'TRUE',
            'TRUE',
            'TRUE',
            '',
            '',
          ],
        ],
      },
    })

    const consent = await findUserConsent('+48 501 748 708', 'Sviatoslav Upirow', 'user@example.com')
    expect(consent).not.toBeNull()
    expect(consent?.consentDate).toBe('2024-06-01T10:00:00.000Z')
    expect(consent?.consentWithdrawnDate).toBeUndefined()

    const valid = await hasValidConsent('+48 501 748 708', 'Sviatoslav Upirow', 'user@example.com')
    expect(valid).toBe(true)
  })

  it('returns last withdrawn consent when no active entries remain and reports invalid', async () => {
    valuesGetMock.mockResolvedValue({
      data: {
        values: [
          headerRow,
          [
            '48501748708',
            'user@example.com',
            'Sviatoslav Upirow',
            '2024-06-01T10:00:00.000Z',
            '127.0.0.xxx',
            'FALSE',
            'FALSE',
            'FALSE',
            '2024-07-01T10:00:00.000Z',
            'support_form',
          ],
        ],
      },
    })

    const consent = await findUserConsent('+48 501 748 708', 'Sviatoslav Upirow', 'user@example.com')
    expect(consent).not.toBeNull()
    expect(consent?.consentWithdrawnDate).toBe('2024-07-01T10:00:00.000Z')

    const valid = await hasValidConsent('+48 501 748 708', 'Sviatoslav Upirow', 'user@example.com')
    expect(valid).toBe(false)
  })
})
