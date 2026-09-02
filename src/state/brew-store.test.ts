import { beforeEach, describe, expect, it } from 'vitest'
import { createAmericanIpa } from '../domain/brew'
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

describe('brew store', () => {
  const storage = createMemoryStorage()
  const store = createBrewStore(storage)

  beforeEach(() => {
    storage.values.clear()
    store.setState({ brew: createAmericanIpa(), lastChange: undefined })
  })

  it('updates a whitelisted brew field through the shared action', () => {
    store.getState().updateBrew({ expectedFinalGravity: 1.014 })

    expect(store.getState().brew.expectedFinalGravity).toBe(1.014)
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
