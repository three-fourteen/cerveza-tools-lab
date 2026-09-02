import type { CurrentBrew, HopAddition } from './brew'
import { celsiusTemperatureRange } from './temperature'

export const editableBrewFields = [
  'name',
  'batchVolumeLiters',
  'targetOriginalGravity',
  'originalGravity',
  'measuredOriginalGravity',
  'gravitySampleTemperatureC',
  'hydrometerCalibrationTemperatureC',
  'expectedFinalGravity',
] as const satisfies readonly (keyof CurrentBrew)[]

export const agentEditableBrewFields = [
  'name',
  'batchVolumeLiters',
  'targetOriginalGravity',
  'originalGravity',
  'expectedFinalGravity',
] as const satisfies readonly (typeof editableBrewFields)[number][]

export const editableHopFields = [
  'name',
  'alphaAcidPercent',
  'amountGrams',
  'boilMinutes',
] as const satisfies readonly (keyof HopAddition)[]

export type EditableBrewPatch = Partial<Pick<
  CurrentBrew,
  (typeof editableBrewFields)[number]
>>

export type EditableHopPatch = Partial<Pick<
  HopAddition,
  (typeof editableHopFields)[number]
>>

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function isNonEmptyString(value: unknown, maximumLength = 100): value is string {
  return typeof value === 'string'
    && value.trim().length > 0
    && value.length <= maximumLength
}

function isNumberBetween(
  value: unknown,
  minimum: number,
  maximum: number,
): value is number {
  return typeof value === 'number'
    && Number.isFinite(value)
    && value >= minimum
    && value <= maximum
}

function isNumberGreaterThan(
  value: unknown,
  minimum: number,
  maximum: number,
): value is number {
  return typeof value === 'number'
    && Number.isFinite(value)
    && value > minimum
    && value <= maximum
}

function isOptionalNumberBetween(
  value: unknown,
  minimum: number,
  maximum: number,
): value is number | undefined {
  return value === undefined || isNumberBetween(value, minimum, maximum)
}

function isOptionalNumberGreaterThan(
  value: unknown,
  minimum: number,
  maximum: number,
): value is number | undefined {
  return value === undefined || isNumberGreaterThan(value, minimum, maximum)
}

function parseHop(value: unknown): HopAddition | undefined {
  if (!isRecord(value)
    || !isNonEmptyString(value.id, 200)
    || !isNonEmptyString(value.name)
    || !isNumberGreaterThan(value.alphaAcidPercent, 0, 100)
    || !isNumberGreaterThan(value.amountGrams, 0, 100_000)
    || !isNumberBetween(value.boilMinutes, 0, 10_000)) {
    return undefined
  }

  return {
    id: value.id,
    name: value.name,
    alphaAcidPercent: value.alphaAcidPercent,
    amountGrams: value.amountGrams,
    boilMinutes: value.boilMinutes,
  }
}

export function parseCurrentBrew(value: unknown): CurrentBrew | undefined {
  if (!isRecord(value)
    || !isNonEmptyString(value.id, 200)
    || !isNonEmptyString(value.name)
    || !isNumberGreaterThan(value.batchVolumeLiters, 0, 100_000)
    || !isOptionalNumberGreaterThan(value.targetOriginalGravity, 0, 2)
    || !isOptionalNumberGreaterThan(value.originalGravity, 0, 2)
    || !isOptionalNumberGreaterThan(value.measuredOriginalGravity, 0, 2)
    || !isOptionalNumberBetween(
      value.gravitySampleTemperatureC,
      celsiusTemperatureRange.minimum,
      celsiusTemperatureRange.maximum,
    )
    || !isOptionalNumberBetween(
      value.hydrometerCalibrationTemperatureC,
      celsiusTemperatureRange.minimum,
      celsiusTemperatureRange.maximum,
    )
    || !isOptionalNumberGreaterThan(value.expectedFinalGravity, 0, 2)
    || !isOptionalNumberBetween(value.mashTemperatureC, 0, 100)
    || !isOptionalNumberBetween(value.boilMinutes, 0, 10_000)
    || !isOptionalNumberBetween(value.targetCarbonationVolumes, 0, 10)
    || !isOptionalNumberBetween(value.beerTemperatureC, -273.15, 200)
    || !Array.isArray(value.hops)) {
    return undefined
  }

  const hops = value.hops.map(parseHop)
  if (!hops.every((hop): hop is HopAddition => hop !== undefined)) return undefined
  if (new Set(hops.map((hop) => hop.id)).size !== hops.length) return undefined

  return {
    id: value.id,
    name: value.name,
    batchVolumeLiters: value.batchVolumeLiters,
    ...(value.targetOriginalGravity !== undefined && {
      targetOriginalGravity: value.targetOriginalGravity,
    }),
    ...(value.originalGravity !== undefined && { originalGravity: value.originalGravity }),
    ...(value.measuredOriginalGravity !== undefined && {
      measuredOriginalGravity: value.measuredOriginalGravity,
    }),
    ...(value.gravitySampleTemperatureC !== undefined && {
      gravitySampleTemperatureC: value.gravitySampleTemperatureC,
    }),
    ...(value.hydrometerCalibrationTemperatureC !== undefined && {
      hydrometerCalibrationTemperatureC: value.hydrometerCalibrationTemperatureC,
    }),
    ...(value.expectedFinalGravity !== undefined && {
      expectedFinalGravity: value.expectedFinalGravity,
    }),
    ...(value.mashTemperatureC !== undefined && { mashTemperatureC: value.mashTemperatureC }),
    ...(value.boilMinutes !== undefined && { boilMinutes: value.boilMinutes }),
    hops,
    ...(value.targetCarbonationVolumes !== undefined && {
      targetCarbonationVolumes: value.targetCarbonationVolumes,
    }),
    ...(value.beerTemperatureC !== undefined && {
      beerTemperatureC: value.beerTemperatureC,
    }),
  }
}

export function validateBrewPatch(
  brew: CurrentBrew,
  patch: EditableBrewPatch,
): string | undefined {
  if (Object.keys(patch).length === 0) return 'Patch must change at least one field.'
  return parseCurrentBrew({ ...brew, ...patch })
    ? undefined
    : 'Brew patch contains an invalid value.'
}

export function validateHopPatch(
  hop: HopAddition,
  patch: EditableHopPatch,
): string | undefined {
  if (Object.keys(patch).length === 0) return 'Patch must change at least one field.'
  return parseHop({ ...hop, ...patch })
    ? undefined
    : 'Hop patch contains an invalid value.'
}
