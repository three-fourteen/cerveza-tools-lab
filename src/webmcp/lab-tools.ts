import { calculateBrewMetrics } from '../domain/metrics'
import {
  parseTemperatureUnit,
  temperatureUnits,
} from '../domain/temperature'
import {
  agentEditableBrewFields,
  editableHopFields,
  type EditableBrewPatch,
  type EditableHopPatch,
} from '../domain/validation'
import { useBrewStore, type MutationResult } from '../state/brew-store'

type ToolResult = { content: Array<{ type: 'text'; text: string }> }
type Tool = {
  name: string
  description: string
  inputSchema: Record<string, unknown>
  execute: (input: unknown) => Promise<ToolResult>
}
type ModelContext = {
  registerTool: (tool: Tool, options?: { signal?: AbortSignal }) => void | Promise<void>
}
let registrationController: AbortController | undefined

class ToolError extends Error {
  constructor(
    readonly code: 'INVALID_INPUT' | 'NOT_FOUND',
    message: string,
  ) {
    super(message)
  }
}

const brewFieldSet = new Set<string>(agentEditableBrewFields)
const hopFieldSet = new Set<string>(editableHopFields)
const updateBrewInputFields = new Set(['patch', 'reason'])
const updateHopInputFields = new Set(['id', 'reason', ...editableHopFields])
const setTemperatureUnitInputFields = new Set(['unit'])

const gravitySchema = { type: 'number', exclusiveMinimum: 0, maximum: 2 }
const brewPatchProperties = {
  name: { type: 'string', minLength: 1, maxLength: 100 },
  batchVolumeLiters: { type: 'number', exclusiveMinimum: 0, maximum: 100_000 },
  targetOriginalGravity: gravitySchema,
  originalGravity: gravitySchema,
  expectedFinalGravity: gravitySchema,
} satisfies Record<(typeof agentEditableBrewFields)[number], Record<string, unknown>>
const hopPatchProperties = {
  name: { type: 'string', minLength: 1, maxLength: 100 },
  alphaAcidPercent: { type: 'number', exclusiveMinimum: 0, maximum: 100 },
  amountGrams: { type: 'number', exclusiveMinimum: 0, maximum: 100_000 },
  boilMinutes: { type: 'number', minimum: 0, maximum: 10_000 },
} satisfies Record<(typeof editableHopFields)[number], Record<string, unknown>>

const emptyInputSchema = {
  type: 'object',
  properties: {},
  additionalProperties: false,
}

const updateBrewInputSchema = {
  type: 'object',
  properties: {
    patch: {
      type: 'object',
      properties: brewPatchProperties,
      minProperties: 1,
      additionalProperties: false,
    },
    reason: { type: 'string', minLength: 1, maxLength: 500 },
  },
  required: ['patch'],
  additionalProperties: false,
}

const updateHopInputSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', minLength: 1 },
    ...hopPatchProperties,
    reason: { type: 'string', minLength: 1, maxLength: 500 },
  },
  required: ['id'],
  anyOf: editableHopFields.map((field) => ({ required: [field] })),
  additionalProperties: false,
}

const setTemperatureUnitInputSchema = {
  type: 'object',
  properties: {
    unit: { type: 'string', enum: temperatureUnits },
  },
  required: ['unit'],
  additionalProperties: false,
}

function response(ok: boolean, value: unknown): ToolResult {
  return { content: [{ type: 'text', text: JSON.stringify(ok ? { ok, data: value } : { ok, error: value }) }] }
}

function object(input: unknown): Record<string, unknown> {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) throw new Error('Tool input must be an object.')
  return input as Record<string, unknown>
}

function assertOnlyFields(value: Record<string, unknown>, fields: Set<string>) {
  const unexpectedField = Object.keys(value).find((key) => !fields.has(key))
  if (unexpectedField) throw new Error(`Unexpected input field: ${unexpectedField}.`)
}

function parsePatch(value: Record<string, unknown>, fields: Set<string>) {
  const parsedPatch: Record<string, unknown> = {}
  for (const [key, input] of Object.entries(value)) {
    if (!fields.has(key)) throw new Error(`Unexpected editable field: ${key}.`)
    if (key === 'name') {
      if (typeof input !== 'string') throw new Error('name must be a string.')
      parsedPatch[key] = input
      continue
    }
    if (typeof input !== 'number' || !Number.isFinite(input)) {
      throw new Error(`${key} must be a finite number.`)
    }
    parsedPatch[key] = input
  }
  return parsedPatch
}

