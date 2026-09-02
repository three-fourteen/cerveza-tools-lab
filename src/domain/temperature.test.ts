import { describe, expect, it } from 'vitest'
import {
  displayTemperature,
  parseTemperatureUnit,
  temperatureRange,
  temperatureToCelsius,
} from './temperature'

describe('temperature units', () => {
  it('converts Celsius to Fahrenheit for display', () => {
    expect(displayTemperature(20, 'fahrenheit')).toBe(68)
    expect(displayTemperature(28, 'fahrenheit')).toBe(82.4)
  })

  it('converts Fahrenheit input back to canonical Celsius', () => {
    expect(temperatureToCelsius(68, 'fahrenheit')).toBe(20)
    expect(temperatureToCelsius(82.4, 'fahrenheit')).toBe(28)
  })

  it('rejects unsupported temperature units', () => {
    expect(parseTemperatureUnit('kelvin')).toBeUndefined()
  })

  it('provides equivalent input ranges', () => {
    expect(temperatureRange('celsius')).toEqual({ minimum: -273.15, maximum: 200 })
    expect(temperatureRange('fahrenheit')).toEqual({ minimum: -459.67, maximum: 392 })
  })
})
