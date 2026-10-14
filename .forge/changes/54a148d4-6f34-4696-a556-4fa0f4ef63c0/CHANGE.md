# Change record

Task: 54a148d4-6f34-4696-a556-4fa0f4ef63c0
Initial base: f155105e68169ba668e38762c24db81706edd2f3
Branch: feat/backend-api

## Intent
Build the Go backend (backend/) for Sezzle Calculator against docs/api/openapi.yaml and docs/api/examples: stdlib-only module, cmd/server, internal/calculator (pure domain, strategy registry, sentinel errors), internal/httpapi (strict decoding, problem+json, middleware, static serving), contract test over the examples, README. docs/api is read-only.

## Specification
{
  "goal": "A stdlib-only Go service in backend/ that implements docs/api/openapi.yaml exactly: GET /healthz, POST /api/v1/calculations with the 7 operations, RFC 9457 problem+json errors with the contract's status/code table and validation order, optional static file serving, and a contract test that replays every docs/api/examples/*.json against the full handler.",
  "risk": "medium",
  "acceptanceCriteria": [
    "backend/go.mod declares module github.com/BillyJoe121/sezzle-calculator/backend, go 1.27 (the installed version, user decision), and no require block; docs/spec.md and docs/architecture.md state go 1.27.",
    "internal/calculator never imports net/http; exposes type Operation (7 constants), Arity(op) (int, error), Operations() []Operation in contract order, Calculate(op, operands) (float64, error) and sentinels ErrUnsupportedOperation, ErrInvalidOperandCount, ErrDivisionByZero, ErrDomain, ErrOutOfRange.",
    "Calculate: arity check; divide by 0 or -0 -> ErrDivisionByZero and power with base 0 and negative exponent -> ErrDomain, both before computing; NaN -> ErrDomain; +/-Inf -> ErrOutOfRange; -0 -> 0; power(0,0)=1; percentage falls back to (a/100)*b when a*b overflows.",
    "FuzzCalculate proves Calculate never returns NaN or +/-Inf with a nil error.",
    "httpapi.NewHandler(logger, staticDir) routes GET /healthz (also HEAD), POST /api/v1/calculations, any other method on that path -> 405 problem+json with Allow: POST, /api/ catch-all -> 404 problem+json, and / -> static files (GET and HEAD only, other methods plain 405, no directory listings) only when staticDir != \"\".",
    "Validation order: route/method -> Content-Type (415 before reading the body; application/json with only charset=utf-8 case-insensitive) -> 4096-byte limit (413, whole body read before parsing) -> JSON shape (INVALID_JSON: empty, malformed, not an object, null body, unknown or wrongly-cased keys, trailing data, operation not a string, operands not an array) -> operation (UNSUPPORTED_OPERATION: missing, null, empty, unknown) -> operands (INVALID_OPERANDS: missing/null, wrong count, element null/non-number/out of float64 range) -> evaluation (422).",
    "Every error is application/problem+json with exactly type=about:blank, title=http.StatusText(status), status, non-empty detail, code; written by a single writeProblem. 500 detail is generic and the cause is only logged.",
    "Success responses are application/json without parameters and echo operation and operands (with -0 normalized to 0) plus result.",
    "Middleware: recover -> 500 INTERNAL_ERROR problem and logs the panic; slog access log with method, path, status, duration; X-Content-Type-Options: nosniff on every response the handler writes.",
    "cmd/server: thin main delegating to run(ctx, getenv, stdout) error; PORT default 8080; STATIC_DIR optional and must be an existing directory; slog JSON logger; http.Server with ReadHeaderTimeout, ReadTimeout, WriteTimeout, IdleTimeout; graceful shutdown on signal.NotifyContext with a shutdown timeout.",
    "Contract test replays all 17 examples and compares status, Content-Type and parsed body (detail only non-empty).",
    "Coverage observed: internal/calculator >= 95%, internal/httpapi >= 85% (lines).",
    "gofmt -l empty, go vet clean, go test ./... passes, fuzz 20s finds nothing, smoke on :8080 succeeds, no hand-maintained file over 500 lines.",
    "docs/api/ unchanged; docs/architecture.md backend section and ADR 0004 match the implementation; backend/README.md documents requirements, run, test, coverage and structure."
  ],
  "preservedBehaviors": [
    "docs/api/ is not modified.",
    "frontend/ and shared root files (README, .gitignore) are not touched."
  ],
  "sourceDocuments": [
    "docs/spec.md",
    "docs/architecture.md",
    "docs/api/README.md"
  ],
  "documentHashes": [
    {
      "path": "docs/spec.md",
      "hash": "752fdb0d856492188e7390e47b9f82e2fa7abb595ddcee01ca08b521b658a3c2"
    },
    {
      "path": "docs/architecture.md",
      "hash": "1456d807afac837e90539d88dd94c28c0d57674946206a3b2d0a5c338c5ca16e"
    },
    {
      "path": "docs/api/README.md",
      "hash": "a10ed0a31f7f0d8068a87b3eef76d086be184821ff648cbeb7185944db31c2f1"
    }
  ],
  "decisions": [
    "User-approved: operands are decoded as []json.RawMessage and parsed one by one into *float64 instead of []*float64: probed on Go 1.27, []*float64 turns 1e400 or \"1\" into the same decode error as a non-string operation, which breaks the operation-before-operands order.",
    "User-approved: the body is decoded into map[string]json.RawMessage with an exact allowlist of keys {operation, operands} instead of struct + DisallowUnknownFields: probed on Go 1.27, encoding/json matches keys case-insensitively, so {\"OPERATION\":...} would be accepted despite additionalProperties:false.",
    "User decision: go.mod declares go 1.27.0 (installed) instead of the spec's go 1.22; docs/spec.md Stack row, docs/architecture.md and ADR 0004 are updated in this branch; task 4 must use a Go >= 1.27 image.",
    "The body is read fully through http.MaxBytesReader(4096) before parsing so 413 always wins over INVALID_JSON, per the validation order.",
    "Static files are registered on / without a method (GET / conflicts with the /api/ patterns in the Go 1.22+ mux), wrapped so methods other than GET and HEAD get a plain-text 405 with Allow: GET, HEAD, and served through a noListing FileSystem so directories without index.html answer 404 (review finding: a misconfigured STATIC_DIR would expose its tree).",
    "The error -> status/code mapping lives in one function, writeError in calculations.go; *problem is both the RFC 9457 document and the error type the decoder returns. Detail strings are fixed per code; only the arity detail names the operation and its arity. detail is not part of the contract.",
    "problem.Error() and the writeJSON marshal fallback stay although tests do not reach them: the first is required by the error interface, the second is error handling that Ponytail forbids removing.",
    "-race cannot run on this Windows host (CGO_ENABLED=0, no gcc): the test check runs without -race; CI on Linux (task 4) runs it.",
    "GitHub user for the module path: BillyJoe121 (user answer).",
    "Review nits left as is: generic DOMAIN_ERROR detail (detail is not contractual), unkeyed strategy literals, inline percentage closure, statusRecorder hiding io.ReaderFrom, no CSP/X-Frame-Options (not in spec), binding all interfaces (needed in the container).",
    "Spec revision 2026-10-13 (second): docs/spec.md security bullet now says nosniff applies to responses the handler writes and that static files have no directory listings."
  ],
  "acceptedAt": "2026-10-13T19:56:41.436Z"
}

