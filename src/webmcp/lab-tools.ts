import { calculateBrewMetrics } from '../domain/metrics'
import { useBrewStore, type EditableBrewPatch, type EditableHopPatch } from '../state/brew-store'

type ToolResult = { content: Array<{ type: 'text'; text: string }> }
type Tool = { name: string; description: string; inputSchema: Record<string, unknown>; execute: (input: unknown) => Promise<ToolResult> }
type ModelContext = { registerTool: (tool: Tool, options?: { signal?: AbortSignal }) => void | Promise<void> }
let registrationController: AbortController | undefined

const editableFields = new Set(['name', 'batchVolumeLiters', 'targetOriginalGravity', 'measuredOriginalGravity', 'gravitySampleTemperatureC', 'hydrometerCalibrationTemperatureC', 'expectedFinalGravity', 'mashTemperatureC', 'boilMinutes', 'targetCarbonationVolumes', 'beerTemperatureC'])
const hopFields = new Set(['name', 'alphaAcidPercent', 'amountGrams', 'boilMinutes'])

function response(ok: boolean, value: unknown): ToolResult {
  return { content: [{ type: 'text', text: JSON.stringify(ok ? { ok, data: value } : { ok, error: value }) }] }
}

function object(input: unknown): Record<string, unknown> {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) throw new Error('Tool input must be an object.')
  return input as Record<string, unknown>
}

function numericPatch(value: Record<string, unknown>, fields: Set<string>) {
  const patch: Record<string, unknown> = {}
  for (const [key, input] of Object.entries(value)) {
    if (!fields.has(key)) throw new Error(`Unexpected editable field: ${key}.`)
    if (key === 'name') { if (typeof input !== 'string') throw new Error('name must be a string.'); patch[key] = input; continue }
    if (typeof input !== 'number' || !Number.isFinite(input)) throw new Error(`${key} must be a finite number.`)
    patch[key] = input
  }
  return patch
}

async function execute(action: () => unknown) {
  try { return response(true, action()) } catch (error) { return response(false, { code: 'INVALID_INPUT', message: error instanceof Error ? error.message : 'Invalid input.' }) }
}

function notifyBrewUpdate() {
  window.dispatchEvent(new Event('current-brew-updated'))
}

export async function registerLabTools(modelContext?: ModelContext) {
  const context = modelContext ?? (document as Document & { modelContext?: ModelContext }).modelContext
  if (!context) return { supported: false, registered: [] as string[], unregister: () => {} }
  if (registrationController) return { supported: true, registered: [] as string[], unregister: () => unregisterLabTools() }
  const tools: Tool[] = [
    { name: 'get_current_brew', description: 'Read the current shared brew as structured data.', inputSchema: { type: 'object' }, execute: () => execute(() => useBrewStore.getState().brew) },
    { name: 'get_current_brew_metrics', description: 'Read deterministic metrics for the current shared brew.', inputSchema: { type: 'object' }, execute: () => execute(() => calculateBrewMetrics(useBrewStore.getState().brew)) },
    { name: 'update_current_brew', description: 'Apply a whitelisted patch to the current shared brew.', inputSchema: { type: 'object', required: ['patch'] }, execute: (input) => execute(() => { const data = object(input); const patch = numericPatch(object(data.patch), editableFields) as EditableBrewPatch; useBrewStore.getState().updateBrew(patch); notifyBrewUpdate(); return { changedFields: Object.keys(patch), brew: useBrewStore.getState().brew } }) },
    { name: 'update_hop_addition', description: 'Update exactly one hop addition without changing other hops.', inputSchema: { type: 'object', required: ['id'] }, execute: (input) => execute(() => { const data = object(input); if (typeof data.id !== 'string') throw new Error('id must be a string.'); const { id, ...patchInput } = data; const patch = numericPatch(patchInput, hopFields) as EditableHopPatch; useBrewStore.getState().updateHop(id, patch); notifyBrewUpdate(); return { changedFields: Object.keys(patch), brew: useBrewStore.getState().brew } }) },
  ]
  const controller = new AbortController()
  await Promise.all(tools.map((tool) => context.registerTool(tool, { signal: controller.signal })))
  registrationController = controller
  return { supported: true, registered: tools.map((tool) => tool.name), unregister: () => unregisterLabTools() }
}

export function unregisterLabTools() {
  registrationController?.abort()
  registrationController = undefined
}
