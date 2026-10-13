# ADR 0003: float64 numeric model with client-side formatting

Status: accepted · 2026-10-13

## Context

A calculator has to pick a number representation, and the choice decides which results are exact, which inputs
are valid and how errors at the edges look. JSON numbers have no fixed precision, but JSON cannot represent NaN or
±Infinity. Go's natural type is `float64` and JavaScript's is `number`, which are both IEEE-754 binary64. Square
root and fractional powers are irrational for most inputs, so no finite representation makes them exact.

## Decision

- Operands and results are IEEE-754 float64 end to end. The server does not round.
- The server never returns NaN or ±Infinity: a non-finite result from finite operands is 422
  `RESULT_OUT_OF_RANGE`, an undefined operation is 422 `DOMAIN_ERROR` or `DIVISION_BY_ZERO`, and inputs outside
  the float64 range are 400 `INVALID_OPERANDS`. `-0` is normalized to `0` in every numeric response field.
- The frontend formats results for display only, with at most 12 significant digits and exponential notation
  outside [1e-6, 1e12), so `0.1 + 0.2` (`0.30000000000000004` on the wire) is shown as `0.3`. The wire value
  stays exact, so no information is lost.

## Alternatives considered

- **Decimal arithmetic** (for example a decimal library on both sides, or numbers as strings). `0.1 + 0.2` would
  be exactly `0.3`, but square root and fractional powers are not exact in decimal either; they still need
  rounding to a chosen precision. It would also add a dependency on each side (the Go backend is
  standard-library only, see ADR 0004), and every operand would have to travel as a string to avoid JSON parsers
  converting it back to binary floating point. That is a lot of cost for a general-purpose calculator.
- **Rounding on the server.** It would hide representation error in one place but destroy information for any
  client that wants the raw value, and the right display precision is a presentation decision.
- **Big rationals** (`math/big.Rat`). Exact for the four basic operations, but not closed under square root and
  fractional powers, so the same problem reappears.

## Consequences

- Results such as `0.1 + 0.2` are not exact on the wire; this is documented and handled in the UI.
- Very large or very small results are reported clearly instead of as `Infinity` or a silent `0`.
- In a real payments system this model would be wrong. Money is never stored or computed in binary floating
  point: amounts are integers in minor units (cents) with an ISO 4217 currency, or a fixed-scale decimal type,
  and rounding (for example banker's rounding when splitting an order into installments) is an explicit, tested
  business rule, with the remainder assigned deterministically so the parts always add up to the total. A
  general calculator with `sqrt` and `power` is not that domain, so float64 with honest edge handling is the
  simpler correct choice here.
