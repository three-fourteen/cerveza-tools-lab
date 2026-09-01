export type Gravity = number

export type HopAddition = {
  id: string
  name: string
  alphaAcidPercent: number
  amountGrams: number
  boilMinutes: number
}

export type CurrentBrew = {
  id: string
  name: string
  batchVolumeLiters: number
  targetOriginalGravity?: Gravity
  measuredOriginalGravity?: Gravity
  gravitySampleTemperatureC?: number
  hydrometerCalibrationTemperatureC?: number
  expectedFinalGravity?: Gravity
  mashTemperatureC?: number
  boilMinutes?: number
  hops: HopAddition[]
  targetCarbonationVolumes?: number
  beerTemperatureC?: number
}

export type BrewPreset = {
  id: string
  name: string
  description: string
  brew: CurrentBrew
}

const presets: BrewPreset[] = [
  {
    id: 'american-ipa',
    name: 'American IPA',
    description: 'Citrus-forward IPA for the WebMCP demo.',
    brew: {
      id: 'american-ipa', name: 'American IPA', batchVolumeLiters: 20,
      targetOriginalGravity: 1.05, measuredOriginalGravity: 1.056,
      gravitySampleTemperatureC: 28, hydrometerCalibrationTemperatureC: 20,
      expectedFinalGravity: 1.011, mashTemperatureC: 67, boilMinutes: 60,
      hops: [
        { id: 'citra-60', name: 'Citra', alphaAcidPercent: 12, amountGrams: 25, boilMinutes: 60 },
        { id: 'mosaic-10', name: 'Mosaic', alphaAcidPercent: 11, amountGrams: 30, boilMinutes: 10 },
      ],
    },
  },
  {
    id: 'czech-pilsner', name: 'Czech Pilsner', description: 'Clean lager with Saaz additions.',
    brew: { id: 'czech-pilsner', name: 'Czech Pilsner', batchVolumeLiters: 20, targetOriginalGravity: 1.048, expectedFinalGravity: 1.01, mashTemperatureC: 66, boilMinutes: 90, hops: [{ id: 'saaz-60', name: 'Saaz', alphaAcidPercent: 3.5, amountGrams: 45, boilMinutes: 60 }] },
  },
  {
    id: 'dry-stout', name: 'Dry Stout', description: 'Roasty and sessionable.',
    brew: { id: 'dry-stout', name: 'Dry Stout', batchVolumeLiters: 20, targetOriginalGravity: 1.044, expectedFinalGravity: 1.01, mashTemperatureC: 67, boilMinutes: 60, hops: [{ id: 'east-kent-golding-60', name: 'East Kent Golding', alphaAcidPercent: 5, amountGrams: 35, boilMinutes: 60 }] },
  },
  {
    id: 'belgian-wit', name: 'Belgian Wit', description: 'Light, spiced wheat ale.',
    brew: { id: 'belgian-wit', name: 'Belgian Wit', batchVolumeLiters: 20, targetOriginalGravity: 1.046, expectedFinalGravity: 1.009, mashTemperatureC: 66, boilMinutes: 60, hops: [{ id: 'hallertau-60', name: 'Hallertau Mittelfrüh', alphaAcidPercent: 4, amountGrams: 25, boilMinutes: 60 }] },
  },
  {
    id: 'helles', name: 'Munich Helles', description: 'Soft, balanced pale lager.',
    brew: { id: 'helles', name: 'Munich Helles', batchVolumeLiters: 20, targetOriginalGravity: 1.048, expectedFinalGravity: 1.01, mashTemperatureC: 66, boilMinutes: 60, hops: [{ id: 'hallertau-60', name: 'Hallertau Mittelfrüh', alphaAcidPercent: 4, amountGrams: 28, boilMinutes: 60 }] },
  },
]

export const brewPresets = presets.map(({ brew: _brew, ...preset }) => preset)

export function cloneBrew(brew: CurrentBrew): CurrentBrew {
  return { ...brew, hops: brew.hops.map((hop) => ({ ...hop })) }
}

export function createBrewFromPreset(id: string): CurrentBrew {
  const preset = presets.find((candidate) => candidate.id === id)
  if (!preset) throw new Error(`Unknown brew preset: ${id}`)
  return cloneBrew(preset.brew)
}

export function createAmericanIpa(): CurrentBrew {
  return createBrewFromPreset('american-ipa')
}
