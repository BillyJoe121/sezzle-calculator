# ADR 0001: Monorepo and contract-first development

Status: accepted · 2026-10-13

## Context

The assessment needs a React frontend and a Go backend delivered in one Git repository. The two are built in
parallel by separate agents in separate worktrees that cannot see each other's code. Without a shared, executable
definition of the API, each side would encode its own guess about edge cases, and the mismatch would only surface
at integration.

## Decision

- One repository with `backend/` (Go), `frontend/` (React, TypeScript, Vite) and `docs/`.
- The API is defined first in `docs/api/openapi.yaml` (OpenAPI 3.1), together with executable JSON examples in
  `docs/api/examples/`. Both test suites load those examples as fixtures: a Go contract test against the real
  router, and MSW handlers in the frontend.
- Implementation branches do not edit `docs/api/`; a contract change is its own branch, merged first.

## Alternatives considered

- **Two repositories.** Clean ownership boundaries, but the reviewer gets two clones and two READMEs, and the
  contract would need a third home or a copy in each. Rejected for a single-deliverable assessment.
- **Code-first (derive the spec from Go handlers).** Lower upfront cost, but the frontend could not start until
  the backend existed, which defeats parallel work.
- **Generated clients and servers from OpenAPI.** Strong typing across the boundary, but it adds a generator
  dependency and generated code to review for two endpoints. Hand-written types plus shared fixtures give the same
  safety at this size.

## Consequences

- Backend and frontend can be built and fully tested independently; integration is a merge, not a negotiation.
- Any behavior not captured in the contract is a contract bug, which keeps gaps visible.
- The examples must stay small and exact; numbers are compared by value, not by text.
- The contract is documentation a reviewer can read on its own, before any code.
