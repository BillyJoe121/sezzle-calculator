# Coverage report

Observed on 2026-10-14 on Windows 11 with Go 1.27.2 and Node 24.14.0, on `feat/delivery` (branched from
`90cc92f`; the application code in `backend/` and `frontend/` is unchanged, only `go.mod` moved to Go 1.27.2). CI recomputes these numbers on every push and
publishes the HTML reports as artifacts (`backend-coverage`, `frontend-coverage`); the HTML files are not
committed.

## Backend (Go, statement coverage)

| Package | Coverage | Target |
|---------|---------:|-------:|
| `internal/calculator` | 100.0 % | ≥ 95 % |
| `internal/httpapi` | 95.4 % | ≥ 85 % |
| `cmd/server` | 80.0 % | none |
| **Total** (`go tool cover -func`) | **93.1 %** | |

Functions below 100 % in `go tool cover -func`:

| Function | Coverage | Why |
|----------|---------:|-----|
| `cmd/server/main.go: main` | 0.0 % | Process entry point; `run` and `loadConfig` hold the logic and are tested. |
| `cmd/server/main.go: run` | 86.4 % | Listener and shutdown error branches. |
| `internal/httpapi/problem.go: Error` | 0.0 % | Required by the `error` interface; never called on the response path. |
| `internal/httpapi/problem.go: writeJSON` | 71.4 % | Marshal-failure fallback, kept as error handling. |
| `internal/httpapi/routes.go: Open` | 78.6 % | `Stat` and `index.html` failure branches of the no-listing file system. |
| `internal/httpapi/decode.go: decodeRequest` | 97.0 % | One defensive branch. |

The race detector (`-race`) needs cgo, which the Windows machine did not have; CI runs the tests with `-race`
on Linux.

## Frontend (Vitest, v8 coverage)

`text-summary` output:

| Metric | Coverage | Covered / total |
|--------|---------:|----------------:|
| Statements | 99.4 % | 166 / 167 |
| Branches | 98.13 % | 105 / 107 |
| Functions | 100 % | 51 / 51 |
| Lines | 100 % | 143 / 143 |

187 tests in 11 files. The threshold is 85 % lines (`vite.config.ts`), so `npm test` fails below it. The only
files below 100 % are `src/api/calculatorClient.ts` (one branch, line 99) and
`src/features/calculator/operations.ts` (one branch, line 77).

## Regenerate

```sh
# Backend: per-package numbers, then per-function numbers and an HTML report (coverage.out and coverage.html are ignored)
cd backend
go test -count=1 -cover -coverprofile=coverage.out ./...
go tool cover -func=coverage.out
go tool cover -html=coverage.out -o coverage.html

# Frontend: summary table; npm test also writes coverage/index.html (ignored)
cd ../frontend
npx vitest run --coverage --coverage.reporter=text-summary
```

CI enforces the same targets: the backend job fails if `internal/calculator` is under 95 % or `internal/httpapi`
is under 85 %, and the frontend job fails under 85 % lines (see [`.github/workflows/ci.yml`](../.github/workflows/ci.yml)).
