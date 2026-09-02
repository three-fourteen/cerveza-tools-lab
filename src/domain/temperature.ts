export const temperatureUnits = ['celsius', 'fahrenheit'] as const

export type TemperatureUnit = (typeof temperatureUnits)[number]

export const defaultTemperatureUnit: TemperatureUnit = 'celsius'

export interface TemperatureRange {
  readonly minimum: number
  readonly maximum: number
}

export const celsiusTemperatureRange: TemperatureRange = {
  minimum: -273.15,
  maximum: 200,
}

export function parseTemperatureUnit(value: unknown): TemperatureUnit | undefined {
  return temperatureUnits.find((unit) => unit === value)
}

export function temperatureSymbol(unit: TemperatureUnit): '°C' | '°F' {
  return unit === 'celsius' ? '°C' : '°F'
}

function celsiusToFahrenheit(celsius: number): number {
  return (celsius * 9) / 5 + 32
}

export function displayTemperature(celsius: number, unit: TemperatureUnit): number {
  if (unit === 'celsius') return celsius
  return Math.round(celsiusToFahrenheit(celsius) * 10) / 10
}

export function temperatureToCelsius(value: number, unit: TemperatureUnit): number {
  if (unit === 'celsius') return value
  return Math.round((((value - 32) * 5) / 9) * 1_000) / 1_000
}

export function temperatureRange(unit: TemperatureUnit): TemperatureRange {
  if (unit === 'celsius') return celsiusTemperatureRange
  return {
    minimum: Math.round(celsiusToFahrenheit(celsiusTemperatureRange.minimum) * 100) / 100,
    maximum: Math.round(celsiusToFahrenheit(celsiusTemperatureRange.maximum) * 100) / 100,
  }
}
