import {
  ERROR_CODES,
  OPERATIONS,
  type CalculateResult,
  type CalculationRequest,
  type CalculationResponse,
  type CalculatorError,
  type ErrorCode,
} from './types'

export const REQUEST_TIMEOUT_MS = 8000

const ENDPOINT = '/api/v1/calculations'

function fail(kind: CalculatorError['kind'], message: string, code?: ErrorCode): CalculateResult {
  return { ok: false, error: code ? { kind, code, message } : { kind, message } }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isOperation(value: unknown): value is CalculationResponse['operation'] {
  return OPERATIONS.some((operation) => operation === value)
}

function isErrorCode(value: unknown): value is ErrorCode {
  return ERROR_CODES.some((code) => code === value)
}

function isCalculationResponse(value: unknown): value is CalculationResponse {
  return (
    isRecord(value) &&
    isOperation(value.operation) &&
    Array.isArray(value.operands) &&
    (value.operands.length === 1 || value.operands.length === 2) &&
    value.operands.every(isFiniteNumber) &&
    isFiniteNumber(value.result)
  )
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return undefined
  }
}

// The response must describe the calculation that was sent, or the UI would render a mismatched expression.
function answers(request: CalculationRequest, body: CalculationResponse): boolean {
  return body.operation === request.operation && body.operands.length === request.operands.length
}

function interpret(request: CalculationRequest, status: number, text: string): CalculateResult {
  const body = parseJson(text)
  if (status >= 200 && status < 300) {
    return isCalculationResponse(body) && answers(request, body)
      ? { ok: true, value: body }
      : fail('unexpected', `HTTP ${status} with an unrecognised body`)
  }
  if (isRecord(body) && isErrorCode(body.code)) {
    return fail('problem', `HTTP ${status} ${body.code}`, body.code)
  }
  return fail('unexpected', `HTTP ${status} without a recognised problem body`)
}

/** Sends one calculation. Never throws or rejects: every failure becomes a CalculatorError. */
export async function calculate(request: CalculationRequest, signal?: AbortSignal): Promise<CalculateResult> {
  if (signal?.aborted) return fail('aborted', 'Request cancelled before it was sent')

  const controller = new AbortController()
  let timedOut = false
  const onCallerAbort = () => controller.abort()
  const timer = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, REQUEST_TIMEOUT_MS)
  signal?.addEventListener('abort', onCallerAbort, { once: true })

  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, application/problem+json',
      },
      body: JSON.stringify({ operation: request.operation, operands: request.operands }),
      signal: controller.signal,
    })
    return interpret(request, response.status, await response.text())
  } catch (error) {
    if (timedOut) return fail('timeout', `No response within ${REQUEST_TIMEOUT_MS} ms`)
    if (signal?.aborted) return fail('aborted', 'Request cancelled')
    return fail('network', error instanceof Error ? error.message : 'Network request failed')
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', onCallerAbort)
  }
}
