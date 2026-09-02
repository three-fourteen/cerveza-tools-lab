import { describe, expect, it } from 'vitest'
import { createAmericanIpa } from './brew'
import { calculateBrewMetrics } from './metrics'

describe('calculateBrewMetrics', () => {
  it('uses the published calculator functions for the American IPA', () => {
    const metrics = calculateBrewMetrics(createAmericanIpa())

    expect(metrics.correctedOriginalGravity).toBe(1.058)
    expect(metrics.expectedAbvPercent).toBe(5.23)
    expect(metrics.estimatedIbu).toBe(48.4)
  })

  it('omits calculations when their required inputs are missing', () => {
    const brew = createAmericanIpa()
    delete brew.expectedFinalGravity
    brew.hops = []

    expect(calculateBrewMetrics(brew)).toEqual({ correctedOriginalGravity: 1.058 })
  })

  it('uses canonical OG without applying hydrometer correction twice', () => {
    const brew = createAmericanIpa()
    brew.originalGravity = 1.058

    expect(calculateBrewMetrics(brew)).toMatchObject({
      correctedOriginalGravity: 1.058,
      expectedAbvPercent: 6.31,
    })
  })

  it('omits invalid calculations instead of throwing', () => {
    const brew = createAmericanIpa()
    brew.batchVolumeLiters = 0
    brew.expectedFinalGravity = 1.2

    expect(calculateBrewMetrics(brew)).toEqual({
      correctedOriginalGravity: 1.058,
    })
  })
})
