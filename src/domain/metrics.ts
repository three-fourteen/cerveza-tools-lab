import { alcoholCalc, hydrometerCorrection, ibuCalc } from 'cerveza-tools'
import type { CurrentBrew } from './brew'

export type BrewMetrics = {
  correctedOriginalGravity?: number
  expectedAbvPercent?: number
  estimatedIbu?: number
}

function decimal(value: string): number {
  return Number(value.replace(',', '.').replace(/[^0-9.-]/g, ''))
}

function safeCalculation(calculate: () => string): number | undefined {
  try {
    const value = decimal(calculate())
    return Number.isFinite(value) ? value : undefined
  } catch {
    return undefined
  }
}

function correctedHydrometerReading(brew: CurrentBrew): number | undefined {
  if (brew.measuredOriginalGravity === undefined
    || brew.gravitySampleTemperatureC === undefined
    || brew.hydrometerCalibrationTemperatureC === undefined) {
    return undefined
  }

  return safeCalculation(() => hydrometerCorrection(
    String(brew.measuredOriginalGravity),
    String(brew.gravitySampleTemperatureC),
    String(brew.hydrometerCalibrationTemperatureC),
    'en',
  ).cHydrometer)
}

function expectedAbv(brew: CurrentBrew, originalGravity?: number): number | undefined {
  if (originalGravity === undefined
    || brew.expectedFinalGravity === undefined
    || originalGravity <= brew.expectedFinalGravity) {
    return undefined
  }

  return safeCalculation(() => alcoholCalc(
    String(originalGravity),
    String(brew.expectedFinalGravity),
    'en',
  ).alcoholCalcValue)
}

function estimatedIbu(brew: CurrentBrew, originalGravity?: number): number | undefined {
  if (originalGravity === undefined || brew.batchVolumeLiters <= 0 || brew.hops.length === 0) {
    return undefined
  }

  let total = 0
  for (const hop of brew.hops) {
    const contribution = safeCalculation(() => ibuCalc(
      String(hop.amountGrams),
      String(hop.alphaAcidPercent),
      String(hop.boilMinutes),
      String(brew.batchVolumeLiters),
      String(originalGravity),
      'en',
    ).ibuCalcValue)
    if (contribution === undefined) return undefined
    total += contribution
  }

  return Math.round(total * 10) / 10
}

export function calculateBrewMetrics(brew: CurrentBrew): BrewMetrics {
  const correctedReading = correctedHydrometerReading(brew)
  const expectedAbvPercent = expectedAbv(brew, brew.originalGravity)
  const ibu = estimatedIbu(brew, brew.originalGravity)

  return {
    ...(correctedReading !== undefined && { correctedOriginalGravity: correctedReading }),
    ...(expectedAbvPercent !== undefined && { expectedAbvPercent }),
    ...(ibu !== undefined && { estimatedIbu: ibu }),
  }
}
