export const MAX_OPERAND_LENGTH = 32

export type ParseResult = { ok: true; value: number } | { ok: false; message: string }

const NUMBER_PATTERN = /^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/

function reject(message: string): ParseResult {
  return { ok: false, message }
}

/** Turns the text of an operand field into a finite number, or the message to show next to the field. */
export function parseOperand(raw: string): ParseResult {
  const text = raw.trim()
  if (text === '') return reject('Enter a number.')
  if (text.length > MAX_OPERAND_LENGTH) return reject('Use 32 characters or fewer.')
  if (text.includes(',')) return reject('Use a dot for decimals, for example 2.5.')
  if (!NUMBER_PATTERN.test(text)) return reject('Enter a number such as 42, -2.5 or 1e3.')
  const value = Number(text)
  if (!Number.isFinite(value)) return reject('This number is too large to calculate with.')
  return { ok: true, value }
}
