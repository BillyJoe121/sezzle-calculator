import { describe, expect, it } from 'vitest'
import { formatNumber } from './formatNumber'

describe('formatNumber', () => {
  it.each([
    ['positive zero', 0, '0'],
    ['negative zero', -0, '0'],
    ['a float sum artifact', 0.30000000000000004, '0.3'],
    ['a plain decimal', 2.5, '2.5'],
    ['a negative integer', -12, '-12'],
    ['a power of two', 1024, '1024'],
    ['one third rounded to 12 digits', 1 / 3, '0.333333333333'],
    ['two thirds rounded up at 12 digits', 2 / 3, '0.666666666667'],
    ['the smallest plain magnitude', 0.000001, '0.000001'],
    ['just below the plain range', 9.99e-7, '9.99e-7'],
    ['a negative number below the plain range', -1e-7, '-1e-7'],
    ['the largest 12-digit integer', 999999999999, '999999999999'],
    ['a value that rounds up to 1e12', 999999999999.9, '1e+12'],
    ['exactly 1e12', 1e12, '1e+12'],
    ['a 15-digit integer', 123456789012345, '1.23456789012e+14'],
    ['the largest finite double', 1.7976931348623157e308, '1.79769313486e+308'],
    ['a negative large number', -1e12, '-1e+12'],
  ])('formats %s', (_name, value, expected) => {
    expect(formatNumber(value)).toBe(expected)
  })
})
