import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { createAmericanIpa } from './domain/brew'
import { useBrewStore } from './state/brew-store'
import App from './App'

describe('App', () => {
  beforeEach(() => { useBrewStore.setState({ brew: createAmericanIpa() }) })

  it('loads a selected recipe into the visible current brew', () => {
    render(<App />)

    fireEvent.change(screen.getByLabelText('Demo recipe'), { target: { value: 'czech-pilsner' } })
    fireEvent.click(screen.getByRole('button', { name: 'Load into Current Brew' }))

    expect(screen.getByRole('heading', { name: 'Czech Pilsner' })).toBeTruthy()
    expect(screen.getByText('IBU')).toBeTruthy()
  })
})
