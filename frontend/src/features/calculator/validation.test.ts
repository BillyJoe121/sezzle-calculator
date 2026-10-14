import { describe, expect, it } from 'vitest'
import { MAX_OPERAND_LENGTH, parseOperand } from './validation'

describe('parseOperand', () => {
  it.each([
    ['an integer', '42', 42],
    ['a negative decimal', '-2.5', -2.5],
    ['a leading plus sign', '+7', 7],
    ['a leading dot', '.5', 0.5],
    ['a trailing dot', '5.', 5],
    ['an exponent', '1e3', 1000],
    ['an uppercase signed exponent', '2E-2', 0.02],
    ['surrounding whitespace', '  8  ', 8],
    ['zero', '0', 0],
    ['the maximum length', '1'.repeat(MAX_OPERAND_LENGTH), Number('1'.repeat(MAX_OPERAND_LENGTH))],
  ])('accepts %s', (_name, raw, value) => {
    expect(parseOperand(raw)).toEqual({ ok: true, value })
  })

  it.each([
    ['an empty string', '', 'Enter a number.'],
    ['only whitespace', '   ', 'Enter a number.'],
    ['more than 32 characters', '1'.repeat(MAX_OPERAND_LENGTH + 1), 'Use 32 characters or fewer.'],
    ['a decimal comma', '2,5', 'Remove commas and use a dot for decimals, for example 2.5.'],
    ['a thousands comma', '1,000', 'Remove commas and use a dot for decimals, for example 2.5.'],
    ['letters', 'abc', 'Enter a number such as 42, -2.5 or 1e3.'],
    ['Infinity', 'Infinity', 'Enter a number such as 42, -2.5 or 1e3.'],
    ['NaN', 'NaN', 'Enter a number such as 42, -2.5 or 1e3.'],
    ['a space inside', '1 2', 'Enter a number such as 42, -2.5 or 1e3.'],
    ['a lone dot', '.', 'Enter a number such as 42, -2.5 or 1e3.'],
    ['a lone sign', '-', 'Enter a number such as 42, -2.5 or 1e3.'],
    ['a hexadecimal literal', '0x10', 'Enter a number such as 42, -2.5 or 1e3.'],
    ['an exponent without digits', '1e', 'Enter a number such as 42, -2.5 or 1e3.'],
    ['a number beyond double range', '1e400', 'This number is too large to calculate with. Use a smaller number.'],
    ['a negative number beyond double range', '-1e400', 'This number is too large to calculate with. Use a smaller number.'],
  ])('rejects %s', (_name, raw, message) => {
    expect(parseOperand(raw)).toEqual({ ok: false, message })
  })

  it('checks length before the comma rule', () => {
    expect(parseOperand(`${'1'.repeat(MAX_OPERAND_LENGTH)},5`)).toEqual({
      ok: false,
      message: 'Use 32 characters or fewer.',
    })
  })
})
