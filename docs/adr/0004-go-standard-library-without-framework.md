# ADR 0004: Go standard library, no framework

Status: accepted · 2026-10-13

## Context

The backend has two routes, one JSON body, a fixed error format and a few middleware concerns (panic recovery,
access logging, a security header). Since Go 1.22, `net/http.ServeMux` supports method and path patterns, and
`log/slog` provides structured logging in the standard library.

## Decision

Use only the standard library: `net/http` with method patterns, `encoding/json`, `log/slog`, `math`, `errors`,
and `net/http/httptest` for tests. No third-party modules, so `go.mod` has no `require` block.

The code is layered:

- `internal/calculator`: the pure domain, with no HTTP imports.
- `internal/httpapi`: the transport (strict decoding, validation, error mapping, middleware).
- `cmd/server`: configuration and startup.

## Alternatives considered

- **Gin, Echo or Fiber.** Convenient binding and routing, but binding is lenient by default (unknown fields,
  type coercion) and would need to be tightened anyway. They add dependencies to audit and a framework idiom that
  a reviewer must know to read the code.
- **chi.** Small and idiomatic, but since Go 1.22 its main benefit, method-aware routing, is built in.
- **A validation library** (for example `go-playground/validator`). Two fields do not justify reflection-based
  tags; explicit checks are shorter and clearer about which error code each failure produces.

## Consequences

- Zero supply-chain surface on the backend and a fast, reproducible build.
- Strict JSON handling is explicit: an exact key allowlist (decoding into a map, because `encoding/json` matches
  struct fields case-insensitively, which `DisallowUnknownFields` does not prevent), a trailing-data check and
  per-operand parsing.
- A few things a framework would give for free are written by hand: a problem+json 405 with `Allow` under
  `/api/` (the default mux 405 is plain text) and a small middleware chain. Each is a few lines and tested.
- Needs Go 1.22 or newer for method patterns; `go.mod` declares `go 1.27.2`, the first 1.27 release without
  the `net/http` vulnerabilities `govulncheck` reported for 1.27.0.
