import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http } from 'msw'
import { describe, expect, it } from 'vitest'
import { contractExample, contractResponse } from '../../test/contractExamples'
import { server } from '../../test/server'
import { Calculator } from './Calculator'

function setup() {
  const user = userEvent.setup()
  render(<Calculator />)
  return user
}

describe('Calculator accessibility', () => {
  it('announces field errors even when focus stays in the field', async () => {
    const user = setup()
    await user.click(screen.getByLabelText('First number'))
    await user.keyboard('{Enter}')

    const alerts = screen.getAllByRole('alert')
    expect(alerts.map((alert) => alert.textContent)).toEqual(['Enter a number.', 'Enter a number.'])
    expect(screen.getByLabelText('First number')).toHaveFocus()
  })

  it('keeps focus on Calculate while pending and sends one request for repeated activations', async () => {
    let requests = 0
    let release: () => void = () => {}
    const gate = new Promise<void>((resolve) => {
      release = resolve
    })
    server.use(
      http.post('/api/v1/calculations', async () => {
        requests += 1
        await gate
        return contractResponse(contractExample('add-success'))
      }),
    )
    const user = setup()
    await user.type(screen.getByLabelText('First number'), '0.1')
    await user.type(screen.getByLabelText('Second number'), '0.2')
    const button = screen.getByRole('button', { name: 'Calculate' })
    button.focus()
    await user.keyboard('{Enter}')
    await user.keyboard('{Enter}')
    await user.keyboard(' ')

    expect(button).toHaveFocus()
    expect(button).not.toBeDisabled()
    expect(button).toHaveAttribute('aria-disabled', 'true')

    release()
    await waitFor(() => expect(button).not.toHaveAttribute('aria-disabled'))
    expect(button).toHaveFocus()
    expect(requests).toBe(1)
  })
})
