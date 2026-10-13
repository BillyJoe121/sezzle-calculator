# API contract

This folder is the only thing the backend and the frontend share. Both sides are built and tested against it,
in parallel, without seeing each other's code.

| File | Role |
|------|------|
| [`openapi.yaml`](openapi.yaml) | OpenAPI 3.1 description: endpoints, schemas, error table, numeric model and validation order. Normative. |
| [`examples/`](examples/) | One JSON file per request/response case. Normative and executable: both test suites load them as fixtures. |

If the two disagree, that is a contract bug: stop and fix the contract first (see [Changing the contract](#changing-the-contract)).

## Reading the contract

Start with the `info.description` block of `openapi.yaml`. It holds the operation table, the numeric model,
the error table (status and stable `code` for every failure) and the validation order that decides which error
wins when a request has several problems. The schemas then give the exact shapes.

Key rules:

- `POST /api/v1/calculations` takes `{"operation": "<id>", "operands": [<numbers>]}` and returns
  `{"operation", "operands", "result"}`. `GET /healthz` returns `{"status": "ok"}`.
- Errors are `application/problem+json` with `type`, `title`, `status`, `detail` and `code`.
  Clients branch on `code` only. `detail` is human-readable and may change at any time.
- Numbers are float64. The server never returns NaN, ±Infinity or `-0`. Formatting for display is the client's job.

Lint the description with a pinned Redocly CLI, without installing anything in the project:

```sh
npx --yes @redocly/cli@2.54.2 lint docs/api/openapi.yaml
```

The two remaining warnings are known: `info-license` (no project license has been chosen) and
`operation-4xx-response` on `/healthz` (it has no 4xx response).

## Example fixture format

```json
{
  "name": "divide returns a divided by b",
  "request": {
    "method": "POST",
    "path": "/api/v1/calculations",
    "headers": { "Content-Type": "application/json" },
    "body": { "operation": "divide", "operands": [10, 4] }
  },
  "response": {
    "status": 200,
    "contentType": "application/json",
    "body": { "operation": "divide", "operands": [10, 4], "result": 2.5 }
  }
}
```

| Field | Meaning |
|-------|---------|
| `name` | Human-readable test name. The file name (without `.json`) is the stable case id. |
| `request.method`, `request.path` | Sent as is. |
| `request.headers` | Sent exactly; no other headers are implied. |
| `request.body` | `null`: no body. A string: sent as raw bytes, unchanged (used for malformed JSON). Anything else: serialized with a standard JSON encoder. |
| `response.status` | Expected HTTP status. |
| `response.contentType` | Expected media type, compared exactly. The server sends it without parameters. |
| `response.body` | Expected JSON body, compared as parsed values (numbers by value, not by text). |

How to compare a problem body: `type`, `title`, `status` and `code` must be equal; `detail` must be a non-empty
string, and its text is not compared.

## How the backend uses the fixtures

A contract test in `backend/internal/httpapi` (for example `contract_test.go`) reads every file in
`../../../docs/api/examples/` (the path is relative to the package directory, where `go test` runs) and runs one
table-driven subtest per file, named after the file:

1. Build the request with `httptest.NewRequest` from `method`, `path`, `headers` and `body`.
2. Serve it through the complete handler, with routing and middleware, using `httptest.NewRecorder`.
3. Assert the status, the `Content-Type` and the parsed body as described above.

A new example file is picked up automatically, so the backend cannot drift from the contract silently.

## How the frontend uses the fixtures

Tests in `frontend/` load the same files, for example with Vite's
`import.meta.glob('../../../docs/api/examples/*.json', { eager: true })` from `frontend/src/test/`, and turn them
into [MSW](https://mswjs.io/) request handlers:

- One handler for `POST /api/v1/calculations` looks up the fixture whose `request.body` deep-equals the
  intercepted JSON body and replies with its `status`, `contentType` and `body`.
- Fixtures the browser client can never produce are skipped: string bodies (`malformed-json`) and non-JSON
  content types (`unsupported-media-type`). `healthz` is not called by the UI.
- Component tests then assert what the user sees for every case: the formatted result
  (`0.30000000000000004` is shown as `0.3`) or the message mapped from each error `code`.
- A network failure is not a contract case; tests simulate it with MSW's `HttpResponse.error()`.

If Vite refuses to serve a file outside `frontend/` during development, allow the repository root in
`server.fs.allow`. Tests run through Vitest and only need the relative import.

## Changing the contract

- Feature branches that implement the backend or the frontend do not edit `docs/api/`. If they find a gap or a
  contradiction, they stop, report it and record it in `deuda tecnica/` instead of patching one side.
- A contract change goes on its own branch: update `openapi.yaml` and the examples together, lint, merge to
  `main`, then bring the change into each consumer branch.
- Prefer additive changes (a new operation, a new optional field). A new operation is one entry in the backend
  registry, one option in the frontend list, the `enum` values in `openapi.yaml` and at least one example.
