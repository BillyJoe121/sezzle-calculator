import { describe, expect, it } from 'vitest'
import { ERROR_CODES } from '../../api/types'
import type { CalculatorError, CalculatorErrorKind } from '../../api/types'
import { errorMessage } from './errorMessages'

const UNEXPECTED_TEXT = 'The server sent a response the calculator could not read. Try again.'

describe('errorMessage', () => {
  it.each(ERROR_CODES)('returns a message for the %s code', (code) => {
    const message = errorMessage({ kind: 'problem', code, message: 'diagnostic' })
    expect(message).not.toBe('')
    expect(message).not.toBe('diagnostic')
  })

  it('gives each code its own message', () => {
    const messages = ERROR_CODES.map((code) => errorMessage({ kind: 'problem', code, message: '' }))
    expect(new Set(messages).size).toBe(ERROR_CODES.length)
  })

  it('explains division by zero', () => {
    const error: CalculatorError = { kind: 'problem', code: 'DIVISION_BY_ZERO', message: '' }
    expect(errorMessage(error)).toBe('Division by zero is undefined. Use a divisor other than 0.')
  })

  it.each<[CalculatorErrorKind, string]>([
    ['network', 'Could not reach the calculation service. Check your connection and try again.'],
    ['timeout', 'The server took too long to respond. Try again.'],
    ['unexpected', UNEXPECTED_TEXT],
    ['aborted', 'The calculation was cancelled.'],
  ])('maps the %s kind when there is no code', (kind, expected) => {
    expect(errorMessage({ kind, message: 'diagnostic' })).toBe(expected)
  })

  it('falls back to the unexpected text for a problem without a code', () => {
    expect(errorMessage({ kind: 'problem', message: 'diagnostic' })).toBe(UNEXPECTED_TEXT)
  })

  it('prefers the code over the kind', () => {
    const error: CalculatorError = { kind: 'network', code: 'INTERNAL_ERROR', message: '' }
    expect(errorMessage(error)).toBe('The server had an unexpected problem. Try again in a moment.')
  })
})
