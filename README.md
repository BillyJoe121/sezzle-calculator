# Sezzle Calculator

A full-stack calculator built for the Sezzle take-home assessment. A React + TypeScript frontend sends one
operation and its operands to a Go REST microservice, which returns the result as JSON or a precise error.

> **Status:** task 1 of 4 is done: spec, API contract, architecture and decision records. The backend, the
> frontend and the delivery tooling are built in tasks 2–4. Sections marked *Completed in task 4* are
> placeholders until then.

## Overview

- **Operations:** add, subtract, multiply, divide, plus the optional power, square root and percentage.
- **Backend:** Go standard library only. `POST /api/v1/calculations` and `GET /healthz`, strict input validation
  and RFC 9457 problem details with a stable error `code`.
- **Frontend:** a responsive form with explicit operands (operand A, operation, operand B), client-side
  validation and an error message for every error `code`.
- **Contract-first:** [`docs/api/openapi.yaml`](docs/api/openapi.yaml) plus executable examples that both test
  suites use as fixtures.

## Quick start

*Completed in task 4.*

## Running the backend

*Completed in task 4.* The backend listens on port `8080` (`PORT`). Setting `STATIC_DIR` makes it serve the built
frontend too.

## Running the frontend

*Completed in task 4.* The Vite dev server runs on port `5173` and proxies `/api` and `/healthz` to
`http://localhost:8080`, so no CORS setup is needed.

## Tests and coverage

*Completed in task 4.* Line coverage targets: `internal/calculator` ≥ 95 %, `internal/httpapi` ≥ 85 %,
frontend ≥ 85 %.

## API usage

The full contract, including every error case, is in [`docs/api/`](docs/api/README.md). One exchange:

```http
POST /api/v1/calculations
Content-Type: application/json

{"operation": "divide", "operands": [10, 4]}
```

```http
HTTP/1.1 200 OK
Content-Type: application/json

{"operation": "divide", "operands": [10, 4], "result": 2.5}
```

Dividing by zero instead returns:

```http
HTTP/1.1 422 Unprocessable Entity
Content-Type: application/problem+json

{"type": "about:blank", "title": "Unprocessable Entity", "status": 422,
 "detail": "Division by zero is undefined.", "code": "DIVISION_BY_ZERO"}
```

Runnable `curl` examples: *Completed in task 4.*

## Design decisions

| Decision | Why | Record |
|----------|-----|--------|
| Monorepo, contract-first | Backend and frontend are built in parallel and share only the contract and its fixtures. | [ADR 0001](docs/adr/0001-monorepo-and-contract-first.md) |
| One calculations endpoint, problem+json errors | One request shape for every operation; a stable `code` the UI can rely on. | [ADR 0002](docs/adr/0002-single-calculations-endpoint-with-problem-json.md) |
| float64, formatted on the client | Square root and power are not exact in decimal either; the server never returns NaN, ±Infinity or `-0`. A payments system would use integer minor units or a decimal type instead. | [ADR 0003](docs/adr/0003-float64-numeric-model-with-client-formatting.md) |
| Go standard library, no framework | Two routes do not need a framework; Go 1.22 routing and `log/slog` cover it. | [ADR 0004](docs/adr/0004-go-standard-library-without-framework.md) |
| Explicit-operand form, not a keypad | Maps one to one to the API, makes validation visible, works with the keyboard and needs no expression parser. | [ADR 0005](docs/adr/0005-explicit-operand-form-ui.md) |
| One container, same origin, no CORS | Go serves the SPA and the API on port 8080; Vite proxies in development. | [ADR 0006](docs/adr/0006-single-container-same-origin-no-cors.md) |

More detail: [`docs/architecture.md`](docs/architecture.md) and [`docs/spec.md`](docs/spec.md).

## Assumptions

- `percentage` means "a percent of b": `a × b / 100`, so `15` percent of `200` is `30`.
- Numbers are IEEE-754 float64 with its documented precision; the server does not round, and the UI shows at
  most 12 significant digits.
- There is no authentication and no persistence: the calculator is stateless.
- Request bodies are limited to 4 KiB (4096 bytes).
- There is no CORS, because the UI and the API are always served from the same origin.
- The UI is in English and uses a dot as the decimal separator.

## Project structure

```text
.claude/skills/   agent skills used to build the project (vendored, see THIRD_PARTY_NOTICES.md)
backend/          Go service                                (task 2)
frontend/         React + TypeScript + Vite app             (task 3)
docs/
  spec.md         goals, scope, acceptance criteria
  architecture.md components, layers, error and numeric models, test strategy
  adr/            architecture decision records
  api/            OpenAPI contract and executable examples
  ai/             AI-assisted workflow and prompts
AGENTS.md         rules for agents working in this repository
```

## How this was built

The project is built in four tasks, each on its own branch and in its own chat with an AI coding agent, using
the Forge workflow: spec, plan, implementation with TDD, recorded checks, review and delivery. Tasks 2 and 3 run
in parallel in separate Git worktrees. See [`docs/ai/WORKFLOW.md`](docs/ai/WORKFLOW.md). The prompts used and the
final write-up: *Completed in task 4.*
