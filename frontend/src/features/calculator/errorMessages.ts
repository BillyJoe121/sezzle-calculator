import type { CalculatorError, CalculatorErrorKind, ErrorCode } from '../../api/types'

// User-facing copy. Server `detail` text is never shown: it is not a stable part of the contract.
const BY_CODE: Record<ErrorCode, string> = {
  INVALID_JSON: 'The calculator sent a request the server could not read. Reload the page and try again.',
  UNSUPPORTED_OPERATION: 'The server does not support this operation. Reload the page and try again.',
  INVALID_OPERANDS:
    'The server could not accept these numbers. Check that each one is a finite number and try again.',
  NOT_FOUND: 'The calculation service is not available at this address. Reload the page and try again.',
  METHOD_NOT_ALLOWED: 'The calculation service rejected the request. Reload the page and try again.',
  PAYLOAD_TOO_LARGE: 'The request is too large for the server. Use shorter numbers.',
  UNSUPPORTED_MEDIA_TYPE:
    'The calculator sent the request in a format the server does not accept. Reload the page and try again.',
  DIVISION_BY_ZERO: 'Division by zero is undefined. Use a divisor other than 0.',
  DOMAIN_ERROR:
    'This operation has no real-number result for these inputs, such as the square root of a negative number.',
  RESULT_OUT_OF_RANGE: 'The result is too large to represent. Try smaller numbers.',
  INTERNAL_ERROR: 'The server had an unexpected problem. Try again in a moment.',
}

const UNEXPECTED = 'The server sent a response the calculator could not read. Try again.'

const BY_KIND: Record<CalculatorErrorKind, string> = {
  // A problem without a known code is a response the client cannot interpret.
  problem: UNEXPECTED,
  network: 'Could not reach the calculation service. Check your connection and try again.',
  timeout: 'The server took too long to respond. Try again.',
  unexpected: UNEXPECTED,
  aborted: 'The calculation was cancelled.',
}

export function errorMessage(error: CalculatorError): string {
  return error.code ? BY_CODE[error.code] : BY_KIND[error.kind]
}