async function execute(action: () => unknown) {
  try {
    return response(true, action())
  } catch (error) {
    return response(false, {
      code: error instanceof ToolError ? error.code : 'INVALID_INPUT',
      message: error instanceof Error ? error.message : 'Invalid input.',
    })
  }
}

function reason(value: unknown): string | undefined {
  if (value === undefined) return undefined
  if (typeof value !== 'string' || value.trim() === '' || value.length > 500) {
    throw new ToolError('INVALID_INPUT', 'reason must be a non-empty string.')
  }
  return value
}

function assertMutationSucceeded(result: MutationResult) {
  if (!result.ok) throw new ToolError(result.code, result.message)
}

function mutationOutput(changedFields: string[]) {
  const brew = useBrewStore.getState().brew
  return {
    changedFields,
    brew,
    metrics: calculateBrewMetrics(brew),
  }
}

function updateCurrentBrew(input: unknown) {
  const data = object(input)
  assertOnlyFields(data, updateBrewInputFields)
  const brewPatch = parsePatch(object(data.patch), brewFieldSet) as EditableBrewPatch
  const result = useBrewStore.getState().updateBrew(brewPatch, {
    source: 'agent',
    reason: reason(data.reason),
  })
  assertMutationSucceeded(result)
  return mutationOutput(Object.keys(brewPatch))
}

function updateHopAddition(input: unknown) {
  const data = object(input)
  assertOnlyFields(data, updateHopInputFields)
  if (typeof data.id !== 'string' || data.id === '') {
    throw new ToolError('INVALID_INPUT', 'id must be a non-empty string.')
  }

  const { id, reason: reasonInput, ...patchInput } = data
  const hopPatch = parsePatch(patchInput, hopFieldSet) as EditableHopPatch
  const result = useBrewStore.getState().updateHop(id, hopPatch, {
    source: 'agent',
    reason: reason(reasonInput),
  })
  assertMutationSucceeded(result)
  return mutationOutput(Object.keys(hopPatch))
}

function setTemperatureUnit(input: unknown) {
  const data = object(input)
  assertOnlyFields(data, setTemperatureUnitInputFields)
  const unit = parseTemperatureUnit(data.unit)
  if (!unit) throw new ToolError('INVALID_INPUT', 'unit must be celsius or fahrenheit.')

  useBrewStore.getState().setTemperatureUnit(unit, { source: 'agent' })
  return { temperatureUnit: unit }
}

function abortRegistration(controller: AbortController) {
  controller.abort()
  if (registrationController === controller) registrationController = undefined
}

export async function registerLabTools(modelContext?: ModelContext) {
  const context = modelContext ?? (document as Document & { modelContext?: ModelContext }).modelContext
  if (!context) return { supported: false, registered: [] as string[], unregister: () => {} }
  if (registrationController) {
    return { supported: true, registered: [] as string[], unregister: () => {} }
  }
  const tools: Tool[] = [
    {
      name: 'get_current_brew',
      description: 'Read the current shared brew as structured data.',
      inputSchema: emptyInputSchema,
      execute: () => execute(() => useBrewStore.getState().brew),
    },
    {
      name: 'get_current_brew_metrics',
      description: 'Read deterministic metrics for the current shared brew.',
      inputSchema: emptyInputSchema,
      execute: () => execute(() => calculateBrewMetrics(useBrewStore.getState().brew)),
    },
    {
      name: 'update_current_brew',
      description: 'Apply a validated patch to visible Current Brew fields.',
      inputSchema: updateBrewInputSchema,
      execute: (input) => execute(() => updateCurrentBrew(input)),
    },
    {
      name: 'update_hop_addition',
      description: 'Update exactly one existing hop addition.',
      inputSchema: updateHopInputSchema,
      execute: (input) => execute(() => updateHopAddition(input)),
    },
    {
      name: 'set_temperature_unit',
      description: 'Change temperature display units without changing stored Celsius values.',
      inputSchema: setTemperatureUnitInputSchema,
      execute: (input) => execute(() => setTemperatureUnit(input)),
    },
  ]
  const controller = new AbortController()
  registrationController = controller
  try {
    await Promise.all(tools.map((tool) => context.registerTool(tool, { signal: controller.signal })))
  } catch (error) {
    abortRegistration(controller)
    throw error
  }
  return {
    supported: true,
    registered: tools.map((tool) => tool.name),
    unregister: () => abortRegistration(controller),
  }
}

export function unregisterLabTools() {
  if (registrationController) abortRegistration(registrationController)
}
