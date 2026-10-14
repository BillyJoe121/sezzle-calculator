# Sezzle Calculator

A full-stack calculator built for the Sezzle take-home assessment. A React + TypeScript frontend sends one
operation and its operands to a Go REST microservice, which returns the result as JSON or a precise error.

## Overview

- **Operations:** add, subtract, multiply, divide, plus the optional power, square root and percentage.
- **Backend:** Go standard library only. `POST /api/v1/calculations` and `GET /healthz`, strict input validation
  and RFC 9457 problem details with a stable error `code`.
- **Frontend:** a responsive form with explicit operands (operand A, operation, operand B), client-side
  validation and an English message for every error `code`. Keyboard accessible; light and dark themes.
- **Contract-first:** [`docs/api/openapi.yaml`](docs/api/openapi.yaml) plus executable examples that both test
  suites use as fixtures.
- **Delivery:** one Docker image serves the UI and the API on port 8080; GitHub Actions runs the lint, test, coverage and build checks.

## Quick start (Docker)

```sh
docker build -t sezzle-calculator .
docker run --rm -p 8080:8080 sezzle-calculator
```

Open http://localhost:8080. The same commands work in PowerShell. The image is multi-stage: Node 24 builds the
frontend, Go 1.27 builds a static binary, and the final image is `gcr.io/distroless/static-debian12:nonroot`
(no shell, non-root user) with `PORT=8080` and `STATIC_DIR=/app/web`.

## Local development

Requirements: Go 1.27.2 or newer, and Node.js 24.15+ or 22.22.2+ (the test tooling, `jsdom`, requires these; CI
and the Docker image use Node 24.21.0). No other tools are needed: the backend has no third-party modules.

### Backend

Runs on http://localhost:8080. `PORT` changes the port; `STATIC_DIR` also serves a built frontend at `/`.

macOS or Linux:

```sh
cd backend
go run ./cmd/server
PORT=9090 go run ./cmd/server
STATIC_DIR=../frontend/dist go run ./cmd/server   # after npm run build in frontend/
```

Windows PowerShell (variables set this way last for the session; `Remove-Item Env:PORT` clears one):

```powershell
cd backend
go run ./cmd/server
$env:PORT = '9090'; go run ./cmd/server
$env:STATIC_DIR = '..\frontend\dist'; go run ./cmd/server
```

Logs are JSON lines on stdout. More detail: [`backend/README.md`](backend/README.md).

### Frontend

Start the backend first, then in a second terminal (same commands on every platform):

```sh
cd frontend
npm ci
npm run dev        # http://localhost:5173
```

The Vite dev server proxies `/api` and `/healthz` to `http://localhost:8080`, so the browser talks to one origin
and no CORS is needed. More detail: [`frontend/README.md`](frontend/README.md).

## Tests and coverage

```sh
cd backend
gofmt -l .                      # prints nothing when formatted
go vet ./...
go test -count=1 -cover ./...   # unit tests and the contract test over docs/api/examples

cd ../frontend
npm run lint
npm run typecheck
npm test                        # Vitest with coverage; fails below 85 % line coverage
npm run build
```

Observed coverage (2026-10-14): `internal/calculator` 100 %, `internal/httpapi` 95.4 %, Go total 93.1 %;
frontend 100 % lines, 98.13 % branches, 187 tests. Targets, per-function detail and how to regenerate the
reports: [`docs/coverage.md`](docs/coverage.md).

`go test -race` needs cgo and a C compiler, which the Windows development machine did not have, so it runs in CI
on Linux.

