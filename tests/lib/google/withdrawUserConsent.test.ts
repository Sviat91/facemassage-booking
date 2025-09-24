import { beforeEach, describe, expect, it, vi } from 'vitest'

import { withdrawUserConsent } from '../../../src/lib/google/sheets'

const valuesGetMock = vi.fn()
const valuesUpdateMock = vi.fn()

function getMock() {
  return {
    sheets: {
      spreadsheets: {
        values: {
          get: valuesGetMock,
          update: valuesUpdateMock,
          append: vi.fn(),
        },
      },
    },
  }
}

vi.mock('../../../src/lib/google/auth', () => ({
  getClients: () => getMock(),
}))

describe('withdrawUserConsent', () => {
  const headerRow = [
    'phone',
    'email',
    'name',
    'consent_date',
    'ip_hash',
    'consent_privacy',
    'consent_terms',
    'consent_notifications',
    'withdrawn_date',
    'withdrawal_method',
  ]

  beforeEach(() => {
    valuesGetMock.mockReset()
    valuesUpdateMock.mockReset()
  })

  it('withdraws consent when phone matches regardless of plus signs', async () => {
    valuesGetMock.mockResolvedValue({
      data: {
        values: [
          headerRow,
          [
            '48501748708',
            'user@example.com',
            'Sviatoslav Upirow',
            '2024-09-01T10:00:00.000Z',
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
    valuesUpdateMock.mockResolvedValue({})

    const result = await withdrawUserConsent({
      phone: '+48 501 748 708',
      name: 'Sviatoslav Upirow',
      email: 'user@example.com',
      withdrawalMethod: 'support_form',
    })

    expect(result).toEqual({ updated: true })
    expect(valuesUpdateMock).toHaveBeenCalledTimes(1)
    const updatePayload = valuesUpdateMock.mock.calls[0][0]
    expect(updatePayload.range).toBe('A2:J2')
    const updatedRow = updatePayload.requestBody.values[0]
    expect(updatedRow[0]).toBe('48501748708')
    expect(updatedRow[1]).toBe('user@example.com')
    expect(updatedRow[2]).toBe('Sviatoslav Upirow')
    expect(updatedRow[5]).toBe('FALSE')
    expect(updatedRow[6]).toBe('FALSE')
    expect(updatedRow[7]).toBe('FALSE')
    expect(new Date(updatedRow[8]).toString()).not.toBe('Invalid Date')
    expect(updatedRow[9]).toBe('support_form')
    expect(updatedRow[8]).toMatch(/T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/)
  })

  it('does not withdraw consent when email does not match', async () => {
    valuesGetMock.mockResolvedValue({
      data: {
        values: [
          headerRow,
          [
            '48501748708',
            'stored@example.com',
            'Sviatoslav Upirow',
            '2024-09-01T10:00:00.000Z',
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

    const result = await withdrawUserConsent({
      phone: '+48 501 748 708',
      name: 'Sviatoslav Upirow',
      email: 'other@example.com',
      withdrawalMethod: 'support_form',
    })

    expect(result).toEqual({ updated: false, reason: 'NOT_FOUND' })
    expect(valuesUpdateMock).not.toHaveBeenCalled()
  })

  it('returns NOT_FOUND when phone is absent in sheet', async () => {
    valuesGetMock.mockResolvedValue({
      data: {
        values: [
          headerRow,
          [
            '48123123123',
            'user@example.com',
            'Anna Kowalska',
            '2024-09-01T10:00:00.000Z',
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

    const result = await withdrawUserConsent({
      phone: '+48 501 748 708',
      name: 'Sviatoslav Upirow',
      withdrawalMethod: 'support_form',
    })

    expect(result).toEqual({ updated: false, reason: 'NOT_FOUND' })
    expect(valuesUpdateMock).not.toHaveBeenCalled()
  })

  it('withdraws the most recent active consent when multiple matches exist', async () => {
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
            '2024-05-01T10:00:00.000Z',
            '127.0.0.xxx',
            'TRUE',
            'TRUE',
            'TRUE',
            '',
            '',
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
    valuesUpdateMock.mockResolvedValue({})

    const result = await withdrawUserConsent({
      phone: '+48 501 748 708',
      name: 'Sviatoslav Upirow',
      email: 'user@example.com',
      withdrawalMethod: 'support_form',
    })

    expect(result).toEqual({ updated: true })
    expect(valuesUpdateMock).toHaveBeenCalledTimes(1)
    const updatePayload = valuesUpdateMock.mock.calls[0][0]
    expect(updatePayload.range).toBe('A4:J4')
    const updatedRow = updatePayload.requestBody.values[0]
    expect(updatedRow[5]).toBe('FALSE')
    expect(updatedRow[6]).toBe('FALSE')
    expect(updatedRow[7]).toBe('FALSE')
    expect(updatedRow[8]).toMatch(/T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/)
  })

  it('handles consent rows with apostrophe-prefixed timestamps', async () => {
    valuesGetMock.mockResolvedValue({
      data: {
        values: [
          headerRow,
          [
            '48501748708',
            'user@example.com',
            'Sviatoslav Upirow',
            "'2024-05-01T10:00:00Z",
            '127.0.0.xxx',
            'TRUE',
            'TRUE',
            'TRUE',
            '',
            '',
          ],
          [
            '48501748708',
            'user@example.com',
            'Sviatoslav Upirow',
            "'2024-08-01T10:00:00Z",
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
    valuesUpdateMock.mockResolvedValue({})

    const result = await withdrawUserConsent({
      phone: '+48 501 748 708',
      name: 'Sviatoslav Upirow',
      email: 'user@example.com',
      withdrawalMethod: 'support_form',
    })

    expect(result).toEqual({ updated: true })
    const updatePayload = valuesUpdateMock.mock.calls[0][0]
    expect(updatePayload.range).toBe('A3:J3')
  })
})
