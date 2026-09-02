import { dilutionCalc, hydrometerCorrection } from 'cerveza-tools'
import { describe, expect, it } from 'vitest'
import type { StateStorage } from 'zustand/middleware'
import { createAmericanIpa } from '../../domain/brew'
import { calculateBrewMetrics } from '../../domain/metrics'
import { createBrewStore } from '../../state/brew-store'

function decimal(value: string) {
  return Number(value.replace(',', '.').replace(/[^0-9.-]/g, ''))
}

function createStore() {
  const values = new Map<string, string>()
  const storage: StateStorage = {
    getItem: (name) => values.get(name) ?? null,
    setItem: (name, value) => { values.set(name, value) },
    removeItem: (name) => { values.delete(name) },
  }
  return createBrewStore(storage)
}

describe('documented brew scenarios', () => {
  it('applies a corrected hydrometer reading once before calculating ABV', () => {
    const store = createStore()
    const brew = store.getState().brew
    const corrected = decimal(hydrometerCorrection(
      String(brew.measuredOriginalGravity),
      String(brew.gravitySampleTemperatureC),
      String(brew.hydrometerCalibrationTemperatureC),
      'en',
    ).cHydrometer)

    store.getState().updateBrew({ originalGravity: corrected }, { source: 'agent' })

    expect(calculateBrewMetrics(store.getState().brew)).toMatchObject({
      correctedOriginalGravity: 1.058,
      expectedAbvPercent: 6.31,
    })
  })

  it('calculates dilution before applying the proposed volume', () => {
    const store = createStore()
    store.getState().updateBrew({ originalGravity: 1.058 })
    const brew = store.getState().brew
    const waterLiters = decimal(dilutionCalc(
      String(brew.originalGravity),
      String(brew.targetOriginalGravity),
      String(brew.batchVolumeLiters),
      'en',
    ).dilutionCalcValue)

    expect(waterLiters).toBe(3.2)
    expect(store.getState().brew.batchVolumeLiters).toBe(20)

    store.getState().updateBrew({
      batchVolumeLiters: brew.batchVolumeLiters + waterLiters,
    }, { source: 'agent' })

    expect(store.getState().brew.batchVolumeLiters).toBe(23.2)
  })

  it('adjusts Citra to the target IBU without changing Mosaic', () => {
    const store = createStore()
    const startingBrew = createAmericanIpa()
    startingBrew.originalGravity = 1.058
    startingBrew.hops[0].amountGrams = 30
    store.setState({ brew: startingBrew })

    store.getState().updateHop('citra-60', { amountGrams: 25 }, { source: 'agent' })

    expect(calculateBrewMetrics(store.getState().brew).estimatedIbu).toBe(45)
    expect(store.getState().brew.hops).toMatchObject([
      { id: 'citra-60', amountGrams: 25 },
      { id: 'mosaic-10', amountGrams: 30 },
    ])
  })
})
