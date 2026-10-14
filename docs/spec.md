# Spec: Sezzle Calculator

Status: accepted (task 1, `feat/foundation`). This is a living document: update it before changing behavior.

## Goal

Deliver a small full-stack calculator, a React frontend that calls a Go REST microservice, that a reviewer can
run, read and trust in a few minutes. Correctness, clarity and maintainability come before extra features.

## Users

- **End user:** someone who wants to evaluate one arithmetic operation in a browser, on desktop or mobile.
- **Reviewer:** a Sezzle engineer who reads the code, runs both parts, calls the API and checks the tests.
- **Contributors and agents:** humans and AI agents working in parallel on the backend and the frontend, who
  share only the contract in [`docs/api/`](api/).

## Problem

The assessment asks for a calculator with a frontend, a backend and a clear contract between them. The hard parts
are not the arithmetic. They are defining behavior at the edges (division by zero, invalid input, float64 limits),
reporting errors consistently, and making both layers agree on that behavior while they are built separately.

## Scope

- Operations: `add`, `subtract`, `multiply`, `divide` (required); `power`, `sqrt`, `percentage` (optional, included).
- Backend: `GET /healthz` and `POST /api/v1/calculations`, defined in [`docs/api/openapi.yaml`](api/openapi.yaml).
- Frontend: one responsive page with an explicit-operand form (operand A, operation selector, operand B hidden for
  unary operations), client-side validation, a result area and error messages mapped from the API error `code`.
- Unit tests with coverage in both layers, contract tests driven by [`docs/api/examples/`](api/examples/).
- Documentation: README, architecture, ADRs, API usage, the AI workflow and the prompts used.
- Optional delivery: one Docker image where the Go server serves the built frontend and the API on port 8080.

## Out of scope

- Expression parsing, a classic calculator keypad, chained operations, memory keys and history.
- Authentication, accounts, persistence, rate limiting and any state between requests.
- CORS (everything is same-origin), internationalization (the UI is in English) and locale-specific number input.
- Arbitrary-precision or decimal arithmetic (see [ADR 0003](adr/0003-float64-numeric-model-with-client-formatting.md)).

## Stack

| Layer | Choice |
|-------|--------|
| Backend | Go, standard library only: `net/http` with method patterns (Go 1.22+), `encoding/json`, `log/slog`, `math`. `go.mod` declares `go 1.27.0`, the toolchain it is developed and tested with. |
| Frontend | React with TypeScript and Vite; Vitest, Testing Library and MSW for tests; npm. |
| Contract | OpenAPI 3.1 plus executable JSON examples. |
| Delivery | Multi-stage Dockerfile producing one image (task 4). |

## Features

1. **Calculation API.** `POST /api/v1/calculations` with `{"operation", "operands"}` returns
   `{"operation", "operands", "result"}`. Operations are a registry of id → arity and function (strategy pattern).
2. **Errors as RFC 9457 problem details** with a stable `code`, defined in the error table of `openapi.yaml`.
3. **Health check.** `GET /healthz` returns `{"status": "ok"}`.
4. **Calculator form.** Operand inputs accept decimal and exponent notation (`-2.5`, `1e3`) with a dot as the
   decimal separator. The second operand is hidden for `sqrt`. Submission is disabled while a request is pending.
5. **Client validation.** Empty or non-numeric operands and non-finite values are reported next to the field
   before any request is sent. Server errors are shown as messages mapped from `code`; network failures and
   unexpected responses show a generic, retryable message.
6. **Result display.** The raw float64 result is formatted for display only: 0, or a magnitude in [1e-6, 1e12),
   is shown as a decimal rounded to 12 significant digits without trailing zeros; any other magnitude uses
   exponential notation with up to 12 significant digits (`1.23456789012e+14`, `1e-7`).
   `0.30000000000000004` is shown as `0.3`.

## Quality