## Plan
{
  "scope": [
    "backend/go.mod",
    "backend/README.md",
    "backend/cmd/server/main.go",
    "backend/cmd/server/main_test.go",
    "backend/internal/calculator/calculator.go",
    "backend/internal/calculator/calculator_test.go",
    "backend/internal/calculator/fuzz_test.go",
    "backend/internal/httpapi/routes.go",
    "backend/internal/httpapi/calculations.go",
    "backend/internal/httpapi/decode.go",
    "backend/internal/httpapi/problem.go",
    "backend/internal/httpapi/middleware.go",
    "backend/internal/httpapi/routes_test.go",
    "backend/internal/httpapi/calculations_test.go",
    "backend/internal/httpapi/decode_test.go",
    "backend/internal/httpapi/middleware_test.go",
    "backend/internal/httpapi/contract_test.go",
    "docs/architecture.md",
    "docs/spec.md",
    "docs/adr/0004-go-standard-library-without-framework.md",
    "deuda tecnica/registry.json",
    "deuda tecnica/index.md",
    "deuda tecnica/Documentacion.md",
    "deuda tecnica/Pruebas y confiabilidad.md",
    "deuda tecnica/paginas/documentation/001.md",
    "deuda tecnica/paginas/testing/001.md",
    "deuda tecnica/registros/doc-1d33fb61-5980-55dd-865f-2ad0755b5de4.json",
    "deuda tecnica/registros/test-c472d4d1-dacd-5a1d-8714-643250d3df81.json"
  ],
  "steps": [
    {
      "id": "foundation",
      "title": "Coordinator: go.mod (go 1.27, module github.com/BillyJoe121/sezzle-calculator/backend) and calculator.go skeleton with the fixed public signatures (stubs return errors) so both workers compile and start RED.",
      "checks": [
        "vet"
      ]
    },
    {
      "id": "calculator",
      "title": "Worker 1 (forge-sonnet-high): TDD of internal/calculator: table-driven tests per operation and edge case, FuzzCalculate, then the strategy registry and Calculate.",
      "checks": [
        "test",
        "coverage",
        "fuzz"
      ]
    },
    {
      "id": "httpapi",
      "title": "Worker 2 (forge-sonnet-high): TDD of internal/httpapi: decode, problem, middleware, routes, calculations, and contract_test over docs/api/examples.",
      "checks": [
        "test",
        "coverage"
      ]
    },
    {
      "id": "server",
      "title": "Coordinator: TDD of cmd/server (config from getenv, run with timeouts and graceful shutdown).",
      "checks": [
        "test",
        "smoke"
      ]
    },
    {
      "id": "integrate-docs",
      "title": "Coordinator: integrate workers, full suite green, backend/README.md, backend section of docs/architecture.md and the go line in docs/spec.md.",
      "checks": [
        "gofmt",
        "vet",
        "test",
        "line-cap"
      ]
    },
    {
      "id": "verify-review",
      "title": "Worker 3 (forge-haiku-high) runs section-6 checks natively (including the -race attempt and curl smoke) and reports; reviewer (forge-sonnet-max) reviews the full diff; coordinator resolves findings (no directory listings for static files, validation-order tests, order/registry invariant, non-hanging tests, errors.Is for io.EOF, ADR 0004 and doc accuracy, debt entries) and Forge runs every planned check.",
      "checks": [
        "gofmt",
        "vet",
        "test",
        "coverage",
        "fuzz",
        "smoke",
        "line-cap"
      ]
    }
  ],
  "checks": [
    {
      "id": "gofmt",
      "kind": "node-test",
      "cwd": null,
      "paths": [
        ".forge/tmp/backend-api/checks/gofmt.test.mjs"
      ]
    },
    {
      "id": "vet",
      "kind": "node-test",
      "cwd": null,
      "paths": [
        ".forge/tmp/backend-api/checks/vet.test.mjs"
      ]
    },
    {
      "id": "test",
      "kind": "node-test",
      "cwd": null,
      "paths": [
        ".forge/tmp/backend-api/checks/gotest.test.mjs"
      ]
    },
    {
      "id": "coverage",
      "kind": "node-test",
      "cwd": null,
      "paths": [
        ".forge/tmp/backend-api/checks/coverage.test.mjs"
      ]
    },
    {
      "id": "fuzz",
      "kind": "node-test",
      "cwd": null,
      "paths": [
        ".forge/tmp/backend-api/checks/fuzz.test.mjs"
      ]
    },
    {
      "id": "smoke",
      "kind": "node-test",
      "cwd": null,
      "paths": [
        ".forge/tmp/backend-api/checks/smoke.test.mjs"
      ]
    },
    {
      "id": "line-cap",
      "kind": "node-test",
      "cwd": null,
      "paths": [
        ".forge/tmp/backend-api/checks/line-cap.test.mjs"
      ]
    }
  ],
  "beforeImages": [
    {
      "path": "backend/go.mod",
      "hash": "293bf741da3a8bfbd7e8a3097ac9506efd5401b0b98ef28b2ab536ed9cb3743e",
      "absent": false
    },
    {
      "path": "backend/README.md",
      "hash": "73500052255649fb4f272bc91abece6df8058779bfb696966a0b9833ce535b42",
      "absent": false
    },
    {
      "path": "backend/cmd/server/main.go",
      "hash": "b8f175fb06cdd0da3e43cfc93af2dd97b9e0099dd77d50992115e7711ac73866",
      "absent": false
    },
    {
      "path": "backend/cmd/server/main_test.go",
      "hash": "050461dfa257546d8e533c3bcb48ef11ba75a47a549a4f50920c53fd6366500a",
      "absent": false
    },
    {
      "path": "backend/internal/calculator/calculator.go",
      "hash": "f3c5123a2eb88148770317a58608c5ed4228674db126889f1a3efa7d18d42668",
      "absent": false
    },
    {
      "path": "backend/internal/calculator/calculator_test.go",
      "hash": "61ad6ede3ac3f925d495e8074df1c73137431b7c101a90b8504faa9f5b59c7ef",
      "absent": false
    },
    {
      "path": "backend/internal/calculator/fuzz_test.go",
      "hash": "90115b09eade6723695ac40908da39a3b8771e1d21618613a52a9f0505aad862",
      "absent": false
    },
    {
      "path": "backend/internal/httpapi/routes.go",
      "hash": "bdec415b87b262c46ef3c11217f26afa09e0d781e952856e99780bba8c72742d",
      "absent": false
    },
    {
      "path": "backend/internal/httpapi/calculations.go",
      "hash": "370b2e73a79c6222c5970309d063059ee52afaa06ea71f48b72b2e0105a18cdd",
      "absent": false
    },
    {
      "path": "backend/internal/httpapi/decode.go",
      "hash": "021b32bcc3d7ffc9acb4a4c6a165a65bb0fc1acbcd67b103effde3edec1678f3",
      "absent": false
    },
    {
      "path": "backend/internal/httpapi/problem.go",
      "hash": "7deeab27b6037e298bd142d7a858d1a170dfe25e76c614e1f4c0b2e9865748fd",
      "absent": false
    },
    {
      "path": "backend/internal/httpapi/middleware.go",
      "hash": "a1fd9878b14c68acde3b61a7ffa67c55c278dcad25f46f68d224aec9e149e804",
      "absent": false
    },
    {
      "path": "backend/internal/httpapi/routes_test.go",
      "hash": "2e7856e55e99afc88dac449efe6ddb7670fa59c72612017516e43c0f0815d195",
      "absent": false
    },
    {
      "path": "backend/internal/httpapi/calculations_test.go",
      "hash": "7fc7b2e853b355bbb97cb23b4cfdde3f8e3d94b8ba1b5cbdaec570b3aa01a2a5",
      "absent": false
    },
    {
      "path": "backend/internal/httpapi/decode_test.go",
      "hash": "0af1581cf9aa0a1038ac1ba8d4a2869bb3085e960d86b5b3a8282e77c24512a2",
      "absent": false
    },
    {
      "path": "backend/internal/httpapi/middleware_test.go",
      "hash": "e878143d8205eae5906c3938168bb0de47c8fbcb9fc951cde923ad23359a0ddf",
      "absent": false
    },
    {
      "path": "backend/internal/httpapi/contract_test.go",
      "hash": "19c7e34ca3f4367cd4069f64707ab120be7c494938422ec07030021f91f9a372",
      "absent": false
    },
    {
      "path": "docs/architecture.md",
      "hash": "1456d807afac837e90539d88dd94c28c0d57674946206a3b2d0a5c338c5ca16e",
      "absent": false
    },
    {
      "path": "docs/spec.md",
      "hash": "752fdb0d856492188e7390e47b9f82e2fa7abb595ddcee01ca08b521b658a3c2",
      "absent": false
    },
    {
      "path": "docs/adr/0004-go-standard-library-without-framework.md",
      "hash": "84714ac5a0cb8da7531639964c0fbc0b58bde8604c9432d08e96144c7fecf4c7",
      "absent": false
    },
    {
      "path": "deuda tecnica/registry.json",
      "hash": "a562b04dcffb7b8413a4ad90aadb538d5bdae5262bbf2ca4605649ee20c57d0e",
      "absent": false
    },
    {
      "path": "deuda tecnica/index.md",
      "hash": "6bd895ce1ea381424879a78e7289d827e5653a09d78a547711171d2c94516e50",
      "absent": false
    },
    {
      "path": "deuda tecnica/Documentacion.md",
      "hash": "40cea8f40e904d6a124662d99b149f3f8d2a23bf1f8272583fe837381d05efbb",
      "absent": false
    },
    {
      "path": "deuda tecnica/Pruebas y confiabilidad.md",
      "hash": "9ae53194ef7d2fbf0535d590f173d23dcc9a7ecdfc4302ca6541582f9fdaa5cf",
      "absent": false
    },
    {
      "path": "deuda tecnica/paginas/documentation/001.md",
      "hash": "178ffc66bf16ca861b2c4340f22e3bac70f49736119dad3812ce42e501660ffd",
      "absent": false
    },
    {
      "path": "deuda tecnica/paginas/testing/001.md",
      "hash": "40304c4205e3aefb5b31904b9a5a8dce1e2683a7f5481c8ac794d269e1787360",
      "absent": false
    },
    {
      "path": "deuda tecnica/registros/doc-1d33fb61-5980-55dd-865f-2ad0755b5de4.json",
      "hash": "b52b505bd04e447c24c18a6a72993eb51df3e380df8dbf946c35ea496f6298ba",
      "absent": false
    },
    {
      "path": "deuda tecnica/registros/test-c472d4d1-dacd-5a1d-8714-643250d3df81.json",
      "hash": "b54766393f997e5f25a9be078f2824134dd8f37ff79da287f1e921d80da96c9d",
      "absent": false
    }
  ],
  "acceptedAt": "2026-10-13T19:56:55.135Z"
}