**CI.** [`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs on every push and pull request with
read-only permissions: a backend job (gofmt, vet, tests with `-race`, coverage targets of 95 % and 85 %), a
frontend job (lint, type check, tests with coverage, build) and a Docker build once both pass. Coverage reports
are uploaded as artifacts. Dependency scans are manual, not in CI: `govulncheck ./...` in `backend/` (clean on
Go 1.27.2) and `npm audit --omit=dev` in `frontend/`. The workflow passed `actionlint` locally; it has not run on GitHub yet, so its first
run happens on the first push.

**End-to-end check (2026-10-14, manual, not part of CI).** With the backend on :8080 and Vite on :5173, all 17
contract examples returned the expected status, content type and body both directly and through the Vite proxy.
In headless Microsoft Edge at 360 × 740, 375 × 812 and 1280 × 800 px, with the keyboard only: `10 ÷ 4 = 2.5`; invalid input
showed field errors and sent no request; `10 ÷ 0` showed the server's division-by-zero message; square root hid
operand B and showed `√16 = 4`; Clear returned focus to operand A; no horizontal scrolling at any of these widths. The
Docker image passed the same API calls and served the UI.

## API usage

| Method | Path | Body | Success |
|--------|------|------|---------|
| `GET` | `/healthz` | none | `200 {"status":"ok"}` |
| `POST` | `/api/v1/calculations` | `{"operation": "<id>", "operands": [<numbers>]}` | `200 {"operation", "operands", "result"}` |

Operation ids: `add`, `subtract`, `multiply`, `divide`, `power` (two operands each), `sqrt` (one operand) and
`percentage` (`a` percent of `b`). The full contract, including every edge case and the validation order, is in
[`docs/api/`](docs/api/README.md).

The examples below are real responses from the running server (the `Date` header is omitted). They use `curl`
as on macOS, Linux or Git Bash; PowerShell equivalents follow.

```console
$ curl -s -i -X POST http://localhost:8080/api/v1/calculations -H 'Content-Type: application/json' --data-raw '{"operation":"divide","operands":[10,4]}'
HTTP/1.1 200 OK
Content-Type: application/json
X-Content-Type-Options: nosniff
Content-Length: 53

{"operation":"divide","operands":[10,4],"result":2.5}

$ curl -s -X POST http://localhost:8080/api/v1/calculations -H 'Content-Type: application/json' --data-raw '{"operation":"sqrt","operands":[16]}'
{"operation":"sqrt","operands":[16],"result":4}

$ curl -s -X POST http://localhost:8080/api/v1/calculations -H 'Content-Type: application/json' --data-raw '{"operation":"percentage","operands":[15,200]}'
{"operation":"percentage","operands":[15,200],"result":30}
```

Errors are `application/problem+json`. Clients branch on `code`; `detail` is for humans and may change.

```console
$ curl -s -i -X POST http://localhost:8080/api/v1/calculations -H 'Content-Type: application/json' --data-raw '{"operation":"divide","operands":[10,0]}'
HTTP/1.1 422 Unprocessable Entity
Content-Type: application/problem+json
X-Content-Type-Options: nosniff
Content-Length: 134

{"type":"about:blank","title":"Unprocessable Entity","status":422,"detail":"Division by zero is undefined.","code":"DIVISION_BY_ZERO"}

$ curl -s -X POST http://localhost:8080/api/v1/calculations -H 'Content-Type: application/json' --data-raw '{"operation":"modulo","operands":[10,3]}'
{"type":"about:blank","title":"Bad Request","status":400,"detail":"Unsupported operation. Supported operations: add, subtract, multiply, divide, power, sqrt, percentage.","code":"UNSUPPORTED_OPERATION"}

$ curl -s -X POST http://localhost:8080/api/v1/calculations -H 'Content-Type: application/json' --data-raw '{"operation":"add","operands":[1]}'
{"type":"about:blank","title":"Bad Request","status":400,"detail":"Operation \"add\" requires exactly 2 operands.","code":"INVALID_OPERANDS"}
```

Windows PowerShell 5.1 (`Invoke-RestMethod` throws on 4xx, so the error body is read in `catch`):

```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:8080/api/v1/calculations -ContentType 'application/json' -Body '{"operation":"divide","operands":[10,4]}'
try { Invoke-RestMethod -Method Post -Uri http://localhost:8080/api/v1/calculations -ContentType 'application/json' -Body '{"operation":"divide","operands":[10,0]}' } catch { $_.ErrorDetails.Message }
```

Every response for the 17 cases in [`docs/api/examples/`](docs/api/examples/) matches its file; the only text
difference is the human-readable `detail` of `sqrt-negative`, which the contract does not fix.

| Status | `code` | When |
|--------|--------|------|
| 400 | `INVALID_JSON` | Empty or malformed body, not a JSON object, unknown fields, more than one JSON value, wrong member types |
| 400 | `UNSUPPORTED_OPERATION` | `operation` missing, empty or not a known id |
| 400 | `INVALID_OPERANDS` | Operand count differs from the arity, or an operand is `null`, not a number or outside the float64 range |
| 404 | `NOT_FOUND` | No route under `/api/` |
| 405 | `METHOD_NOT_ALLOWED` | Wrong method under `/api/` (with an `Allow` header) |
| 413 | `PAYLOAD_TOO_LARGE` | Body larger than 4096 bytes |
| 415 | `UNSUPPORTED_MEDIA_TYPE` | `Content-Type` is not `application/json` (only `charset=utf-8` is accepted as a parameter) |
| 422 | `DIVISION_BY_ZERO` | `divide` by `0` or `-0` |
| 422 | `DOMAIN_ERROR` | `sqrt` of a negative number; `power` with a negative base and a non-integer exponent, or base `0` and a negative exponent |
| 422 | `RESULT_OUT_OF_RANGE` | The result would be ±Infinity although every operand is finite |
| 500 | `INTERNAL_ERROR` | Unexpected failure; details go to the log only |

## Design decisions

| Decision | Why | Record |
|----------|-----|--------|
| Monorepo, contract-first | Backend and frontend are built in parallel and share only the contract and its fixtures. | [ADR 0001](docs/adr/0001-monorepo-and-contract-first.md) |
| One calculations endpoint, problem+json errors | One request shape for every operation; a stable `code` the UI can rely on. | [ADR 0002](docs/adr/0002-single-calculations-endpoint-with-problem-json.md) |
| float64, formatted on the client | Square root and power are not exact in decimal either; the server never returns NaN, ±Infinity or `-0`. A payments system would use integer minor units or a decimal type instead. | [ADR 0003](docs/adr/0003-float64-numeric-model-with-client-formatting.md) |
| Go standard library, no framework | Two routes do not need a framework; Go's method-aware `ServeMux` and `log/slog` cover it. | [ADR 0004](docs/adr/0004-go-standard-library-without-framework.md) |
| Explicit-operand form, not a keypad | Maps one to one to the API, makes validation visible, works with the keyboard and needs no expression parser. | [ADR 0005](docs/adr/0005-explicit-operand-form-ui.md) |
| One container, same origin, no CORS | Go serves the SPA and the API on port 8080; Vite proxies in development. | [ADR 0006](docs/adr/0006-single-container-same-origin-no-cors.md) |

Delivery choices that follow from these: the runtime image is distroless and runs as a non-root user; CI pins
every action to a commit SHA, installs with `npm ci --ignore-scripts` (only the optional, macOS-only `fsevents` declares an install script)
and enforces the coverage targets. More detail: [`docs/architecture.md`](docs/architecture.md) and
[`docs/spec.md`](docs/spec.md).

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
.github/workflows/ci.yml  CI: backend, frontend and Docker build jobs
.claude/skills/           agent skills used to build the project (vendored, see THIRD_PARTY_NOTICES.md)
backend/                  Go service: cmd/server, internal/calculator (domain), internal/httpapi (transport)
frontend/                 React + TypeScript + Vite app: src/api, src/features/calculator, src/lib
docs/
  spec.md                 goals, scope, acceptance criteria
  architecture.md         components, layers, error and numeric models, test strategy
  adr/                    architecture decision records
  api/                    OpenAPI contract and executable examples
  coverage.md             observed coverage and how to regenerate it
  ai/                     AI-assisted workflow and the prompts used
deuda tecnica/            technical debt register (maintained with Forge)
.forge/                   Forge evidence per task (workflow records and change summaries)
Dockerfile                multi-stage image: Node build, Go build, distroless runtime
AGENTS.md                 rules for agents working in this repository
```

## How this was built

The project was built in four tasks, each on its own branch and in its own chat with an AI coding agent, using
the Forge workflow: spec, plan, implementation with TDD, checks run and recorded by Forge, review and delivery.
The backend and the frontend were built at the same time in separate Git worktrees, sharing only the contract.

- [`docs/ai/WORKFLOW.md`](docs/ai/WORKFLOW.md): how the workflow works and where to find the evidence for each
  practice.
- [`docs/ai/PROMPTS.md`](docs/ai/PROMPTS.md): the four prompts, verbatim, with a note on how each task ran.
