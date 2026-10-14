import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import type { Operation } from '../../api/types'
import { OperationPicker } from './OperationPicker'

function Harness({ initial = 'add' }: { initial?: Operation }) {
  const [value, setValue] = useState<Operation>(initial)
  return <OperationPicker value={value} onChange={setValue} />
}

describe('OperationPicker', () => {
  it('renders seven radios inside a group named Operation', () => {
    render(<OperationPicker value="add" onChange={() => {}} />)
    const group = screen.getByRole('group', { name: 'Operation' })
    expect(within(group).getAllByRole('radio')).toHaveLength(7)
    for (const name of ['Add', 'Subtract', 'Multiply', 'Divide', 'Power', 'Square root', 'Percentage']) {
      expect(within(group).getByRole('radio', { name })).toBeInTheDocument()
    }
  })

  it('marks only the current operation as checked', () => {
    render(<OperationPicker value="divide" onChange={() => {}} />)
    expect(screen.getByRole('radio', { name: 'Divide' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'Add' })).not.toBeChecked()
  })

  it('calls onChange with the operation id when an option is clicked', async () => {
    const onChange = vi.fn()
    render(<OperationPicker value="add" onChange={onChange} />)
    await userEvent.click(screen.getByRole('radio', { name: 'Divide' }))
    expect(onChange).toHaveBeenCalledWith('divide')
  })

  it('focuses the checked radio on Tab and moves selection with the arrow keys', async () => {
    const user = userEvent.setup()
    render(<Harness initial="add" />)

    await user.tab()
    expect(screen.getByRole('radio', { name: 'Add' })).toHaveFocus()

    await user.keyboard('{ArrowRight}')
    expect(screen.getByRole('radio', { name: 'Subtract' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'Subtract' })).toHaveFocus()

    await user.keyboard('{ArrowDown}')
    expect(screen.getByRole('radio', { name: 'Multiply' })).toBeChecked()

    await user.keyboard('{ArrowLeft}')
    expect(screen.getByRole('radio', { name: 'Subtract' })).toBeChecked()
  })

  it('hides the symbol from assistive technology', () => {
    render(<OperationPicker value="add" onChange={() => {}} />)
    const symbol = screen.getByRole('radio', { name: 'Divide' }).closest('label')?.querySelector('[aria-hidden]')
    expect(symbol).toHaveTextContent('÷')
    expect(symbol).toHaveAttribute('aria-hidden', 'true')
  })
})
