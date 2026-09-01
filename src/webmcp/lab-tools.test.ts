import { describe, expect, it } from 'vitest'
import { createAmericanIpa } from '../domain/brew'
import { useBrewStore } from '../state/brew-store'
import { registerLabTools } from './lab-tools'

describe('registerLabTools', () => {
  it('updates the same current brew exposed by the UI', async () => {
    useBrewStore.setState({ brew: createAmericanIpa() })
    const tools: Array<{ name: string; execute: (input: unknown) => Promise<{ content: Array<{ text: string }> }> }> = []
    const registration = await registerLabTools({ registerTool: (tool) => { tools.push(tool) } })
    const update = tools.find((tool) => tool.name === 'update_current_brew')!

    let notified = false
    window.addEventListener('current-brew-updated', () => { notified = true }, { once: true })
    const result = await update.execute({ patch: { expectedFinalGravity: 1.014 }, reason: 'User changed it.' })

    expect(registration.supported).toBe(true)
    expect(useBrewStore.getState().brew.expectedFinalGravity).toBe(1.014)
    expect(JSON.parse(result.content[0].text).ok).toBe(true)
    expect(notified).toBe(true)
  })
})
