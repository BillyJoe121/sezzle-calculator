import { useRef, useState, type FormEvent } from 'react'
import type { Operation } from '../../api/types'
import { OperandField } from './OperandField'
import { OperationPicker } from './OperationPicker'
import { getOperation } from './operations'
import { ResultPanel } from './ResultPanel'
import { useCalculator } from './useCalculator'
import { parseOperand } from './validation'

interface FieldErrors {
  a?: string
  b?: string
}

export function Calculator() {
  const [operation, setOperation] = useState<Operation>('add')
  const [a, setA] = useState('')
  const [b, setB] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const { state, submit, reset } = useCalculator()
  const aRef = useRef<HTMLInputElement>(null)
  const bRef = useRef<HTMLInputElement>(null)

  const info = getOperation(operation)

  function handleOperationChange(next: Operation) {
    setOperation(next)
    // Operand B is not rendered for unary operations, so its error must not linger.
    if (getOperation(next).arity === 1) setErrors(({ a: errorA }) => ({ a: errorA }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    // aria-disabled keeps the button focusable while pending, so repeated activations are ignored here.
    if (state.status === 'submitting') return
    const parsedA = parseOperand(a)
    const parsedB = info.arity === 2 ? parseOperand(b) : undefined

    const nextErrors: FieldErrors = {}
    if (!parsedA.ok) nextErrors.a = parsedA.message
    if (parsedB && !parsedB.ok) nextErrors.b = parsedB.message
    setErrors(nextErrors)

    if (!parsedA.ok) {
      aRef.current?.focus()
      return
    }
    if (parsedB && !parsedB.ok) {
      bRef.current?.focus()
      return
    }
    void submit({ operation, operands: parsedB?.ok ? [parsedA.value, parsedB.value] : [parsedA.value] })
  }

  function handleClear() {
    setOperation('add')
    setA('')
    setB('')
    setErrors({})
    reset()
    aRef.current?.focus()
  }

  return (
    <>
      <form className="calculator" noValidate onSubmit={handleSubmit}>
        <OperandField
          ref={aRef}
          id="operand-a"
          label={info.operandLabels[0]}
          value={a}
          error={errors.a}
          onChange={(value) => {
            setA(value)
            setErrors((current) => ({ ...current, a: undefined }))
          }}
        />
        <OperationPicker value={operation} onChange={handleOperationChange} />
        {info.operandLabels.length === 2 && (
          <OperandField
            ref={bRef}
            id="operand-b"
            label={info.operandLabels[1]}
            value={b}
            error={errors.b}
            onChange={(value) => {
              setB(value)
              setErrors((current) => ({ ...current, b: undefined }))
            }}
          />
        )}
        <div className="actions">
          <button
            type="submit"
            className="button button-primary"
            aria-disabled={state.status === 'submitting' ? true : undefined}
            aria-busy={state.status === 'submitting' ? true : undefined}
          >
            Calculate
          </button>
          <button type="button" className="button button-secondary" onClick={handleClear}>
            Clear
          </button>
        </div>
      </form>
      <ResultPanel state={state} />
    </>
  )
}
