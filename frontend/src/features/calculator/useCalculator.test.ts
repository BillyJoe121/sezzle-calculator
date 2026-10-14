import { act, renderHook, waitFor } from '@testing-library/react'
import { StrictMode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type {
  CalculateResult,
  CalculationRequest,
  CalculationResponse,
  CalculatorError,
} from '../../api/types'
import { calculate } from '../../api/calculatorClient'
import { calculatorReducer, useCalculator } from './useCalculator'
import type { CalculatorState } from './useCalculator'

vi.mock('../../api/calculatorClient', () => ({ calculate: vi.fn() }))

const calculateMock = vi.mocked(calculate)

const request: CalculationRequest = { operation: 'add', operands: [1, 2] }
const calculation: CalculationResponse = { operation: 'add', operands: [1, 2], result: 3 }
const error: CalculatorError = { kind: 'network', message: 'offline' }

function deferred() {
  let resolve!: (result: CalculateResult) => void
  const promise = new Promise<CalculateResult>((r) => {
    resolve = r
  })
  return { promise, resolve }
}

describe('calculatorReducer', () => {
  const states: CalculatorState[] = [
    { status: 'idle' },
    { status: 'submitting' },
    { status: 'success', calculation },
    { status: 'error', error },
  ]

  it.each(states)('submitted moves $status to submitting', (state) => {
    expect(calculatorReducer(state, { type: 'submitted' })).toEqual({ status: 'submitting' })
  })

  it.each(states)('succeeded moves $status to success', (state) => {
    expect(calculatorReducer(state, { type: 'succeeded', calculation })).toEqual({
      status: 'success',
      calculation,
    })
  })

  it.each(states)('failed moves $status to error', (state) => {
    expect(calculatorReducer(state, { type: 'failed', error })).toEqual({ status: 'error', error })
  })

  it.each(states)('reset moves $status to idle', (state) => {
    expect(calculatorReducer(state, { type: 'reset' })).toEqual({ status: 'idle' })
  })
})

describe('useCalculator', () => {
  beforeEach(() => {
    calculateMock.mockReset()
  })

  it('starts idle', () => {
    const { result } = renderHook(() => useCalculator())
    expect(result.current.state).toEqual({ status: 'idle' })
  })

  it('goes through submitting to success', async () => {
    const pending = deferred()
    calculateMock.mockReturnValueOnce(pending.promise)
    const { result } = renderHook(() => useCalculator())

    let done!: Promise<void>
    act(() => {
      done = result.current.submit(request)
    })
    expect(result.current.state).toEqual({ status: 'submitting' })
    expect(calculateMock).toHaveBeenCalledWith(request, expect.any(AbortSignal))

    await act(async () => {
      pending.resolve({ ok: true, value: calculation })
      await done
    })
    expect(result.current.state).toEqual({ status: 'success', calculation })
  })

  it('goes to error when the client reports a failure', async () => {
    calculateMock.mockResolvedValueOnce({ ok: false, error })
    const { result } = renderHook(() => useCalculator())

    await act(async () => {
      await result.current.submit(request)
    })
    expect(result.current.state).toEqual({ status: 'error', error })
  })

  it('ignores the first result when a second submit supersedes it', async () => {
    const first = deferred()
    const second = deferred()
    calculateMock.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise)
    const { result } = renderHook(() => useCalculator())

    let firstDone!: Promise<void>
    let secondDone!: Promise<void>
    act(() => {
      firstDone = result.current.submit(request)
    })
    const firstSignal = calculateMock.mock.calls[0][1]
    act(() => {
      secondDone = result.current.submit({ operation: 'add', operands: [5, 5] })
    })
    expect(firstSignal?.aborted).toBe(true)

    const latest: CalculationResponse = { operation: 'add', operands: [5, 5], result: 10 }
    await act(async () => {
      second.resolve({ ok: true, value: latest })
      await secondDone
    })
    await act(async () => {
      first.resolve({ ok: true, value: calculation })
      await firstDone
    })
    expect(result.current.state).toEqual({ status: 'success', calculation: latest })
  })

  it('returns to idle on reset and ignores the late result', async () => {
    const pending = deferred()
    calculateMock.mockReturnValueOnce(pending.promise)
    const { result } = renderHook(() => useCalculator())

    let done!: Promise<void>
    act(() => {
      done = result.current.submit(request)
    })
    const signal = calculateMock.mock.calls[0][1]
    act(() => result.current.reset())
    expect(signal?.aborted).toBe(true)
    expect(result.current.state).toEqual({ status: 'idle' })

    await act(async () => {
      pending.resolve({ ok: true, value: calculation })
      await done
    })
    expect(result.current.state).toEqual({ status: 'idle' })
  })

  it('aborts the in-flight request on unmount', () => {
    calculateMock.mockReturnValueOnce(deferred().promise)
    const { result, unmount } = renderHook(() => useCalculator())

    act(() => {
      void result.current.submit(request)
    })
    const signal = calculateMock.mock.calls[0][1]
    expect(signal?.aborted).toBe(false)
    unmount()
    expect(signal?.aborted).toBe(true)
  })

  it('still works under StrictMode double effects', async () => {
    calculateMock.mockResolvedValueOnce({ ok: true, value: calculation })
    const { result } = renderHook(() => useCalculator(), { wrapper: StrictMode })

    await act(async () => {
      await result.current.submit(request)
    })
    await waitFor(() => expect(result.current.state).toEqual({ status: 'success', calculation }))
    expect(calculateMock.mock.calls[0][1]?.aborted).toBe(false)
  })
})
