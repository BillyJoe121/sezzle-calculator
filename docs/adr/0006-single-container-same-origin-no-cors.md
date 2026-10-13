# ADR 0006: Single container, same origin, no CORS

Status: accepted · 2026-10-13

## Context

The frontend calls the backend from the browser. If the page and the API are served from different origins (for
example `:5173` and `:8080`), the browser enforces CORS and the backend must emit and test CORS headers. The
assessment also suggests a Dockerfile that runs everything together.

## Decision

- **Development:** the Vite dev server (`:5173`) proxies `/api` and `/healthz` to `http://localhost:8080`. The
  browser only ever talks to `:5173`.
- **Container:** one multi-stage image. Node builds the frontend, Go builds a static binary, and the final image
  runs the Go server on port 8080 with `STATIC_DIR` pointing at the built frontend. The SPA and the API share one
  origin.
- The frontend always uses relative URLs (`/api/v1/calculations`). CORS is not enabled, and this is documented.

## Alternatives considered

- **Two containers (nginx for the SPA, Go for the API) with docker compose.** A common production layout, but it
  adds a reverse proxy configuration or CORS, a second image and a compose file for a two-route service.
- **Enable CORS on the backend.** Simple to add, but it is a security-relevant surface (allowed origins, methods,
  headers, preflight handling) that the same-origin setup makes unnecessary.
- **Configurable API base URL in the frontend** (`VITE_API_URL`). Only needed for cross-origin deployments, which
  are out of scope; relative URLs keep the build environment-independent.

## Consequences

- No CORS code, headers or preflight tests; the browser's same-origin policy is the default protection.
- `docker run -p 8080:8080` gives the complete application at one URL.
- The backend gains one small responsibility: serving static files when `STATIC_DIR` is set.
- Deploying the SPA on a CDN with the API elsewhere would need a new decision (CORS or an edge proxy).
