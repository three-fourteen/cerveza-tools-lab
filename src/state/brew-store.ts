import { create } from 'zustand'
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware'
import {
  createAmericanIpa,
  createBrewFromPreset,
  type CurrentBrew,
} from '../domain/brew'
import {
  parseCurrentBrew,
  validateBrewPatch,
  validateHopPatch,
  type EditableBrewPatch,
  type EditableHopPatch,
} from '../domain/validation'
import {
  defaultTemperatureUnit,
  parseTemperatureUnit,
  type TemperatureUnit,
} from '../domain/temperature'

export type { EditableBrewPatch, EditableHopPatch } from '../domain/validation'

export type ChangeSource = 'human' | 'agent'

export type BrewChange = {
  source: ChangeSource
  values: Array<{ field: string; previous: unknown; next: unknown }>
  reason?: string
  timestamp: number
}

export type MutationResult =
  | { ok: true }
  | { ok: false; code: 'INVALID_INPUT' | 'NOT_FOUND'; message: string }

type MutationOptions = {
  source?: ChangeSource
  reason?: string
}

function createChange(
  patch: object,
  previousValue: (field: string) => unknown,
  options: MutationOptions,
  fieldPath: (field: string) => string = (field) => field,
): BrewChange {
  const entries = Object.entries(patch)
  return {
    source: options.source ?? 'human',
    values: entries.map(([field, next]) => ({
      field: fieldPath(field),
      previous: previousValue(field),
      next,
    })),
    ...(options.reason && { reason: options.reason }),
    timestamp: Date.now(),
  }
}

export type BrewStore = {
  brew: CurrentBrew
  temperatureUnit: TemperatureUnit
  syncVersion: number
  lastChange?: BrewChange
  loadPreset: (presetId: string) => void
  updateBrew: (patch: EditableBrewPatch, options?: MutationOptions) => MutationResult
  updateHop: (
    id: string,
    patch: EditableHopPatch,
    options?: MutationOptions,
  ) => MutationResult
  setTemperatureUnit: (unit: TemperatureUnit, options?: MutationOptions) => void
  clearLastChange: () => void
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
      (set, get) => ({
        brew: createAmericanIpa(),
        temperatureUnit: defaultTemperatureUnit,
        syncVersion: 0,
        loadPreset: (presetId) => set((state) => ({
          brew: createBrewFromPreset(presetId),
          syncVersion: state.syncVersion + 1,
          lastChange: undefined,
        })),
        updateBrew: (patch, options = {}) => {
          const currentBrew = get().brew
          const message = validateBrewPatch(currentBrew, patch)
          if (message) return { ok: false, code: 'INVALID_INPUT', message }

          set((state) => ({
            brew: { ...state.brew, ...patch },
            syncVersion: state.syncVersion + 1,
            lastChange: createChange(
              patch,
              (field) => currentBrew[field as keyof CurrentBrew],
              options,
            ),
          }))
          return { ok: true }
        },
        updateHop: (id, patch, options = {}) => {
          const hop = get().brew.hops.find((candidate) => candidate.id === id)
          if (!hop) {
            return { ok: false, code: 'NOT_FOUND', message: `Unknown hop addition: ${id}.` }
          }

          const message = validateHopPatch(hop, patch)
          if (message) return { ok: false, code: 'INVALID_INPUT', message }

          set((state) => ({
            brew: {
              ...state.brew,
              hops: state.brew.hops.map((candidate) => (
                candidate.id === id ? { ...candidate, ...patch } : candidate
              )),
            },
            syncVersion: state.syncVersion + 1,
            lastChange: createChange(
              patch,
              (field) => hop[field as keyof typeof hop],
              options,
              (field) => `hops.${id}.${field}`,
            ),
          }))
          return { ok: true }
        },
        setTemperatureUnit: (unit, options = {}) => set((state) => ({
          temperatureUnit: unit,
          syncVersion: state.syncVersion + 1,
          lastChange: createChange(
            { temperatureUnit: unit },
            () => state.temperatureUnit,
            options,
          ),
        })),
        clearLastChange: () => set({ lastChange: undefined }),
      }),
      {
        name: 'cerveza-tools-lab-current-brew',
        partialize: (state) => ({
          brew: state.brew,
          temperatureUnit: state.temperatureUnit,
        }),
        storage: createJSONStorage(() => storage),
        merge: (persistedState, currentState) => {
          const persistedRecord = persistedState !== null
            && typeof persistedState === 'object'
            ? persistedState as Record<string, unknown>
            : undefined
          if (currentState.syncVersion > 0) return currentState

          return {
            ...currentState,
            brew: parseCurrentBrew(persistedRecord?.brew) ?? currentState.brew,
            temperatureUnit: parseTemperatureUnit(persistedRecord?.temperatureUnit)
              ?? currentState.temperatureUnit,
          }
        },
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
