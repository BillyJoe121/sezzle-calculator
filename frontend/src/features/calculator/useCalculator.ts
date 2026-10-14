import { useCallback, useEffect, useReducer, useRef } from 'react'
import { calculate } from '../../api/calculatorClient'
import type { CalculationRequest, CalculationResponse, CalculatorError } from '../../api/types'

export type CalculatorState =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'success'; calculation: CalculationResponse }
  | { status: 'error'; error: CalculatorError }

export type CalculatorAction =
  | { type: 'submitted' }
  | { type: 'succeeded'; calculation: CalculationResponse }
  | { type: 'failed'; error: CalculatorError }
  | { type: 'reset' }

export function calculatorReducer(_state: CalculatorState, action: CalculatorAction): CalculatorState {
  switch (action.type) {
    case 'submitted':
      return { status: 'submitting' }
    case 'succeeded':
      return { status: 'success', calculation: action.calculation }
    case 'failed':
      return { status: 'error', error: action.error }
    case 'reset':
      return { status: 'idle' }
  }
}

export function useCalculator() {
  const [state, dispatch] = useReducer(calculatorReducer, { status: 'idle' })
  const controllerRef = useRef<AbortController | null>(null)

  // Unmount cancels the in-flight request. Safe under StrictMode: the simulated unmount
  // finds no request in flight, and every submit creates its own controller.
  useEffect(() => () => controllerRef.current?.abort(), [])

  const submit = useCallback(async (request: CalculationRequest) => {
    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller
    dispatch({ type: 'submitted' })

    const result = await calculate(request, controller.signal)
    // Superseded, reset or unmounted while waiting: this result is stale.
    if (controller.signal.aborted) return
    dispatch(
      result.ok
        ? { type: 'succeeded', calculation: result.value }
        : { type: 'failed', error: result.error },
    )
  }, [])

  const reset = useCallback(() => {
    controllerRef.current?.abort()
    dispatch({ type: 'reset' })
  }, [])

  return { state, submit, reset }
}
