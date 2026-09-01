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

export function calculateBrewMetrics(brew: CurrentBrew): BrewMetrics {
  const correctedOriginalGravity = brew.measuredOriginalGravity !== undefined
    && brew.gravitySampleTemperatureC !== undefined
    && brew.hydrometerCalibrationTemperatureC !== undefined
    ? decimal(hydrometerCorrection(
      String(brew.measuredOriginalGravity),
      String(brew.gravitySampleTemperatureC),
      String(brew.hydrometerCalibrationTemperatureC),
      'en',
    ).cHydrometer)
    : undefined

  const originalGravity = correctedOriginalGravity ?? brew.measuredOriginalGravity ?? brew.targetOriginalGravity
  const expectedAbvPercent = originalGravity !== undefined && brew.expectedFinalGravity !== undefined
    ? decimal(alcoholCalc(String(originalGravity), String(brew.expectedFinalGravity), 'en').alcoholCalcValue)
    : undefined

  const estimatedIbu = originalGravity !== undefined && brew.hops.length > 0
    ? brew.hops.reduce((total, hop) => total + decimal(ibuCalc(
      String(hop.amountGrams), String(hop.alphaAcidPercent), String(hop.boilMinutes),
      String(brew.batchVolumeLiters), String(originalGravity), 'en',
    ).ibuCalcValue), 0)
    : undefined

  return {
    ...(correctedOriginalGravity !== undefined && { correctedOriginalGravity }),
    ...(expectedAbvPercent !== undefined && { expectedAbvPercent }),
    ...(estimatedIbu !== undefined && { estimatedIbu: Math.round(estimatedIbu * 10) / 10 }),
  }
}
