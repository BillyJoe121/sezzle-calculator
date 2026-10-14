# Backend

Go REST service for the Sezzle Calculator. It implements the contract in
[`docs/api/openapi.yaml`](../docs/api/openapi.yaml) using only the standard library.

## Requirements

- Go 1.27.2 or newer (`go.mod` declares `go 1.27.2`; with the default `GOTOOLCHAIN=auto` an older Go downloads it). No third-party modules.

## Run

```sh
cd backend
go run ./cmd/server                       # http://localhost:8080
PORT=9090 go run ./cmd/server             # another port
STATIC_DIR=../frontend/dist go run ./cmd/server   # also serve the built frontend at /
```

| Variable | Default | Meaning |
|----------|---------|---------|
| `PORT` | `8080` | TCP port, 0–65535. |
| `STATIC_DIR` | unset | Existing directory whose files are served at `/` (GET and HEAD, no directory listings). Unset: only the API and `/healthz`. |

Logs are JSON lines on stdout (`log/slog`): one access record per request with method, path, status and duration
(integer nanoseconds).
`SIGINT` or `SIGTERM` triggers a graceful shutdown with a 10-second timeout.

```sh
curl -s http://localhost:8080/healthz
curl -s -X POST http://localhost:8080/api/v1/calculations \
  -H 'Content-Type: application/json' -d '{"operation":"divide","operands":[10,4]}'
```

## Test

```sh
cd backend
go test ./...                                   # unit tests and the contract test
go test -race ./...                             # needs cgo (gcc); run in CI on Linux
go test -run='^$' -fuzz=FuzzCalculate -fuzztime=20s ./internal/calculator
go vet ./... && gofmt -l .
```

`internal/httpapi/contract_test.go` replays every file in [`docs/api/examples/`](../docs/api/examples/) through
the complete handler and compares status, `Content-Type` and body, so a new example is tested automatically.

## Coverage

```sh
go test -coverprofile=coverage.out ./... && go tool cover -func=coverage.out
```

Targets: `internal/calculator` ≥ 95 %, `internal/httpapi` ≥ 85 % (Go reports statement coverage).

## Structure

```text
cmd/server/            configuration (PORT, STATIC_DIR), logger, http.Server timeouts, graceful shutdown
internal/calculator/   pure domain: operation registry (strategy), Calculate, sentinel errors, normalization
internal/httpapi/      transport: routes, strict decoding, problem+json errors, middleware
  routes.go            NewHandler: routes, static files and the middleware chain
  calculations.go      POST /api/v1/calculations and the domain error → status/code mapping
  decode.go            Content-Type, 4096-byte limit, strict JSON shape, operation and operand parsing
  problem.go           RFC 9457 problem documents and the JSON writer
  middleware.go        nosniff header, access log, panic recovery
```

`internal/calculator` never imports `net/http`. Design notes are in
[`docs/architecture.md`](../docs/architecture.md) and the ADRs in [`docs/adr/`](../docs/adr/).
