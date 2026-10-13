# ADR 0005: Explicit-operand form instead of a calculator keypad

Status: accepted · 2026-10-13

## Context

The UI must be intuitive, validate input, handle errors and work on mobile. The API evaluates one operation over
an explicit list of operands. A classic keypad calculator builds an expression one keystroke at a time and would
need its own parser and evaluation-order rules on the client.

## Decision

A single form with:

- operand A;
- an operation selector (`add`, `subtract`, `multiply`, `divide`, `power`, `sqrt`, `percentage`, with readable
  labels);
- operand B, hidden and excluded from the request for unary operations (`sqrt`);
- a submit button, disabled while a request is pending;
- a result area that is announced to assistive technology.

Inputs are text fields with `inputmode="decimal"`, so mobile keyboards show digits while minus signs and
exponents (`-2.5`, `1e3`) stay possible. No history and no extra features.

## Alternatives considered

- **Classic keypad with an expression display.** Familiar, but it needs a client-side expression parser and
  precedence rules, and it either duplicates the backend's job or sends expressions the contract does not
  define. Validation errors are harder to attach to a specific input, and a grid of buttons is harder to make
  fully keyboard- and screen-reader-friendly.
- **`<input type="number">`.** Gives native steppers and validation, but browsers handle invalid text, locale
  separators and exponents inconsistently, and an empty value hides what the user typed. A text input with
  explicit parsing gives predictable messages.

## Consequences

- The form maps one to one to the request body, so every contract case (including each error `code`) has an
  obvious place in the UI and an obvious component test.
- Validation is visible: each field shows its own message, linked with `aria-describedby`.
- It works with the keyboard alone and adapts to narrow screens as a single column.
- Users enter one operation at a time; chaining results is out of scope.
