import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getAvailableDays, getDaySlots } from '../../src/lib/availability'
import { readWeekly, readExceptions } from '../../src/lib/google/sheets'
import { freeBusy } from '../../src/lib/google/calendar'

vi.mock('../../src/lib/google/sheets', () => ({
  readWeekly: vi.fn(),
  readExceptions: vi.fn(),
}))

vi.mock('../../src/lib/google/calendar', () => ({
  freeBusy: vi.fn(),
}))

const mockReadWeekly = vi.mocked(readWeekly)
const mockReadExceptions = vi.mocked(readExceptions)
const mockFreeBusy = vi.mocked(freeBusy)

const TEST_DATE = '2025-12-02' // Tuesday

describe('availability category rules', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockReadWeekly.mockResolvedValue({
      monday: { hours: '10:00-17:00', isDayOff: false },
      tuesday: { hours: '10:00-17:00', isDayOff: false },
      wednesday: { hours: '10:00-17:00', isDayOff: false },
      thursday: { hours: '10:00-17:00', isDayOff: false },
      friday: { hours: '10:00-17:00', isDayOff: false },
      saturday: { hours: '10:00-17:00', isDayOff: false },
      sunday: { hours: '', isDayOff: true },
    })
    mockFreeBusy.mockResolvedValue([])
  })

  it('allows slots when procedure category matches exception category', async () => {
    mockReadExceptions.mockResolvedValue({
      [TEST_DATE]: { hours: '10:00-17:00', isDayOff: false, category: 'osteo' },
    })

    const days = await getAvailableDays(TEST_DATE, TEST_DATE, 60, { procedureCategory: 'osteo' })
    expect(days.days[0].hasWindow).toBe(true)

    const slots = await getDaySlots(TEST_DATE, 60, 15, undefined, 'osteo')
    expect(slots.slots.length).toBeGreaterThan(0)
  })

  it('blocks slots when procedure category does not match exception category', async () => {
    mockReadExceptions.mockResolvedValue({
      [TEST_DATE]: { hours: '10:00-17:00', isDayOff: false, category: 'osteo' },
    })

    const days = await getAvailableDays(TEST_DATE, TEST_DATE, 60, { procedureCategory: 'massage' })
    expect(days.days[0].hasWindow).toBe(false)

    const slots = await getDaySlots(TEST_DATE, 60, 15, undefined, 'massage')
    expect(slots.slots.length).toBe(0)
  })

  it('treats empty or all categories as open to all procedures', async () => {
    mockReadExceptions.mockResolvedValue({
      [TEST_DATE]: { hours: '10:00-17:00', isDayOff: false, category: undefined },
    })

    const days = await getAvailableDays(TEST_DATE, TEST_DATE, 60, { procedureCategory: 'cosmet' })
    expect(days.days[0].hasWindow).toBe(true)

    const slots = await getDaySlots(TEST_DATE, 60, 15, undefined, 'cosmet')
    expect(slots.slots.length).toBeGreaterThan(0)
  })
})
