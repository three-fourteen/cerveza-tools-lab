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
    store.setState({ brew: createAmericanIpa() })
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
})
