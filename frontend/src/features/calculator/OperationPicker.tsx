import type { Operation } from '../../api/types'
import { OPERATION_LIST } from './operations'

interface OperationPickerProps {
  value: Operation
  onChange: (operation: Operation) => void
}

// Native radios: the browser provides grouping, roving focus and arrow-key selection.
export function OperationPicker({ value, onChange }: OperationPickerProps) {
  return (
    <fieldset className="operation-picker">
      <legend>Operation</legend>
      {OPERATION_LIST.map((operation) => (
        <label key={operation.id} className="operation-option">
          <input
            type="radio"
            name="operation"
            className="visually-hidden"
            value={operation.id}
            checked={value === operation.id}
            onChange={() => onChange(operation.id)}
          />
          <span className="operation-symbol" aria-hidden="true">
            {operation.symbol}
          </span>
          <span>{operation.label}</span>
        </label>
      ))}
    </fieldset>
  )
}
