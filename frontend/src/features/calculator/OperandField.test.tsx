import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { OperandField } from './OperandField'

const base = { id: 'operand-a', label: 'First number', value: '', onChange: () => {} }

describe('OperandField', () => {
  it('associates the visible label with the input', () => {
    render(<OperandField {...base} />)
    expect(screen.getByLabelText('First number')).toBe(screen.getByRole('textbox'))
  })

  it('asks mobile keyboards for decimal input without turning off text entry', () => {
    render(<OperandField {...base} />)
    const input = screen.getByLabelText('First number')
    expect(input).toHaveAttribute('type', 'text')
    expect(input).toHaveAttribute('inputmode', 'decimal')
    expect(input).toHaveAttribute('autocomplete', 'off')
    expect(input).toHaveAttribute('spellcheck', 'false')
  })

  it('shows the value it is given', () => {
    render(<OperandField {...base} value="-2.5" />)
    expect(screen.getByLabelText('First number')).toHaveValue('-2.5')
  })

  it('wires the error message to the input', () => {
    render(<OperandField {...base} error="Enter a number." />)
    const input = screen.getByLabelText('First number')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAttribute('aria-describedby', 'operand-a-error')
    expect(screen.getByText('Enter a number.')).toHaveAttribute('id', 'operand-a-error')
    expect(input).toHaveAccessibleDescription('Enter a number.')
  })

  it('has no invalid state or description without an error', () => {
    render(<OperandField {...base} />)
    const input = screen.getByLabelText('First number')
    expect(input).not.toHaveAttribute('aria-invalid')
    expect(input).not.toHaveAttribute('aria-describedby')
    expect(screen.queryByText(/./, { selector: 'p' })).not.toBeInTheDocument()
  })

  it('reports typed text through onChange', async () => {
    const onChange = vi.fn()
    render(<OperandField {...base} onChange={onChange} />)
    await userEvent.type(screen.getByLabelText('First number'), '7')
    expect(onChange).toHaveBeenCalledWith('7')
  })

  it('forwards the ref to the input', () => {
    const ref = { current: null as HTMLInputElement | null }
    render(<OperandField {...base} ref={ref} />)
    expect(ref.current).toBe(screen.getByLabelText('First number'))
  })
})