- Clean, idiomatic code: `gofmt` and `go vet` clean; strict TypeScript (`"strict": true`), no `any` in app code.
- TDD for domain and validation logic. Coverage targets (line coverage): `internal/calculator` ≥ 95 %,
  `internal/httpapi` ≥ 85 %, frontend ≥ 85 %.
- Contract tests on both sides load every file in `docs/api/examples/`.
- No hand-maintained file over 500 lines. Smallest coherent change first (Ponytail), never removing validation,
  security, accessibility or error handling.
- Accessibility: every input has a visible label, errors are linked with `aria-describedby`, the result region is
  announced (`aria-live="polite"`), everything works with the keyboard, and contrast meets WCAG 2.2 AA.

## Security

- Strict input handling: a 4096-byte body limit (`http.MaxBytesReader`), `Content-Type` check before reading the
  body, unknown fields rejected, a single JSON value only, operands parsed as finite float64 numbers.
- No internal details in responses: unexpected failures return `INTERNAL_ERROR` and the cause is logged with
  `log/slog`; a recovery middleware turns panics into that response.
- `http.Server` with explicit `ReadHeaderTimeout`, `ReadTimeout`, `WriteTimeout` and `IdleTimeout`, and graceful
  shutdown on SIGINT/SIGTERM.
- `X-Content-Type-Options: nosniff` on every response the handler writes (net/http's own replies to malformed
  requests never reach it). Static files are served without directory listings. No CORS headers: the browser only talks to its own origin.
- No secrets exist; `.env` files are ignored anyway. No third-party Go modules.

## Deployment

- Local development: backend on `:8080` (`PORT`), Vite dev server on `:5173` proxying `/api` and `/healthz` to
  `http://localhost:8080`.
- Container (task 4): one image; the Go server serves the API and, through `STATIC_DIR`, the built frontend on
  port 8080 from the same origin.

## Acceptance criteria

One verifiable criterion per requirement of the assessment.

| # | Requirement | Verified by |
|---|-------------|-------------|
| AC1 | Addition | `add-success` example passes in the backend contract test; domain unit test for `add`. |
| AC2 | Subtraction | `subtract-success` example passes; domain unit test for `subtract`. |
| AC3 | Multiplication | `multiply-success` example passes; domain unit test for `multiply`. |
| AC4 | Division | `divide-success` example passes; domain unit test for `divide`. |
| AC5 | Power (optional) | `power-success` and `power-out-of-range` examples pass; domain tests cover negative base with fractional exponent and `0` to a negative exponent (`DOMAIN_ERROR`). |
| AC6 | Square root (optional) | `sqrt-success` and `sqrt-negative` examples pass; the UI hides operand B for `sqrt` (component test). |
| AC7 | Percentage (optional) | `percentage-success` example passes (`15` percent of `200` = `30`); domain test covers the overflow fallback. |
| AC8 | Frontend in React with TypeScript | `frontend/` builds with `npm run build` and type-checks with `npm run typecheck`. |
| AC9 | Intuitive UI to enter numbers and see results | Component test: fill operand A, pick an operation, fill operand B, submit, and the formatted result appears in the live region. |
| AC10 | Frontend input validation and error handling | Component tests: empty and non-numeric operands block submission with a field message; each API error `code` from the examples shows its mapped message; a network failure shows a retryable message. |
| AC11 | Responsive design with basic mobile support | The layout is a single column at a 360 px viewport width with no horizontal scroll, and inputs use `inputmode="decimal"`; checked manually and recorded in the README. |
| AC12 | REST backend in Go | `backend/` builds with `go build ./...` and has no third-party dependency (`go.mod` without `require`). |
| AC13 | Endpoints for the operations | Backend contract test runs every file in `docs/api/examples/` against the real router and passes. |
| AC14 | Backend input validation | `unknown-field`, `malformed-json`, `null-operand`, `wrong-arity`, `unsupported-operation` and `unsupported-media-type` examples pass; a unit test covers the 4096-byte limit (413). |
| AC15 | Edge cases (division by zero, invalid data) | `divide-by-zero` example passes, including a domain test for a `-0` divisor; responses never contain NaN, ±Infinity or `-0`. |
| AC16 | JSON responses | Every example asserts `application/json` or `application/problem+json`; 404 and 405 under `/api/` are problem documents (unit tests). |
| AC17 | Clean, readable, idiomatic code | `gofmt -l` prints nothing, `go vet ./...` passes, `npm run typecheck` passes; review recorded in Forge. |
| AC18 | Unit tests for key functionality in both layers | `go test ./...` and `npm test` pass. |
| AC19 | Documentation of setup, API usage and design reasoning | README sections are complete; ADRs 0001–0006 exist; `docs/api/README.md` explains the contract. |
| AC20 | Dockerfile (optional) | `docker build` succeeds and the container answers `GET /healthz` and serves the UI on port 8080 (task 4). |
| AC21 | Git repository with frontend and backend | `backend/` and `frontend/` are merged into `main` with a history of one branch per task. |
| AC22 | README with setup, running each part, API call examples, decisions and assumptions | Every README section is filled in; each `curl` example reproduces its file in `docs/api/examples/`. |
| AC23 | Tests and coverage report | Coverage commands print the per-layer percentages and meet the targets in Quality. |
| AC24 | Prompts used | The prompts for all four tasks are committed under `docs/ai/` (task 4). |

