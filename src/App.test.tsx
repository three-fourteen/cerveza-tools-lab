import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createAmericanIpa } from './domain/brew'
import { useBrewStore } from './state/brew-store'
import { unregisterLabTools } from './webmcp/lab-tools'
import App from './App'

describe('App', () => {
  beforeEach(() => {
    useBrewStore.setState({
      brew: createAmericanIpa(),
      temperatureUnit: 'celsius',
      syncVersion: 0,
      lastChange: undefined,
    })
  })

  afterEach(() => {
    cleanup()
    unregisterLabTools()
  })

  it('loads a selected recipe into the visible current brew', () => {
    render(<App />)

    fireEvent.change(screen.getByLabelText('Demo recipe'), { target: { value: 'czech-pilsner' } })
    fireEvent.click(screen.getByRole('button', { name: 'Load into Current Brew' }))

    expect(screen.getByRole('heading', { name: 'Czech Pilsner' })).toBeTruthy()
    expect(screen.getByText('IBU')).toBeTruthy()
  })

  it('keeps the last valid volume while the required input is blank', () => {
    render(<App />)

    fireEvent.change(screen.getByLabelText('Batch volume (L)'), { target: { value: '' } })

    expect(screen.getByRole('alert').textContent).toContain('Batch volume (L) is required')
    expect(useBrewStore.getState().brew.batchVolumeLiters).toBe(20)
    expect(screen.getByText('48.4')).toBeTruthy()

    act(() => {
      useBrewStore.getState().updateBrew(
        { batchVolumeLiters: 20 },
        { source: 'agent' },
      )
    })
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('shows the field and value changed by an agent', () => {
    render(<App />)

    act(() => {
      useBrewStore.getState().updateBrew(
        { originalGravity: 1.058 },
        { source: 'agent', reason: 'Applied corrected reading.' },
      )
    })

    const agentStatus = screen.getByText('Updated by agent').closest('[role="status"]')
    expect(agentStatus?.textContent).toContain(
      'originalGravity: 1.05 → 1.058',
    )
    expect(agentStatus?.textContent).toContain('Applied corrected reading.')

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }))
    expect(screen.queryByText('Updated by agent')).toBeNull()
  })

  it('renders a hop-free recipe as an empty schedule', () => {
    const hopFreeBrew = createAmericanIpa()
    hopFreeBrew.hops = []
    useBrewStore.setState({ brew: hopFreeBrew, lastChange: undefined })

    render(<App />)

    expect(screen.getByText('No hop additions.')).toBeTruthy()
  })

  it('converts temperature display units while storing Celsius', () => {
    render(<App />)

    fireEvent.change(screen.getByLabelText('Temperature unit'), {
      target: { value: 'fahrenheit' },
    })

    expect((screen.getByLabelText('Sample temperature (°F)') as HTMLInputElement).value)
      .toBe('82.4')
    expect((screen.getByLabelText('Hydrometer calibration (°F)') as HTMLInputElement).value)
      .toBe('68')
    expect(screen.getByText(/Temperatures shown in °F/)).toBeTruthy()

    fireEvent.change(screen.getByLabelText('Sample temperature (°F)'), {
      target: { value: '86' },
    })
    expect(useBrewStore.getState().brew.gravitySampleTemperatureC).toBe(30)
  })

  it('explicitly applies the corrected reading to canonical OG', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'Apply to Current OG' }))

    expect(useBrewStore.getState().brew.originalGravity).toBe(1.058)
    expect((
      screen.getByRole('button', { name: 'Corrected reading applied' }) as HTMLButtonElement
    ).disabled).toBe(true)
    expect(screen.getByText(/Applied to Current OG/)).toBeTruthy()
    expect(screen.getByText('6.31 %')).toBeTruthy()
  })

  it('preserves agent-applied dilution values when editing Expected FG', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'Apply to Current OG' }))
    expect(useBrewStore.getState().brew.originalGravity).toBe(1.058)

    act(() => {
      useBrewStore.getState().updateBrew(
        { batchVolumeLiters: 23.2, originalGravity: 1.05 },
        { source: 'agent', reason: 'Applied dilution.' },
      )
    })

    fireEvent.change(screen.getByLabelText('Expected FG'), { target: { value: '1.014' } })

    expect(useBrewStore.getState().brew).toMatchObject({
      batchVolumeLiters: 23.2,
      originalGravity: 1.05,
      expectedFinalGravity: 1.014,
    })
    expect((screen.getByLabelText('Current OG') as HTMLInputElement).value).toBe('1.05')
  })
})
