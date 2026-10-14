import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { CalculatorError, CalculationResponse } from '../../api/types'
import { ResultPanel } from './ResultPanel'
import type { CalculatorState } from './useCalculator'

function success(calculation: CalculationResponse): CalculatorState {
  return { status: 'success', calculation }
}

function failure(error: CalculatorError): CalculatorState {
  return { status: 'error', error }
}

function statusText() {
  return screen.getByRole('status').textContent?.replace(/\s+/g, ' ').trim()
}

describe('ResultPanel', () => {
  it('shows a hint in the status region when idle', () => {
    render(<ResultPanel state={{ status: 'idle' }} />)
    expect(screen.getByRole('status')).toHaveTextContent(
      'Enter the numbers, choose an operation and select Calculate.',
    )
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('says it is calculating while submitting', () => {
    render(<ResultPanel state={{ status: 'submitting' }} />)
    expect(screen.getByRole('status')).toHaveTextContent('Calculating…')
  })

  it.each([
    { operation: 'divide', operands: [10, 4], result: 2.5, text: '10 ÷ 4 = 2.5' },
    { operation: 'sqrt', operands: [16], result: 4, text: '√16 = 4' },
    { operation: 'percentage', operands: [15, 200], result: 30, text: '15% of 200 = 30' },
    { operation: 'subtract', operands: [10, -4], result: 14, text: '10 − (-4) = 14' },
    { operation: 'power', operands: [-2, -1], result: -0.5, text: '-2 ^ (-1) = -0.5' },
  ] as const)('reads "$text" for a successful $operation', ({ operation, operands, result, text }) => {
    render(<ResultPanel state={success({ operation, operands: [...operands], result })} />)
    expect(statusText()).toBe(text)
  })

  it('splits the expression and the value into their own elements', () => {
    render(<ResultPanel state={success({ operation: 'divide', operands: [10, 4], result: 2.5 })} />)
    expect(screen.getByText('10 ÷ 4 =')).toHaveClass('result-expression')
    expect(screen.getByText('2.5')).toHaveClass('result-value')
  })

  it('displays 0.30000000000000004 as 0.3', () => {
    render(
      <ResultPanel
        state={success({ operation: 'add', operands: [0.1, 0.2], result: 0.30000000000000004 })}
      />,
    )
    expect(statusText()).toBe('0.1 + 0.2 = 0.3')
  })

  it('shows the mapped message in an alert for a problem error, never the diagnostic text', () => {
    render(
      <ResultPanel
        state={failure({ kind: 'problem', code: 'DIVISION_BY_ZERO', message: 'raw server detail' })}
      />,
    )
    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent('Division by zero is undefined. Use a divisor other than 0.')
    expect(alert).toHaveClass('result-error')
    expect(screen.queryByText(/raw server detail/)).not.toBeInTheDocument()
  })

  it('keeps the alert outside the status region and leaves the status empty on error', () => {
    render(<ResultPanel state={failure({ kind: 'problem', code: 'DOMAIN_ERROR', message: 'x' })} />)
    expect(screen.getByRole('status')).toBeEmptyDOMElement()
    expect(screen.getByRole('status')).not.toContainElement(screen.getByRole('alert'))
  })

  it('shows the network message when the service cannot be reached', () => {
    render(<ResultPanel state={failure({ kind: 'network', message: 'Failed to fetch' })} />)
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Could not reach the calculation service. Check your connection and try again.',
    )
  })

  it('renders no alert for an aborted request', () => {
    render(<ResultPanel state={failure({ kind: 'aborted', message: 'aborted' })} />)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toBeEmptyDOMElement()
  })

  it('declares a polite, atomic live region', () => {
    render(<ResultPanel state={{ status: 'idle' }} />)
    const status = screen.getByRole('status')
    expect(status).toHaveAttribute('aria-live', 'polite')
    expect(status).toHaveAttribute('aria-atomic', 'true')
  })

  it('keeps the same status element across state changes', () => {
    const { rerender } = render(<ResultPanel state={{ status: 'idle' }} />)
    const status = screen.getByRole('status')

    rerender(<ResultPanel state={{ status: 'submitting' }} />)
    expect(screen.getByRole('status')).toBe(status)

    rerender(<ResultPanel state={success({ operation: 'sqrt', operands: [16], result: 4 })} />)
    expect(screen.getByRole('status')).toBe(status)

    rerender(<ResultPanel state={failure({ kind: 'timeout', message: 'slow' })} />)
    expect(screen.getByRole('status')).toBe(status)
  })
})
