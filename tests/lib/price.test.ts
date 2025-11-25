/// <reference types='vitest' />

import { describe, expect, it } from 'vitest'
import { normalizePricePln } from '../../src/lib/price'

describe('normalizePricePln', () => {
  it('returns numeric price as string for standard value', () => {
    expect(normalizePricePln(150)).toBe('150')
  })

  it('preserves range strings while normalizing spacing/dash', () => {
    expect(normalizePricePln(' 200 - 300 ')).toBe('200-300')
  })

  it('falls back to zero string for non-numeric inputs', () => {
    expect(normalizePricePln('free')).toBe('0')
  })
})
