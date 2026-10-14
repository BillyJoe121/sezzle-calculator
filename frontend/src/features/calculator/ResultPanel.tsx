import { formatNumber } from '../../lib/formatNumber'
import { errorMessage } from './errorMessages'
import { getOperation } from './operations'
import type { CalculatorState } from './useCalculator'

// A negative second operand is wrapped so the expression never shows two signs in a row, as in 10 − (-4).
function displayOperands(operands: readonly number[]): string[] {
  return operands.map((operand, index) => {
    const text = formatNumber(operand)
    return index > 0 && text.startsWith('-') ? `(${text})` : text
  })
}

// The status region stays in the DOM in every state so assistive technology announces its changes.
function StatusContent({ state }: { state: CalculatorState }) {
  switch (state.status) {
    case 'idle':
      return (
        <p className="result-hint">Enter the numbers, choose an operation and select Calculate.</p>
      )
    case 'submitting':
      return 'Calculating…'
    case 'success': {
      const { calculation } = state
      const expression = getOperation(calculation.operation).expression(displayOperands(calculation.operands))
      return (
        <>
          <span className="result-expression">{expression} =</span>{' '}
          <span className="result-value">{formatNumber(calculation.result)}</span>
        </>
      )
    }
    case 'error':
      return null
  }
}

export function ResultPanel({ state }: { state: CalculatorState }) {
  return (
    <div className="result">
      <div role="status" aria-live="polite" aria-atomic="true">
        <StatusContent state={state} />
      </div>
      {state.status === 'error' && state.error.kind !== 'aborted' && (
        <p role="alert" className="result-error">
          {errorMessage(state.error)}
        </p>
      )}
    </div>
  )
}
