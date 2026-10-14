import { delay, http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { clientExamples } from '../test/contractExamples'
import { server } from '../test/server'
import { calculate, REQUEST_TIMEOUT_MS } from './calculatorClient'
import type { CalculationRequest } from './types'

const request: CalculationRequest = { operation: 'add', operands: [1, 2] }
const URL = '/api/v1/calculations'

function failure(result: Awaited<ReturnType<typeof calculate>>) {
  if (result.ok) throw new Error('Expected a failure')
  return result.error
}

afterEach(() => {
  vi.useRealTimers()
})

describe('calculate against the contract examples', () => {
  const successes = clientExamples.filter((example) => example.response.status < 300)
  const problems = clientExamples.filter((example) => example.response.status >= 300)

  it.each(successes.map((example) => [example.id, example] as const))('returns the value for %s', async (_id, example) => {
    const result = await calculate(example.request.body as CalculationRequest)
    expect(result).toEqual({ ok: true, value: example.response.body })
  })

  it.each(problems.map((example) => [example.id, example] as const))('returns a problem error for %s', async (_id, example) => {
    const error = failure(await calculate(example.request.body as CalculationRequest))
    expect(error.kind).toBe('problem')
    expect(error.code).toBe((example.response.body as { code: string }).code)
  })
})

describe('calculate request', () => {
  it('posts JSON with the documented method, headers and body', async () => {
    let seen: { method: string; contentType: string | null; accept: string | null; body: string } | undefined
    server.use(
      http.post(URL, async ({ request: req }) => {
        seen = {
          method: req.method,
          contentType: req.headers.get('Content-Type'),
          accept: req.headers.get('Accept'),
          body: await req.text(),
        }
        return HttpResponse.json({ operation: 'add', operands: [1, 2], result: 3 })
      }),
    )
    await calculate(request)
    expect(seen).toEqual({
      method: 'POST',
      contentType: 'application/json',
      accept: 'application/json, application/problem+json',
      body: '{"operation":"add","operands":[1,2]}',
    })
  })
})

describe('calculate failures', () => {
  it('reports an unexpected error for a 500 with an empty body', async () => {
    server.use(http.post(URL, () => new HttpResponse(null, { status: 500 })))
    expect(failure(await calculate(request)).kind).toBe('unexpected')
  })

  it('reports an unexpected error for an HTML error page', async () => {
    server.use(http.post(URL, () => HttpResponse.html('<h1>Bad gateway</h1>', { status: 502 })))
    expect(failure(await calculate(request)).kind).toBe('unexpected')
  })

  it('reports an unexpected error for a problem with an unknown code', async () => {
    server.use(http.post(URL, () => HttpResponse.json({ status: 422, code: 'SOMETHING_NEW' }, { status: 422 })))
    expect(failure(await calculate(request)).kind).toBe('unexpected')
  })

  it('reports a network error when the request fails', async () => {
    server.use(http.post(URL, () => HttpResponse.error()))
    expect(failure(await calculate(request)).kind).toBe('network')
  })

  it('reports an unexpected error for a 200 that is not JSON', async () => {
    server.use(http.post(URL, () => HttpResponse.html('<p>hello</p>')))
    expect(failure(await calculate(request)).kind).toBe('unexpected')
  })

  it.each([
    ['a string result', { operation: 'add', operands: [1, 2], result: '3' }],
    ['a missing result', { operation: 'add', operands: [1, 2] }],
    ['a null result', { operation: 'add', operands: [1, 2], result: null }],
    ['an unknown operation', { operation: 'modulo', operands: [1, 2], result: 3 }],
    ['operands that are not an array', { operation: 'add', operands: 'x', result: 3 }],
    ['no operands', { operation: 'add', operands: [], result: 3 }],
    ['three operands', { operation: 'add', operands: [1, 2, 3], result: 3 }],
    ['a non-numeric operand', { operation: 'add', operands: [1, 'b'], result: 3 }],
    ['a null body', null],
    ['an array body', [1, 2]],
  ])('reports an unexpected error for a 200 with %s', async (_name, body) => {
    server.use(http.post(URL, () => HttpResponse.json(body)))
    expect(failure(await calculate(request)).kind).toBe('unexpected')
  })

  it('describes a response for other operands as unexpected', async () => {
    server.use(http.post(URL, () => HttpResponse.json({ operation: 'add', operands: [1], result: 1 })))
    expect(failure(await calculate(request)).kind).toBe('unexpected')
  })

  it('describes a response for another operation as unexpected', async () => {
    server.use(http.post(URL, () => HttpResponse.json({ operation: 'multiply', operands: [1, 2], result: 2 })))
    expect(failure(await calculate(request)).kind).toBe('unexpected')
  })

  it('times out after 8 seconds', async () => {
    expect(REQUEST_TIMEOUT_MS).toBe(8000)
  })

  it('reports a timeout when the server never answers', async () => {
    server.use(
      http.post(URL, async () => {
        await delay('infinite')
        return HttpResponse.json({})
      }),
    )
    vi.useFakeTimers()
    const pending = calculate(request)
    await vi.advanceTimersByTimeAsync(REQUEST_TIMEOUT_MS)
    expect(failure(await pending).kind).toBe('timeout')
  })

  it('reports aborted when the caller cancels mid-flight', async () => {
    server.use(
      http.post(URL, async () => {
        await delay('infinite')
        return HttpResponse.json({})
      }),
    )
    const controller = new AbortController()
    const pending = calculate(request, controller.signal)
    controller.abort()
    expect(failure(await pending).kind).toBe('aborted')
  })

  it('reports aborted without sending a request when the signal is already aborted', async () => {
    const handler = vi.fn(() => HttpResponse.json({ operation: 'add', operands: [1, 2], result: 3 }))
    server.use(http.post(URL, handler))
    const result = await calculate(request, AbortSignal.abort())
    expect(failure(result).kind).toBe('aborted')
    expect(handler).not.toHaveBeenCalled()
  })
})