## Verification
- gofmt: exit 0; fingerprint 6e1a4051d6822720f193d8baca84c7f8be8f379ec54ba67c46b41cc561e5aa55; receipt 8202eb80-0c5a-4d92-8b9f-d5baefde4533
- vet: exit 0; fingerprint 6e1a4051d6822720f193d8baca84c7f8be8f379ec54ba67c46b41cc561e5aa55; receipt eb2188eb-c539-4e41-9182-d4e8a0caa9b3
- test: exit 0; fingerprint 6e1a4051d6822720f193d8baca84c7f8be8f379ec54ba67c46b41cc561e5aa55; receipt 1dae5a48-b34d-4e05-ae6a-728f6808a304
- coverage: exit 0; fingerprint 6e1a4051d6822720f193d8baca84c7f8be8f379ec54ba67c46b41cc561e5aa55; receipt b4fd3b17-e19c-44e0-a6d6-72e2605fa186
- line-cap: exit 0; fingerprint 6e1a4051d6822720f193d8baca84c7f8be8f379ec54ba67c46b41cc561e5aa55; receipt 6f2872a4-4f98-4917-8ba3-8e4b3b38bff5
- fuzz: exit 0; fingerprint 6e1a4051d6822720f193d8baca84c7f8be8f379ec54ba67c46b41cc561e5aa55; receipt df1590ee-0793-457d-82a8-89629d96c48d
- smoke: exit 0; fingerprint 6e1a4051d6822720f193d8baca84c7f8be8f379ec54ba67c46b41cc561e5aa55; receipt e9f46f04-af59-409b-93de-cfe3787b39b4

