import { describe, expect, it } from 'vitest'
import { brewPresets, createAmericanIpa, createBrewFromPreset } from './brew'

describe('createAmericanIpa', () => {
  it('returns a fresh current brew with the demo hop schedule', () => {
    const firstBrew = createAmericanIpa()
    const secondBrew = createAmericanIpa()

    firstBrew.hops[0].amountGrams = 18

    expect(secondBrew.hops[0].amountGrams).toBe(25)
    expect(firstBrew.batchVolumeLiters).toBe(20)
    expect(firstBrew.hops).toHaveLength(2)
  })

  it('defaults every preset calibration to 20°C', () => {
    for (const preset of brewPresets) {
      expect(createBrewFromPreset(preset.id).hydrometerCalibrationTemperatureC).toBe(20)
    }
  })
})
