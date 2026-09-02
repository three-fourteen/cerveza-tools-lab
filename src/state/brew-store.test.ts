import { beforeEach, describe, expect, it } from 'vitest'
import { createAmericanIpa, type CurrentBrew } from '../domain/brew'
import { createBrewStore } from './brew-store'

function createMemoryStorage() {
  const values = new Map<string, string>()
  return {
    values,
    getItem: (name: string) => values.get(name) ?? null,
    setItem: (name: string, value: string) => { values.set(name, value) },
    removeItem: (name: string) => { values.delete(name) },
  }
}

function persistedBrew(brew: CurrentBrew) {
  return JSON.stringify({
    state: { brew, temperatureUnit: 'celsius' },
    version: 0,
  })
}

describe('brew store', () => {
  const storage = createMemoryStorage()
  const store = createBrewStore(storage)

  beforeEach(() => {
    storage.values.clear()
    store.setState({
      brew: createAmericanIpa(),
      temperatureUnit: 'celsius',
      syncVersion: 0,
      lastChange: undefined,
    })
  })

  it('updates a whitelisted brew field through the shared action', () => {
    store.getState().updateBrew({ expectedFinalGravity: 1.014 })

    expect(store.getState().brew.expectedFinalGravity).toBe(1.014)
  })

  it('preserves agent-applied dilution values when a human edits Expected FG', () => {
    store.getState().updateBrew({ originalGravity: 1.058 })
    store.getState().updateBrew(
      { batchVolumeLiters: 23.2, originalGravity: 1.05 },
      { source: 'agent', reason: 'Applied dilution.' },
    )

    const result = store.getState().updateBrew({ expectedFinalGravity: 1.014 })

    expect(result).toEqual({ ok: true })
    expect(store.getState()).toMatchObject({
      syncVersion: 3,
      brew: {
        batchVolumeLiters: 23.2,
        originalGravity: 1.05,
        expectedFinalGravity: 1.014,
      },
      lastChange: {
        source: 'human',
        values: [{ field: 'expectedFinalGravity', previous: 1.011, next: 1.014 }],
      },
    })
  })

  it('does not rehydrate stale persisted brew over WebMCP and human edits', async () => {
    const staleBrew = createAmericanIpa()
    staleBrew.originalGravity = 1.058
    let resolveHydration: (value: string) => void = () => {}
    const hydration = new Promise<string>((resolve) => { resolveHydration = resolve })
    const delayedStorage = {
      getItem: () => hydration,
      setItem: () => {},
      removeItem: () => {},
    }
    const delayedStore = createBrewStore(delayedStorage)

    delayedStore.getState().loadPreset('american-ipa')
    delayedStore.getState().updateBrew(
      { batchVolumeLiters: 23.2, originalGravity: 1.05 },
      { source: 'agent', reason: 'Applied dilution.' },
    )
    delayedStore.getState().updateBrew({ expectedFinalGravity: 1.014 })
    resolveHydration(persistedBrew(staleBrew))
    await delayedStore.persist.rehydrate()

    expect(delayedStore.getState().brew).toMatchObject({
      batchVolumeLiters: 23.2,
      originalGravity: 1.05,
      expectedFinalGravity: 1.014,
    })
  })

  it('updates only the requested hop addition', () => {
    store.getState().updateHop('citra-60', { amountGrams: 18 })

    expect(store.getState().brew.hops).toMatchObject([
      { id: 'citra-60', amountGrams: 18 },
      { id: 'mosaic-10', amountGrams: 30 },
    ])
  })

  it('persists the current brew after a shared mutation', () => {
    store.getState().updateBrew({ measuredOriginalGravity: 1.058 })

    expect(storage.getItem('cerveza-tools-lab-current-brew')).toContain('1.058')
  })

  it('persists temperature preference outside the brew model', () => {
    store.getState().setTemperatureUnit('fahrenheit')

    const restoredStore = createBrewStore(storage)

    expect(restoredStore.getState().temperatureUnit).toBe('fahrenheit')
    expect(restoredStore.getState().brew).not.toHaveProperty('temperatureUnit')
  })

  it('rejects invalid values without changing persisted state', () => {
    const result = store.getState().updateBrew({ batchVolumeLiters: 0 })

    expect(result).toMatchObject({ ok: false, code: 'INVALID_INPUT' })
    expect(store.getState().brew.batchVolumeLiters).toBe(20)
  })

  it('rejects empty patches and unknown hop additions', () => {
    expect(store.getState().updateBrew({})).toMatchObject({
      ok: false,
      code: 'INVALID_INPUT',
    })
    expect(store.getState().updateHop('missing-hop', { amountGrams: 12 })).toMatchObject({
      ok: false,
      code: 'NOT_FOUND',
    })
  })

  it('records agent changes without persisting feedback metadata', () => {
    store.getState().updateBrew(
      { originalGravity: 1.058 },
      { source: 'agent', reason: 'Applied corrected reading.' },
    )

    expect(store.getState().lastChange).toMatchObject({
      source: 'agent',
      values: [{ field: 'originalGravity', previous: 1.05, next: 1.058 }],
    })
    expect(storage.getItem('cerveza-tools-lab-current-brew')).not.toContain('lastChange')
  })

  it('falls back to the default brew when persisted data is invalid', () => {
    const invalidStorage = createMemoryStorage()
    invalidStorage.setItem('cerveza-tools-lab-current-brew', JSON.stringify({
      state: { brew: { id: 'broken', name: 'Broken', batchVolumeLiters: 20 } },
      version: 0,
    }))

    const recoveredStore = createBrewStore(invalidStorage)

    expect(recoveredStore.getState().brew).toEqual(createAmericanIpa())
  })

  it('rejects persisted brews with duplicate hop IDs', () => {
    const duplicateStorage = createMemoryStorage()
    const duplicateBrew = createAmericanIpa()
    duplicateBrew.hops[1].id = duplicateBrew.hops[0].id
    duplicateStorage.setItem('cerveza-tools-lab-current-brew', JSON.stringify({
      state: { brew: duplicateBrew },
      version: 0,
    }))

    const recoveredStore = createBrewStore(duplicateStorage)

    expect(recoveredStore.getState().brew).toEqual(createAmericanIpa())
  })
})
