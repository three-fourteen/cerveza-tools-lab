import { describe, expect, it } from 'vitest'
import { createAmericanIpa } from './brew'
import { calculateBrewMetrics } from './metrics'

describe('calculateBrewMetrics', () => {
  it('uses the published calculator functions for the American IPA', () => {
    const metrics = calculateBrewMetrics(createAmericanIpa())

    expect(metrics.correctedOriginalGravity).toBe(1.058)
    expect(metrics.expectedAbvPercent).toBe(6.31)
    expect(metrics.estimatedIbu).toBe(45)
  })

  it('omits calculations when their required inputs are missing', () => {
    const brew = createAmericanIpa()
    delete brew.expectedFinalGravity
    brew.hops = []

    expect(calculateBrewMetrics(brew)).toEqual({ correctedOriginalGravity: 1.058 })
  })
})
