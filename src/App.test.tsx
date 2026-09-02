import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createAmericanIpa } from './domain/brew'
import { useBrewStore } from './state/brew-store'
import { unregisterLabTools } from './webmcp/lab-tools'
import App from './App'

describe('App', () => {
  beforeEach(() => {
    useBrewStore.setState({ brew: createAmericanIpa(), lastChange: undefined })
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

    expect(screen.getByRole('status').textContent).toContain(
      'originalGravity: 1.05 → 1.058',
    )
    expect(screen.getByRole('status').textContent).toContain('Applied corrected reading.')

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }))
    expect(screen.getByRole('status').textContent).toBe('')
  })

  it('renders a hop-free recipe as an empty schedule', () => {
    const hopFreeBrew = createAmericanIpa()
    hopFreeBrew.hops = []
    useBrewStore.setState({ brew: hopFreeBrew, lastChange: undefined })

    render(<App />)

    expect(screen.getByText('No hop additions.')).toBeTruthy()
  })
})
