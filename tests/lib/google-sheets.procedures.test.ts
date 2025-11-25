import { beforeEach, describe, expect, it, vi } from 'vitest'
import { readProcedures } from '../../src/lib/google/sheets'

vi.mock('../../src/lib/env', () => ({
  config: {
    SHEET_TABS: {
      PROCEDURES: 'PROCEDURES',
    },
  },
}))

vi.mock('../../src/config/masters.server', () => ({
  getMasterSheetIdSafe: vi.fn(() => 'test-sheet'),
}))

vi.mock('@/config/masters.server', () => ({
  getMasterSheetIdSafe: vi.fn(() => 'test-sheet'),
}), { virtual: true })

const getMock = vi.fn()

vi.mock('../../src/lib/google/auth', () => ({
  getClients: () => ({
    sheets: {
      spreadsheets: {
        values: {
          get: getMock,
        },
      },
    },
  }),
}))

describe('readProcedures availability column', () => {
  beforeEach(() => {
    getMock.mockReset()
  })

  it('marks procedures inactive when Availability is false', async () => {
    getMock.mockResolvedValue({
      data: {
        values: [
          ['Name', 'Duration', 'Category', 'Availability'],
          ['Proc A', '60', 'Massage', 'TRUE'],
          ['Proc B', '30', '', 'FALSE'],
        ],
      },
    })

    const procedures = await readProcedures()
    expect(procedures).toHaveLength(2)
    const active = procedures.find(p => p.id === 'Proc A-60')
    const inactive = procedures.find(p => p.id === 'Proc B-30')

    expect(active?.is_active).toBe(true)
    expect(inactive?.is_active).toBe(false)
  })
})
