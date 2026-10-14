# Sezzle Calculator: frontend

React + TypeScript single-page app that evaluates one operation through the Go API
(`POST /api/v1/calculations`). The contract lives in [`../docs/api/`](../docs/api/); this app only calls relative URLs.

## Requirements

- Node.js 22.12 or newer (developed with Node 24.14 and npm 11.9).
- For real calculations, the backend running on `http://localhost:8080` (see the root README). Tests do not need it.

## Run

```sh
npm ci
npm run dev        # http://localhost:5173, proxies /api and /healthz to http://localhost:8080
```

Without the backend the page loads and validates input. Submitting then gets a `502` from the Vite proxy, which the
app reports as a response it could not read.

## Test

```sh
npm test           # Vitest (jsdom) with v8 coverage; fails below 85 % line coverage
npm run typecheck  # tsc -b, strict mode
npm run lint       # ESLint
npm run build      # type-check, then production build in dist/
```

`npm test` prints the coverage table; the HTML report is written to `coverage/index.html`.

API calls are intercepted with [MSW](https://mswjs.io/). The handlers are built from the same JSON examples the
backend contract test uses (`src/test/contractExamples.ts` loads `../docs/api/examples/*.json`), so both sides are
checked against one set of cases. Network failures and timeouts are simulated per test.

## Structure

```text
src/
  api/
    types.ts                  contract types (operations, error codes, request, response, problem)
    calculatorClient.ts       calculate(): fetch with an 8 s timeout, returns { ok, value } or { ok, error }
  features/calculator/
    operations.ts             operation catalog: label, symbol, arity, operand labels, expression
    validation.ts             parseOperand(): input format checks before any request
    errorMessages.ts          English message for each error code and failure kind
    useCalculator.ts          request state (idle, submitting, success, error) with useReducer
    Calculator.tsx            the form; composes the components below
    OperationPicker.tsx       operation radio group
    OperandField.tsx          labelled text input with its error message
    ResultPanel.tsx           result (live region) or error (alert)
  lib/formatNumber.ts         display formatting: 12 significant digits, exponent outside [1e-6, 1e12)
  test/                       Vitest setup, contract fixtures and MSW server
  index.css                   design tokens and styles (light and dark)
```

## Behavior notes

- The client checks the format of each operand (decimal point, sign, exponent, at most 32 characters). Domain
  rules such as division by zero belong to the backend; the UI shows the message mapped from the error `code`.
- Results are formatted for display only ([ADR 0003](../docs/adr/0003-float64-numeric-model-with-client-formatting.md)):
  `0.1 + 0.2` is shown as `0.3`.
- A new submission cancels the previous request; leaving the page cancels the pending one.
