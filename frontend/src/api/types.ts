// Mirrors docs/api/openapi.yaml. The contract is the source of truth; change it there first.

export const OPERATIONS = [
  'add',
  'subtract',
  'multiply',
  'divide',
  'power',
  'sqrt',
  'percentage',
] as const

export type Operation = (typeof OPERATIONS)[number]

export const ERROR_CODES = [
  'INVALID_JSON',
  'UNSUPPORTED_OPERATION',
  'INVALID_OPERANDS',
  'NOT_FOUND',
  'METHOD_NOT_ALLOWED',
  'PAYLOAD_TOO_LARGE',
  'UNSUPPORTED_MEDIA_TYPE',
  'DIVISION_BY_ZERO',
  'DOMAIN_ERROR',
  'RESULT_OUT_OF_RANGE',
  'INTERNAL_ERROR',
] as const

export type ErrorCode = (typeof ERROR_CODES)[number]

export interface CalculationRequest {
  operation: Operation
  operands: number[]
}

export interface CalculationResponse {
  operation: Operation
  operands: number[]
  result: number
}

/** RFC 9457 problem details. Clients branch on `code` only; `detail` is not stable. */
export interface Problem {
  type: string
  title: string
  status: number
  detail: string
  code: ErrorCode
}

/**
 * Why a calculation did not produce a value:
 * - problem: the server answered with a problem document carrying a known `code`;
 * - network: the request never got a response;
 * - timeout: no response within the client timeout;
 * - unexpected: a response the client cannot interpret (wrong shape, not JSON, no problem body);
 * - aborted: the caller cancelled the request.
 */
export type CalculatorErrorKind = 'problem' | 'network' | 'timeout' | 'unexpected' | 'aborted'

export interface CalculatorError {
  kind: CalculatorErrorKind
  code?: ErrorCode
  /** Diagnostic text for developers. User-facing copy comes from errorMessages.ts. */
  message: string
}

export type CalculateResult =
  | { ok: true; value: CalculationResponse }
  | { ok: false; error: CalculatorError }