## Review
Independent review by forge-sonnet-max over the full diff (report only): no critical, high or medium findings; contract conformance verified for statuses, codes, Content-Type, validation order, problem shape, -0 and numeric edges; all 17 fixtures pass; tests stable under -count=5 -shuffle=on -cpu 1,2,8. Resolved low findings: static directory listings (noListing FileSystem, RED->GREEN), validation-order tests, order/registry invariant test, hang-prone main_test (pipe close + client timeout) and recoverer test assertion, errors.Is for io.EOF, stale ADR 0004, overstated nosniff wording, README duration unit. Registered as debt: doc-1d33fb61 (contract silent on /api redirect, path-cleaning 307s, duplicate keys, operand underflow, Content-Type leniency) and test-c472d4d1 (percentage fallback false overflow within ~1 ulp of MaxFloat64, verified by coordinator probe). Accepted nits: generic DOMAIN_ERROR detail, unkeyed strategy literals, inline percentage closure, statusRecorder hides io.ReaderFrom, no CSP/X-Frame-Options, binding all interfaces. Remaining risk: -race not run on this host (no cgo); CI on Linux in task 4 must run it. Worker 3 (forge-haiku-high) ran native checks: gofmt, vet, tests, coverage, fuzz 20s (~7.9M execs), curl smoke a-g, line counts; -race failed as expected ('-race requires cgo'). The reviewer called forge_task_preflight once and got an unrelated taskId 6e0763ab (no workflow/git actions taken).