## Assumptions

- `percentage` means "a percent of b": `a × b / 100`.
- Numbers are IEEE-754 float64 with their documented precision; results are not rounded by the server.
- There is no authentication and no persistence: the calculator is stateless.
- Request bodies are limited to 4 KiB (4096 bytes).
- There is no CORS because the UI and the API are always served from the same origin.
- The UI is in English and uses a dot as the decimal separator.

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Backend and frontend, built in parallel, interpret the contract differently | High | Normative examples used as fixtures on both sides; validation order and edge classifications written down; contract changes only on their own branch. |
| float64 surprises (`0.1 + 0.2`, overflow, `-0`, NaN) | Medium | Explicit numeric model, server-side normalization and range errors, client-side display formatting, dedicated tests. |
| Encoding differences on Windows (CRLF breaking gofmt or diffs) | Low | `.gitattributes` with `eol=lf` and `.editorconfig`. |
| Scope creep beyond the 2–4 hour budget | Medium | Out-of-scope list, Ponytail rule, no extra features. |

## Decisions

Recorded as ADRs in [`docs/adr/`](adr/):

1. [0001](adr/0001-monorepo-and-contract-first.md) Monorepo and contract-first development.
2. [0002](adr/0002-single-calculations-endpoint-with-problem-json.md) One calculations endpoint with problem+json errors.
3. [0003](adr/0003-float64-numeric-model-with-client-formatting.md) float64 numeric model with client-side formatting.
4. [0004](adr/0004-go-standard-library-without-framework.md) Go standard library, no framework.
5. [0005](adr/0005-explicit-operand-form-ui.md) Explicit-operand form instead of a keypad.
6. [0006](adr/0006-single-container-same-origin-no-cors.md) Single container, same origin, no CORS.

Contract details fixed in task 1: deterministic validation order; `title` equals Go's `http.StatusText`; `detail`
is not normative; only `charset=utf-8` is accepted as a `Content-Type` parameter; `-0` is normalized in every
numeric response field; `power(0, 0) = 1`; underflow to zero is not an error; a residual NaN maps to
`DOMAIN_ERROR`; `percentage` falls back to `(a / 100) × b` when `a × b` overflows.

## Open questions

- Project license: none has been chosen, so `openapi.yaml` has no `info.license` (a known lint warning).
- Coverage threshold enforcement for Go in CI (a script or `go tool cover` parsing) is decided in task 4.
