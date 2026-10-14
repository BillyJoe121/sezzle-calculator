import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import App from './App'

it('renders the page heading inside the main landmark', () => {
  render(<App />)
  expect(screen.getByRole('main')).toContainElement(
    screen.getByRole('heading', { level: 1, name: 'Calculator' }),
  )
})

it('renders the calculator form', () => {
  render(<App />)
  expect(screen.getByRole('group', { name: 'Operation' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Calculate' })).toBeInTheDocument()
  expect(screen.getByRole('status')).toBeInTheDocument()
})
