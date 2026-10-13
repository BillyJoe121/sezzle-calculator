# ADR 0002: One calculations endpoint with problem+json errors

Status: accepted · 2026-10-13

## Context

The service exposes seven operations with different arities (six binary, one unary). Both layers need one
predictable request shape and one predictable error shape, and the frontend must be able to tell errors apart
reliably without parsing human-readable text.

## Decision

- A single resource: `POST /api/v1/calculations` with `{"operation": "<id>", "operands": [<numbers>]}`. The
  response echoes `operation` and `operands` and adds `result`. The path is versioned (`/v1/`).
- The operation id selects a strategy from a registry that maps each id to its arity and function.
- Errors use RFC 9457 `application/problem+json` with `type: about:blank`, a `title` equal to the HTTP reason
  phrase, `status`, a human `detail` and a stable machine-readable `code` (`DIVISION_BY_ZERO`, ...).
- Malformed or invalid requests are 400; well-formed requests the math rejects are 422.

## Alternatives considered

- **One endpoint per operation** (`/api/add`, `/api/divide`, ...). Familiar, and each handler is trivial, but it
  multiplies routes, duplicates validation, puts verbs in URLs and makes arity a per-route special case. Adding an
  operation would mean a new route, handler and client function instead of one registry entry.
- **`GET` with query parameters** (`/api/divide?a=10&b=4`). Cacheable, but numbers as strings lose JSON typing
  and invite locale and encoding issues; a calculation request is not a resource lookup.
- **Custom error envelope** (`{"error": {"code", "message"}}`). Equally usable, but non-standard; problem+json is
  an IETF standard with a registered media type that clients and tooling recognize.
- **Only HTTP status codes.** Not enough: three different 422 causes need different messages in the UI.

## Consequences

- Adding an operation is one registry entry and its tests on the backend, one list entry in the frontend and an
  `enum` value plus an example in the contract.
- The frontend maps `code` to its own messages; `detail` can change without breaking clients.
- The request schema is a `oneOf` over binary and unary operations, so arity is visible in the contract itself.
- Echoing the operands lets the UI render "10 ÷ 4 = 2.5" from the response alone.
