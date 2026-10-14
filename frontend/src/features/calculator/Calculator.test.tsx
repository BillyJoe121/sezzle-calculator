import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { contractExample, contractResponse } from '../../test/contractExamples'
import { server } from '../../test/server'
import { Calculator } from './Calculator'

const ENDPOINT = '/api/v1/calculations'
const IDLE_HINT = 'Enter the numbers, choose an operation and select Calculate.'

type User = ReturnType<typeof userEvent.setup>

function statusText() {
  return screen.getByRole('status').textContent?.replace(/\s+/g, ' ').trim()
}

async function fill(user: User, label: string, value: string) {
  await user.type(screen.getByLabelText(label), value)
}

async function pick(user: User, operation: string) {
  await user.click(screen.getByRole('radio', { name: operation }))
}

async function calculate(user: User) {
  await user.click(screen.getByRole('button', { name: 'Calculate' }))
}

/** Replaces the default handler with one that counts requests and answers from a fixture, or fails. */
function countRequests(exampleId?: string) {
  const counter = { count: 0 }
  server.use(
    http.post(ENDPOINT, () => {
      counter.count += 1
      return exampleId ? contractResponse(contractExample(exampleId)) : HttpResponse.error()
    }),
  )
  return counter
}

/** A handler that holds its response until `release` is called. */
function holdResponse(exampleId: string) {
  let release: () => void = () => {}
  const gate = new Promise<void>((resolve) => {
    release = resolve
  })
  server.use(
    http.post(ENDPOINT, async () => {
      await gate
      return contractResponse(contractExample(exampleId))
    }),
  )
  return release
}

function setup() {
  const user = userEvent.setup()
  render(<Calculator />)
  return user
}

