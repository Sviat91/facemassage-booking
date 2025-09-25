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

  it('withdraws consent when user has single active record among multiple entries', async () => {
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
            'FALSE', // Эта запись УЖЕ отозвана
            'FALSE',
            'FALSE',
            '2024-05-15T10:00:00.000Z', // есть дата отзыва
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

  it('withdraws consent even if header columns are rearranged', async () => {
    valuesGetMock.mockResolvedValue({
      data: {
        values: [
          [
            'consent_date',
            'Name',
            'Phone',
            'email',
            'ip_hash',
            'consent_notifications_v1_0',
            'consent_terms_v1.0',
            'consent_privacy_v1.0',
            'withdrawal_method',
            'consent_withdrawn_date',
          ],
          [
            '2024-06-01T10:00:00.000Z',
            'Sviatoslav Upirow',
            '48501748708',
            'user@example.com',
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
    expect(updatedRow[2]).toBe('48501748708')
    expect(updatedRow[5]).toBe('FALSE')
    expect(updatedRow[6]).toBe('FALSE')
    expect(updatedRow[7]).toBe('FALSE')
    expect(updatedRow[8]).toBe('support_form')
    expect(new Date(updatedRow[9]).toString()).not.toBe('Invalid Date')
  })

  it('handles sheets without notifications column gracefully', async () => {
    valuesGetMock.mockResolvedValue({
      data: {
        values: [
          [
            'Phone',
            'Name',
            'email',
            'consent_date',
            'ip_hash',
            'consent_privacy_v1.0',
            'consent_terms_v1.0',
            'consent_withdrawn_date',
            'withdrawal_method',
          ],
          [
            '48501748708',
            'Sviatoslav Upirow',
            'user@example.com',
            '2024-06-01T10:00:00.000Z',
            '127.0.0.xxx',
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
    expect(updatePayload.range).toBe('A2:I2')
    const updatedRow = updatePayload.requestBody.values[0]
    expect(updatedRow[5]).toBe('FALSE')
    expect(updatedRow[6]).toBe('FALSE')
    expect(new Date(updatedRow[7]).toString()).not.toBe('Invalid Date')
  })

  it('handles consent rows with apostrophe-prefixed timestamps and short timezone offsets', async () => {
    valuesGetMock.mockResolvedValue({
      data: {
        values: [
          headerRow,
          [
            '48501748708',
            'user@example.com',
            'Sviatoslav Upirow',
            "'2024-05-01T10:00:00+02",
            '127.0.0.xxx',
            'FALSE', // Эта запись УЖЕ отозвана
            'FALSE',
            'FALSE',
            '2024-05-15T10:00:00+02:00', // есть дата отзыва
            'support_form',
          ],
          [
            '48501748708',
            'user@example.com',
            'Sviatoslav Upirow',
            "'2024-08-01T10:00:00+0200",
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

  it('correctly handles multiple consent/withdrawal cycles and withdraws most recent active consent', async () => {
    // Сценарий: пользователь дал согласие → отозвал → снова дал → хочет снова отозвать
    valuesGetMock.mockResolvedValue({
      data: {
        values: [
          headerRow,
          [
            '48501748708',
            'user@example.com',
            'Sviatoslav Upirow',
            '2024-01-01T10:00:00.000Z', // первое согласие
            '127.0.0.xxx',
            'FALSE', // отозвано
            'FALSE',
            'FALSE',
            '2024-02-01T10:00:00.000Z', // дата отзыва
            'support_form',
          ],
          [
            '48501748708',
            'user@example.com',
            'Sviatoslav Upirow',
            '2024-03-01T10:00:00.000Z', // второе согласие (более свежее)
            '127.0.0.xxx',
            'TRUE', // активное
            'TRUE',
            'TRUE',
            '', // не отозвано
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

    // Должно успешно отозвать самое свежее согласие
    expect(result).toEqual({ updated: true })
    expect(valuesUpdateMock).toHaveBeenCalledTimes(1)
    
    // Проверяем что обновляется правильная строка (вторая запись - строка 3)
    const updatePayload = valuesUpdateMock.mock.calls[0][0]
    expect(updatePayload.range).toBe('A3:J3')
    
    const updatedRow = updatePayload.requestBody.values[0]
    expect(updatedRow[5]).toBe('FALSE') // privacy
    expect(updatedRow[6]).toBe('FALSE') // terms
    expect(updatedRow[7]).toBe('FALSE') // notifications
    expect(updatedRow[8]).toMatch(/T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/) // withdrawal date
    expect(updatedRow[9]).toBe('support_form') // withdrawal method
  })

  it('returns NOT_FOUND when most recent consent is already withdrawn', async () => {
    // Сценарий: все согласия уже отозваны
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
            'FALSE', // отозвано
            'FALSE',
            'FALSE',
            '2024-02-01T10:00:00.000Z', // есть дата отзыва - значит отозвано
            'support_form',
          ],
          [
            '48501748708',
            'user@example.com',
            'Sviatoslav Upirow',
            '2024-03-01T10:00:00.000Z', // более свежая запись
            '127.0.0.xxx',
            'FALSE', // тоже отозвано  
            'FALSE',
            'FALSE',
            '2024-04-01T10:00:00.000Z', // есть дата отзыва - значит отозвано
            'support_form',
          ],
        ],
      },
    })

    const result = await withdrawUserConsent({
      phone: '+48 501 748 708',
      name: 'Sviatoslav Upirow',
      email: 'user@example.com',
      withdrawalMethod: 'support_form',
    })

    // Должно вернуть NOT_FOUND так как самое свежее согласие уже отозвано
    expect(result).toEqual({ updated: false, reason: 'NOT_FOUND' })
    expect(valuesUpdateMock).not.toHaveBeenCalled()
  })

  it('withdraws active consent even when user has history of withdrawals', async () => {
    // Реальный сценарий: пользователь отозвал → снова дал согласие → хочет отозвать
    valuesGetMock.mockResolvedValue({
      data: {
        values: [
          headerRow,
          [
            '48501748708',
            'sviatoslav@gmail.com',
            'Sviatoslav Upirow',
            '2024-01-01T10:00:00.000Z',
            '127.0.0.xxx',
            'FALSE', // старое согласие отозвано
            'FALSE',
            'FALSE',
            '2024-02-01T10:00:00.000Z', // есть дата отзыва
            'support_form',
          ],
          [
            '48501748708',
            'sviatoslav@gmail.com',
            'Sviatoslav Upirow',
            '2024-09-24T14:00:00.000Z', // новое согласие
            '127.0.0.xxx',
            'TRUE', // активное согласие
            'TRUE',
            'TRUE',
            '', // НЕТ даты отзыва - значит активно
            '',
          ],
        ],
      },
    })
    valuesUpdateMock.mockResolvedValue({})

    const result = await withdrawUserConsent({
      phone: '+48 501 748 708',
      name: 'Sviatoslav Upirow',
      email: 'sviatoslav@gmail.com',
      withdrawalMethod: 'support_form',
    })

    // Должно успешно отозвать новое активное согласие
    expect(result).toEqual({ updated: true })
    expect(valuesUpdateMock).toHaveBeenCalledTimes(1)
    
    // Проверяем что обновляется правильная строка (новая запись - строка 3)
    const updatePayload = valuesUpdateMock.mock.calls[0][0]
    expect(updatePayload.range).toBe('A3:J3')
    
    const updatedRow = updatePayload.requestBody.values[0]
    expect(updatedRow[0]).toBe('48501748708') // phone
    expect(updatedRow[1]).toBe('sviatoslav@gmail.com') // email
    expect(updatedRow[2]).toBe('Sviatoslav Upirow') // name
    expect(updatedRow[3]).toBe('2024-09-24T14:00:00.000Z') // consent_date остается
    expect(updatedRow[5]).toBe('FALSE') // privacy теперь FALSE
    expect(updatedRow[6]).toBe('FALSE') // terms теперь FALSE
    expect(updatedRow[7]).toBe('FALSE') // notifications теперь FALSE
    expect(updatedRow[8]).toMatch(/T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/) // withdrawal date добавлена
    expect(updatedRow[9]).toBe('support_form') // withdrawal method
  })
})
