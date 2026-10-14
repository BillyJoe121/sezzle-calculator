import type { Ref } from 'react'

interface OperandFieldProps {
  id: string
  label: string
  value: string
  error?: string
  onChange: (value: string) => void
  ref?: Ref<HTMLInputElement>
}

export function OperandField({ id, label, value, error, onChange, ref }: OperandFieldProps) {
  const errorId = `${id}-error`
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input
        ref={ref}
        id={id}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        spellCheck={false}
        value={value}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        onChange={(event) => onChange(event.target.value)}
      />
      {error && (
        // role="alert" announces the error even when focus is already in this field (Enter to submit).
        <p id={errorId} className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