describe('Calculator', () => {
  describe('calculating', () => {
    it('divides 10 by 4 and shows the expression and result in the status region', async () => {
      const user = setup()
      await fill(user, 'First number', '10')
      await pick(user, 'Divide')
      await fill(user, 'Divisor', '4')
      await calculate(user)

      await waitFor(() => expect(statusText()).toBe('10 ÷ 4 = 2.5'))
    })

    it('shows 0.1 + 0.2 as 0.3', async () => {
      const user = setup()
      await fill(user, 'First number', '0.1')
      await fill(user, 'Second number', '0.2')
      await calculate(user)

      await waitFor(() => expect(statusText()).toBe('0.1 + 0.2 = 0.3'))
    })

    it.each([
      { operation: 'Subtract', a: '10', b: '4.5', text: '10 − 4.5 = 5.5' },
      { operation: 'Multiply', a: '-3', b: '4', text: '-3 × 4 = -12' },
      { operation: 'Power', a: '2', b: '10', text: '2 ^ 10 = 1024' },
      { operation: 'Percentage', a: '15', b: '200', text: '15% of 200 = 30' },
    ])('sends $operation and shows "$text"', async ({ operation, a, b, text }) => {
      const user = setup()
      await pick(user, operation)
      const [first, second] = screen.getAllByRole('textbox')
      await user.type(first, a)
      await user.type(second, b)
      await calculate(user)

      await waitFor(() => expect(statusText()).toBe(text))
    })

    it('submits with Enter from a field', async () => {
      const user = setup()
      await fill(user, 'First number', '0.1')
      await fill(user, 'Second number', '0.2')
      await user.keyboard('{Enter}')

      await waitFor(() => expect(statusText()).toBe('0.1 + 0.2 = 0.3'))
    })
  })

  describe('operation-specific fields', () => {
    it.each([
      { operation: 'Divide', labels: ['Dividend', 'Divisor'] },
      { operation: 'Power', labels: ['Base', 'Exponent'] },
      { operation: 'Percentage', labels: ['Percent', 'Of'] },
      { operation: 'Square root', labels: ['Number'] },
    ])('labels the operands for $operation', async ({ operation, labels }) => {
      const user = setup()
      await pick(user, operation)

      expect(screen.getAllByRole('textbox')).toHaveLength(labels.length)
      for (const label of labels) expect(screen.getByLabelText(label)).toBeInTheDocument()
    })

    it('starts on Add with two operands', () => {
      setup()
      expect(screen.getByRole('radio', { name: 'Add' })).toBeChecked()
      expect(screen.getByLabelText('First number')).toBeInTheDocument()
      expect(screen.getByLabelText('Second number')).toBeInTheDocument()
    })

    it('hides operand B for square root and calculates sqrt 16 = 4', async () => {
      const user = setup()
      await pick(user, 'Square root')
      expect(screen.queryByLabelText('Second number')).not.toBeInTheDocument()
      await fill(user, 'Number', '16')
      await calculate(user)

      await waitFor(() => expect(statusText()).toBe('√16 = 4'))
    })

    it('ignores a stale invalid operand B when calculating a square root', async () => {
      const user = setup()
      await fill(user, 'First number', '16')
      await fill(user, 'Second number', 'abc')
      await pick(user, 'Square root')
      await calculate(user)

      await waitFor(() => expect(statusText()).toBe('√16 = 4'))
    })

    it('clears the operand B error when switching to square root', async () => {
      const user = setup()
      await fill(user, 'First number', '16')
      await calculate(user)
      expect(screen.getByLabelText('Second number')).toHaveAttribute('aria-invalid', 'true')

      await pick(user, 'Square root')
      await pick(user, 'Add')

      expect(screen.getByLabelText('Second number')).not.toHaveAttribute('aria-invalid')
      expect(document.getElementById('operand-b-error')).toBeNull()
    })
  })

  describe('validation', () => {
    it('shows an error next to each empty field, sends nothing and focuses the first one', async () => {
      const requests = countRequests('add-success')
      const user = setup()
      await calculate(user)

      const a = screen.getByLabelText('First number')
      const b = screen.getByLabelText('Second number')
      expect(a).toHaveAttribute('aria-invalid', 'true')
      expect(a).toHaveAttribute('aria-describedby', 'operand-a-error')
      expect(b).toHaveAttribute('aria-invalid', 'true')
      expect(b).toHaveAttribute('aria-describedby', 'operand-b-error')
      expect(document.getElementById('operand-a-error')).toHaveTextContent('Enter a number.')
      expect(document.getElementById('operand-b-error')).toHaveTextContent('Enter a number.')
      expect(a).toHaveFocus()
      expect(requests.count).toBe(0)
    })

    it('rejects abc with the format message and sends no request', async () => {
      const requests = countRequests('add-success')
      const user = setup()
      await fill(user, 'First number', 'abc')
      await fill(user, 'Second number', '1')
      await calculate(user)

      expect(document.getElementById('operand-a-error')).toHaveTextContent(
        'Enter a number such as 42, -2.5 or 1e3.',
      )
      expect(screen.getByLabelText('Second number')).not.toHaveAttribute('aria-invalid')
      expect(requests.count).toBe(0)
    })

    it('rejects a decimal comma, explains the dot and sends no request', async () => {
      const requests = countRequests('add-success')
      const user = setup()
      await fill(user, 'First number', '2,5')
      await fill(user, 'Second number', '1')
      await calculate(user)

      expect(document.getElementById('operand-a-error')).toHaveTextContent(
        'Remove commas and use a dot for decimals, for example 2.5.',
      )
      expect(requests.count).toBe(0)
    })

    it('focuses operand B when only B is invalid', async () => {
      const user = setup()
      await fill(user, 'First number', '1')
      await calculate(user)

      expect(screen.getByLabelText('First number')).not.toHaveAttribute('aria-invalid')
      expect(screen.getByLabelText('Second number')).toHaveFocus()
    })

    it('validates only operand A for square root', async () => {
      const user = setup()
      await pick(user, 'Square root')
      await calculate(user)

      expect(screen.getByLabelText('Number')).toHaveAttribute('aria-invalid', 'true')
      expect(screen.getByLabelText('Number')).toHaveFocus()
    })

    it('clears a field error as soon as the user types in that field', async () => {
      const user = setup()
      await calculate(user)
      await user.type(screen.getByLabelText('First number'), '1')

      expect(screen.getByLabelText('First number')).not.toHaveAttribute('aria-invalid')
      expect(document.getElementById('operand-a-error')).toBeNull()
      expect(screen.getByLabelText('Second number')).toHaveAttribute('aria-invalid', 'true')
    })

    it('sends the request once the fields are corrected', async () => {
      const user = setup()
      await fill(user, 'First number', 'abc')
      await fill(user, 'Second number', '0.2')
      await calculate(user)
      await user.clear(screen.getByLabelText('First number'))
      await user.type(screen.getByLabelText('First number'), '0.1')
      await calculate(user)

      await waitFor(() => expect(statusText()).toBe('0.1 + 0.2 = 0.3'))
    })
  })

  describe('server and network errors', () => {
    it.each([
      {
        name: 'division by zero',
        operation: 'Divide',
        operands: ['10', '0'],
        message: 'Division by zero is undefined. Use a divisor other than 0.',
      },
      {
        name: 'the square root of a negative number',
        operation: 'Square root',
        operands: ['-9'],
        message:
          'This operation has no real-number result for these numbers.',
      },
      {
        name: 'a result out of range',
        operation: 'Power',
        operands: ['10', '400'],
        message: 'The result is too large to represent. Try smaller numbers.',
      },
    ])('shows the mapped message for $name', async ({ operation, operands, message }) => {
      const user = setup()
      await pick(user, operation)
      const inputs = screen.getAllByRole('textbox')
      for (const [index, value] of operands.entries()) await user.type(inputs[index], value)
      await calculate(user)

      expect(await screen.findByRole('alert')).toHaveTextContent(message)
      expect(screen.getByRole('status')).toBeEmptyDOMElement()
    })

    it.each([
      {
        id: 'wrong-arity',
        message:
          'The server could not accept these numbers. Check them and try again.',
      },
      {
        id: 'unsupported-operation',
        message: 'The server does not support this operation. Reload the page and try again.',
      },
    ])('shows the mapped message for the $id response', async ({ id, message }) => {
      countRequests(id)
      const user = setup()
      await fill(user, 'First number', '1')
      await fill(user, 'Second number', '2')
      await calculate(user)

      expect(await screen.findByRole('alert')).toHaveTextContent(message)
    })

    it('shows the mapped message for an INTERNAL_ERROR problem and never its detail', async () => {
      server.use(
        http.post(ENDPOINT, () =>
          HttpResponse.json(
            {
              type: 'about:blank',
              title: 'Internal Server Error',
              status: 500,
              detail: 'stack trace goes here',
              code: 'INTERNAL_ERROR',
            },
            { status: 500, headers: { 'Content-Type': 'application/problem+json' } },
          ),
        ),
      )
      const user = setup()
      await fill(user, 'First number', '1')
      await fill(user, 'Second number', '2')
      await calculate(user)

      expect(await screen.findByRole('alert')).toHaveTextContent(
        'The server had an unexpected problem. Try again in a moment.',
      )
      expect(screen.queryByText(/stack trace/)).not.toBeInTheDocument()
    })

    it('shows the retryable network message and re-enables Calculate when the request fails', async () => {
      countRequests()
      const user = setup()
      await fill(user, 'First number', '1')
      await fill(user, 'Second number', '2')
      await calculate(user)

      expect(await screen.findByRole('alert')).toHaveTextContent(
        'Could not reach the calculation service. Check your connection and try again.',
      )
      expect(screen.getByRole('button', { name: 'Calculate' })).not.toHaveAttribute('aria-disabled')
    })

    it('replaces an error with the result of the next successful calculation', async () => {
      const user = setup()
      await pick(user, 'Divide')
      await fill(user, 'Dividend', '10')
      await fill(user, 'Divisor', '0')
      await calculate(user)
      await screen.findByRole('alert')

      await user.clear(screen.getByLabelText('Divisor'))
      await user.type(screen.getByLabelText('Divisor'), '4')
      await calculate(user)

      await waitFor(() => expect(statusText()).toBe('10 ÷ 4 = 2.5'))
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })
  })

  describe('loading state', () => {
    it('disables Calculate, marks it busy and announces Calculating… while the request is pending', async () => {
      const release = holdResponse('add-success')
      const user = setup()
      await fill(user, 'First number', '0.1')
      await fill(user, 'Second number', '0.2')
      await calculate(user)

      const button = screen.getByRole('button', { name: 'Calculate' })
      expect(button).toHaveAttribute('aria-disabled', 'true')
      expect(button).toHaveAttribute('aria-busy', 'true')
      expect(statusText()).toBe('Calculating…')

      release()
      await waitFor(() => expect(statusText()).toBe('0.1 + 0.2 = 0.3'))
      expect(button).not.toHaveAttribute('aria-disabled')
      expect(button).not.toHaveAttribute('aria-busy')
    })

    it('discards a pending result when Clear is pressed', async () => {
      const release = holdResponse('add-success')
      const user = setup()
      await fill(user, 'First number', '0.1')
      await fill(user, 'Second number', '0.2')
      await calculate(user)
      await user.click(screen.getByRole('button', { name: 'Clear' }))

      release()
      await new Promise((resolve) => setTimeout(resolve, 20))
      expect(statusText()).toBe(IDLE_HINT)
      expect(screen.getByRole('button', { name: 'Calculate' })).not.toHaveAttribute('aria-disabled')
    })
  })

  describe('keyboard', () => {
    it('fills A, picks Divide with the arrow keys, fills B and submits with Enter', async () => {
      const user = setup()
      await user.tab()
      expect(screen.getByLabelText('First number')).toHaveFocus()
      await user.keyboard('10')

      await user.tab()
      expect(screen.getByRole('radio', { name: 'Add' })).toHaveFocus()
      await user.keyboard('{ArrowRight}{ArrowRight}{ArrowRight}')
      expect(screen.getByRole('radio', { name: 'Divide' })).toBeChecked()

      await user.tab()
      expect(screen.getByLabelText('Divisor')).toHaveFocus()
      await user.keyboard('4{Enter}')

      await waitFor(() => expect(statusText()).toBe('10 ÷ 4 = 2.5'))
    })
  })

  describe('Clear', () => {
    it('resets values, operation and result, and focuses operand A', async () => {
      const user = setup()
      await pick(user, 'Divide')
      await fill(user, 'Dividend', '10')
      await fill(user, 'Divisor', '4')
      await calculate(user)
      await waitFor(() => expect(statusText()).toBe('10 ÷ 4 = 2.5'))

      await user.click(screen.getByRole('button', { name: 'Clear' }))

      expect(screen.getByRole('radio', { name: 'Add' })).toBeChecked()
      expect(screen.getByLabelText('First number')).toHaveValue('')
      expect(screen.getByLabelText('Second number')).toHaveValue('')
      expect(statusText()).toBe(IDLE_HINT)
      expect(screen.getByLabelText('First number')).toHaveFocus()
    })

    it('removes field errors and restores operand B after square root', async () => {
      const user = setup()
      await pick(user, 'Square root')
      await calculate(user)
      expect(screen.getByLabelText('Number')).toHaveAttribute('aria-invalid', 'true')

      await user.click(screen.getByRole('button', { name: 'Clear' }))

      expect(screen.getByLabelText('First number')).not.toHaveAttribute('aria-invalid')
      expect(screen.getByLabelText('Second number')).toBeInTheDocument()
      expect(document.getElementById('operand-a-error')).toBeNull()
      expect(screen.getByLabelText('First number')).toHaveFocus()
    })

    it('clears an error result', async () => {
      const user = setup()
      await pick(user, 'Divide')
      await fill(user, 'Dividend', '10')
      await fill(user, 'Divisor', '0')
      await calculate(user)
      await screen.findByRole('alert')

      await user.click(screen.getByRole('button', { name: 'Clear' }))

      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })
  })
})
