import { create } from 'zustand'
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware'
import {
  createAmericanIpa,
  createBrewFromPreset,
  type CurrentBrew,
  type HopAddition,
} from '../domain/brew'

export type EditableBrewPatch = Partial<Pick<
  CurrentBrew,
  | 'name'
  | 'batchVolumeLiters'
  | 'targetOriginalGravity'
  | 'measuredOriginalGravity'
  | 'gravitySampleTemperatureC'
  | 'hydrometerCalibrationTemperatureC'
  | 'expectedFinalGravity'
  | 'mashTemperatureC'
  | 'boilMinutes'
  | 'targetCarbonationVolumes'
  | 'beerTemperatureC'
>>

export type EditableHopPatch = Partial<Omit<HopAddition, 'id'>>

export type BrewStore = {
  brew: CurrentBrew
  loadPreset: (presetId: string) => void
  updateBrew: (patch: EditableBrewPatch) => void
  addHop: (hop: HopAddition) => void
  updateHop: (id: string, patch: EditableHopPatch) => void
  removeHop: (id: string) => void
}

const memoryStorage = new Map<string, string>()

const fallbackStorage: StateStorage = {
  getItem: (name) => memoryStorage.get(name) ?? null,
  setItem: (name, value) => { memoryStorage.set(name, value) },
  removeItem: (name) => { memoryStorage.delete(name) },
}

export function createBrewStore(storage: StateStorage = fallbackStorage) {
  return create<BrewStore>()(
    persist(
    (set) => ({
      brew: createAmericanIpa(),
      loadPreset: (presetId) => set({ brew: createBrewFromPreset(presetId) }),
      updateBrew: (patch) => set((state) => ({ brew: { ...state.brew, ...patch } })),
      addHop: (hop) => set((state) => ({ brew: { ...state.brew, hops: [...state.brew.hops, { ...hop }] } })),
      updateHop: (id, patch) => set((state) => ({
        brew: {
          ...state.brew,
          hops: state.brew.hops.map((hop) => hop.id === id ? { ...hop, ...patch } : hop),
        },
      })),
      removeHop: (id) => set((state) => ({
        brew: { ...state.brew, hops: state.brew.hops.filter((hop) => hop.id !== id) },
      })),
    }),
      {
        name: 'cerveza-tools-lab-current-brew',
        partialize: (state) => ({ brew: state.brew }),
        storage: createJSONStorage(() => storage),
      },
    ),
  )
}

function browserStorage(): StateStorage {
  if (import.meta.env.MODE === 'test') return fallbackStorage
  if (typeof window === 'undefined') return fallbackStorage
  try {
    return window.localStorage ?? fallbackStorage
  } catch {
    return fallbackStorage
  }
}

export const useBrewStore = createBrewStore(browserStorage())
