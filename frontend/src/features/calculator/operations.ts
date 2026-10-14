import type { Operation } from '../../api/types'

export interface OperationInfo {
  id: Operation
  /** Accessible name in the operation picker. */
  label: string
  symbol: string
  arity: 1 | 2
  /** Visible labels of operand A and, for binary operations, operand B. */
  operandLabels: readonly [string] | readonly [string, string]
  /** Renders the expression from already formatted operands, for example `10 ÷ 4`. */
  expression: (operands: readonly string[]) => string
}

// One entry per operation in the contract, in the order the picker shows them.
export const OPERATION_LIST: readonly OperationInfo[] = [
  {
    id: 'add',
    label: 'Add',
    symbol: '+',
    arity: 2,
    operandLabels: ['First number', 'Second number'],
    expression: ([a, b]) => `${a} + ${b}`,
  },
  {
    id: 'subtract',
    label: 'Subtract',
    symbol: '−',
    arity: 2,
    operandLabels: ['First number', 'Second number'],
    expression: ([a, b]) => `${a} − ${b}`,
  },
  {
    id: 'multiply',
    label: 'Multiply',
    symbol: '×',
    arity: 2,
    operandLabels: ['First number', 'Second number'],
    expression: ([a, b]) => `${a} × ${b}`,
  },
  {
    id: 'divide',
    label: 'Divide',
    symbol: '÷',
    arity: 2,
    operandLabels: ['Dividend', 'Divisor'],
    expression: ([a, b]) => `${a} ÷ ${b}`,
  },
  {
    id: 'power',
    label: 'Power',
    symbol: '^',
    arity: 2,
    operandLabels: ['Base', 'Exponent'],
    expression: ([a, b]) => `${a} ^ ${b}`,
  },
  {
    id: 'sqrt',
    label: 'Square root',
    symbol: '√',
    arity: 1,
    operandLabels: ['Number'],
    expression: ([a]) => `√${a}`,
  },
  {
    id: 'percentage',
    label: 'Percentage',
    symbol: '%',
    arity: 2,
    operandLabels: ['Percent', 'Of'],
    expression: ([a, b]) => `${a}% of ${b}`,
  },
]

export function getOperation(id: Operation): OperationInfo {
  const info = OPERATION_LIST.find((operation) => operation.id === id)
  if (!info) throw new Error(`Unknown operation: ${id}`)
  return info
}
