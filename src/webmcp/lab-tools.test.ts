import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createAmericanIpa } from '../domain/brew'
import { useBrewStore } from '../state/brew-store'
import { registerLabTools, unregisterLabTools } from './lab-tools'

interface RegisteredTool {
  name: string
  inputSchema: Record<string, unknown>
  execute: (input: unknown) => Promise<{ content: Array<{ text: string }> }>
}

function readResult(result: { content: Array<{ text: string }> }) {
  return JSON.parse(result.content[0].text) as {
    ok: boolean
    data?: Record<string, unknown>
    error?: { code: string; message: string }
  }
}

describe('registerLabTools', () => {
  let tools: RegisteredTool[]

  beforeEach(() => {
    unregisterLabTools()
    tools = []
    useBrewStore.setState({
      brew: createAmericanIpa(),
      temperatureUnit: 'celsius',
      syncVersion: 0,
      lastChange: undefined,
    })
  })

  afterEach(() => {
    unregisterLabTools()
  })

  async function register() {
    return registerLabTools({ registerTool: (tool) => { tools.push(tool) } })
  }

  function tool(name: string) {
    const registeredTool = tools.find((candidate) => candidate.name === name)
    if (!registeredTool) throw new Error(`Missing tool: ${name}`)
    return registeredTool
  }

  it('reads and updates the same current brew exposed by the UI', async () => {
    const registration = await register()
    const update = tools.find((tool) => tool.name === 'update_current_brew')!
    const result = readResult(await update.execute({
      patch: { originalGravity: 1.058 },
      reason: 'Applied corrected reading.',
    }))

    expect(registration.supported).toBe(true)
    expect(result).toMatchObject({
      ok: true,
      data: {
        changedFields: ['originalGravity'],
        metrics: { correctedOriginalGravity: 1.058, expectedAbvPercent: 6.31 },
      },
    })
    expect(useBrewStore.getState()).toMatchObject({
      brew: { originalGravity: 1.058 },
      lastChange: { source: 'agent', reason: 'Applied corrected reading.' },
    })
  })

  it('rejects invalid, empty, and unknown mutations', async () => {
    await register()

    expect(tool('update_hop_addition').inputSchema).toMatchObject({
      anyOf: [
        { required: ['name'] },
        { required: ['alphaAcidPercent'] },
        { required: ['amountGrams'] },
        { required: ['boilMinutes'] },
      ],
    })
    expect(readResult(await tool('update_current_brew').execute({
      patch: { batchVolumeLiters: 0 },
    }))).toMatchObject({ ok: false, error: { code: 'INVALID_INPUT' } })
    expect(readResult(await tool('update_current_brew').execute({
      patch: {},
    }))).toMatchObject({ ok: false, error: { code: 'INVALID_INPUT' } })
    expect(readResult(await tool('update_hop_addition').execute({
      id: 'missing-hop',
      amountGrams: 10,
    }))).toMatchObject({ ok: false, error: { code: 'NOT_FOUND' } })
  })

  it('updates one hop while preserving unrelated additions', async () => {
    await register()

    const result = readResult(await tool('update_hop_addition').execute({
      id: 'citra-60',
      amountGrams: 18,
    }))

    expect(result.ok).toBe(true)
    expect(useBrewStore.getState().brew.hops).toMatchObject([
      { id: 'citra-60', amountGrams: 18 },
      { id: 'mosaic-10', amountGrams: 30 },
    ])
  })

  it('changes display units without converting stored temperatures', async () => {
    await register()
    const sampleTemperature = useBrewStore.getState().brew.gravitySampleTemperatureC

    const result = readResult(await tool('set_temperature_unit').execute({
      unit: 'fahrenheit',
    }))

    expect(result).toMatchObject({
      ok: true,
      data: { temperatureUnit: 'fahrenheit' },
    })
    expect(useBrewStore.getState()).toMatchObject({
      temperatureUnit: 'fahrenheit',
      brew: { gravitySampleTemperatureC: sampleTemperature },
      lastChange: { source: 'agent' },
    })
    expect(readResult(await tool('set_temperature_unit').execute({
      unit: 'kelvin',
    }))).toMatchObject({ ok: false, error: { code: 'INVALID_INPUT' } })
  })

  it('aborts in-flight registrations and permits a clean retry', async () => {
    const resolvers: Array<() => void> = []
    const signals: AbortSignal[] = []
    const registration = registerLabTools({
      registerTool: (_tool, options) => new Promise<void>((resolve) => {
        signals.push(options?.signal as AbortSignal)
        resolvers.push(resolve)
      }),
    })

    unregisterLabTools()
    expect(signals).toHaveLength(5)
    expect(signals.every((signal) => signal.aborted)).toBe(true)
    resolvers.forEach((resolve) => resolve())
    await registration

    const retry = await register()
    expect(retry.registered).toHaveLength(5)
  })
})
