const SIGNIFICANT_DIGITS = 12
const PLAIN_MIN = 1e-6
const PLAIN_MAX = 1e12

/** Display-only formatting (ADR 0003): 12 significant digits, plain decimal inside [1e-6, 1e12), exponential outside. */
export function formatNumber(value: number): string {
  const rounded = Number(value.toPrecision(SIGNIFICANT_DIGITS))
  if (rounded === 0) return '0'
  const magnitude = Math.abs(rounded)
  return magnitude >= PLAIN_MIN && magnitude < PLAIN_MAX ? String(rounded) : rounded.toExponential()
}