## Delivery
Task 2 delivered on feat/backend-api: stdlib-only Go service in backend/ implementing docs/api/openapi.yaml (GET /healthz, POST /api/v1/calculations with 7 operations, RFC 9457 problems in the contract's validation order, optional static files without listings), contract test over all 17 examples, docs updated (backend/README.md, docs/architecture.md, docs/spec.md, ADR 0004), two low debt entries. All 7 Forge checks passed; -race not runnable on this host.

## Arquitectura
- **Modelo de datos:** Sin cambios de persistencia: el servicio no guarda estado. El modelo numerico es float64 (ADR 0003): operandos finitos, resultado finito y -0 normalizado a 0, en internal/calculator.
- **Estructuras de datos:** calculator.Operation (string con 7 constantes); strategy{arity int; eval func([]float64) (float64, error)} en un map registry mas el slice order (orden del contrato, invariante probada por test); httpapi.calculationRequest{operation, operands}; problem{Type, Title, Status, Detail, Code}, que es documento RFC 9457 y tipo error; calculationResponse{operation, operands, result}.
- **Patrones:** Strategy (registry de operaciones); errores centinela comprobados con errors.Is; un unico punto de mapeo error -> status/code (writeError en calculations.go); cadena de middleware nosniff -> accessLog -> recoverer -> mux; FileSystem envolvente noListing para estaticos; TDD con tests table-driven, fuzz y test de contrato dirigido por fixtures.
- **Flujo e integraciones:** POST /api/v1/calculations -> ServeMux -> decodeRequest (Content-Type 415, MaxBytesReader 4096 413, map con claves exactas y EOF INVALID_JSON, Arity UNSUPPORTED_OPERATION, conteo y *float64 por elemento INVALID_OPERANDS) -> calculator.Calculate (division por cero y 0^neg antes de calcular, normalize NaN/Inf/-0 -> 422) -> writeJSON 200 o writeError -> writeProblem. cmd/server: loadConfig(PORT, STATIC_DIR) -> run con timeouts -> apagado ordenado con signal.NotifyContext y 10 s.
- **Contratos:** Implementa docs/api/openapi.yaml sin modificarlo (git diff main -- docs/api vacio). API publica Go: httpapi.NewHandler(logger, staticDir) http.Handler; calculator.Calculate, Arity, Operations y 5 centinelas. Silencios del contrato registrados en doc-1d33fb61 (redireccion /api, 307 por limpieza de rutas, claves duplicadas, underflow, laxitud de Content-Type).
- **Estado y persistencia:** Sin estado entre peticiones; solo configuracion inmutable leida al arrancar (PORT, STATIC_DIR) y el logger slog JSON en stdout.

Mechanical receipts do not prove that declared requirements or review judgments are complete.
