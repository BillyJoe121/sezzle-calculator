# Change record

Task: ac3c786e-1660-486e-af02-51428e18cddc
Initial base: f155105e68169ba668e38762c24db81706edd2f3
Branch: feat/frontend-ui

## Intent
Build the React + TypeScript frontend for the Sezzle Calculator in frontend/, consuming POST /api/v1/calculations exactly as docs/api/openapi.yaml and docs/api/examples define. TDD, accessible (WCAG 2.2 AA), AntiSlop copy, coverage >= 85% lines. Agent mode: simple (user answer).

## Specification
{
  "goal": "One responsive page with an explicit-operand form (ADR 0005) that calls POST /api/v1/calculations on a relative URL and shows the formatted result or a message mapped from the problem code, built test-first against docs/api/examples (contract: docs/api/openapi.yaml).",
  "risk": "medium",
  "acceptanceCriteria": [
    "Form order per ADR 0005: operand A, operation picker (native radios styled as buttons, arrow keys move selection), operand B, Calculate and Clear.",
    "Operand labels per operation: add/subtract/multiply First number/Second number; divide Dividend/Divisor; power Base/Exponent; sqrt Number; percentage Percent/Of.",
    "parseOperand trims and accepts ^[+-]?(\\d+\\.?\\d*|\\.\\d+)([eE][+-]?\\d+)?$; rejects empty, decimal comma, Infinity/NaN/other text, more than 32 characters and values that overflow float64, each with a clear message.",
    "Invalid operands block the request, show the message next to the field with aria-invalid, aria-describedby and role=alert, and focus moves to the first invalid field.",
    "Enter submits; while submitting Calculate is aria-disabled and aria-busy (kept focusable) and further submissions are ignored; a new submission or Clear aborts the previous request and unmount aborts the pending one.",
    "Selecting sqrt hides operand B and clears its error; Clear returns to the initial state.",
    "Success renders the full expression from the response operands in a persistent role=status aria-live=polite region (10 ÷ 4 = 2.5, √16 = 4, 15% of 200 = 30); a negative second operand is parenthesised.",
    "Server errors render in role=alert with an English message per contract code; network, timeout and unexpected responses show a retryable generic message; detail is never shown.",
    "Domain rules (division by zero, sqrt of negatives, overflow) are decided by the backend; the UI only shows the mapped message.",
    "formatNumber: up to 12 significant digits, trailing zeros removed, decimal for 0 or |x| in [1e-6, 1e12), exponential otherwise; 0.30000000000000004 shows as 0.3; never -0.",
    "calculate never throws and returns { ok: true, value } or { ok: false, error: { kind: problem|network|timeout|unexpected|aborted, code?, message } } with an 8 s timeout; a 2xx body for a different operation or operand count is unexpected.",
    "Client tests use MSW handlers built from docs/api/examples via import.meta.glob; coverage >= 85% lines enforced by threshold.",
    "Single CSS file with tokens, light and dark via prefers-color-scheme, forced-colors support for the selected operation, mobile-first single column from 320 px, targets >= 44 px, visible focus, prefers-reduced-motion, AA contrast, system fonts, no external fonts or CDNs, no em-dashes in UI copy.",
    "Exact dependency versions (.npmrc save-exact), package-lock.json committed, only the listed dev dependencies added.",
    "App.tsx renders the Calculator inside main.page under the h1 Calculator."
  ],
  "preservedBehaviors": [
    "docs/api/ is untouched (read-only in this branch).",
    "No changes outside frontend/, deuda tecnica/ and the Frontend section of docs/architecture.md.",
    "backend/ and the backend sections of docs/ merged from main (ea24883) are untouched."
  ],
  "sourceDocuments": [
    "docs/spec.md",
    "docs/architecture.md",
    "docs/adr/0003-float64-numeric-model-with-client-formatting.md",
    "docs/adr/0005-explicit-operand-form-ui.md"
  ],
  "documentHashes": [
    {
      "path": "docs/spec.md",
      "hash": "752fdb0d856492188e7390e47b9f82e2fa7abb595ddcee01ca08b521b658a3c2"
    },
    {
      "path": "docs/architecture.md",
      "hash": "e534674a187e14f1460966e77f678802240db0c4624dc3a34a2dd3d194eb84a3"
    },
    {
      "path": "docs/adr/0003-float64-numeric-model-with-client-formatting.md",
      "hash": "a8705d25e937cda125be5e1bb0c36dafdec6056322d24639cad2add4d1905c2a"
    },
    {
      "path": "docs/adr/0005-explicit-operand-form-ui.md",
      "hash": "45c2ea3ff998896eacc957863af3e7523a1d8e84080832992c194a21e8d57aa6"
    }
  ],
  "decisions": [
    "formatNumber uses [1e-6, 1e12) because docs/spec.md and ADR 0003 say so; the original prompt said 1e15 and the spec wins.",
    "Review S2: aria-disabled instead of native disabled so keyboard focus stays on Calculate; spec and ADR 0005 wording 'submission disabled while pending' remains true in behavior.",
    "Review S1: field errors use role=alert so validation is announced when focus does not move.",
    "Percent/Of labels kept verbatim as required by the task prompt despite the reviewer nit.",
    "Shared-doc name drift recorded as debt doc-9c4f7945 for task 4."
  ],
  "acceptedAt": "2026-10-14T01:53:23.481Z"
}

## Plan
{
  "scope": [
    "frontend/src/App.tsx",
    "frontend/src/App.test.tsx",
    "frontend/src/index.css",
    "frontend/index.html",
    "frontend/package.json",
    "frontend/README.md",
    "frontend/src/features/calculator/Calculator.tsx",
    "frontend/src/features/calculator/Calculator.test.tsx",
    "frontend/src/features/calculator/Calculator.a11y.test.tsx",
    "frontend/src/features/calculator/ResultPanel.tsx",
    "frontend/src/features/calculator/ResultPanel.test.tsx",
    "frontend/src/features/calculator/OperationPicker.tsx",
    "frontend/src/features/calculator/OperandField.tsx",
    "frontend/src/features/calculator/useCalculator.ts",
    "frontend/src/features/calculator/errorMessages.ts",
    "frontend/src/features/calculator/operations.ts",
    "frontend/src/features/calculator/validation.ts",
    "frontend/src/features/calculator/validation.test.ts",
    "frontend/src/api/calculatorClient.ts",
    "frontend/src/api/calculatorClient.test.ts",
    "frontend/src/lib/formatNumber.ts",
    "docs/architecture.md",
    "deuda tecnica/index.md",
    "deuda tecnica/Documentacion.md",
    "deuda tecnica/Pruebas y confiabilidad.md",
    "deuda tecnica/paginas/documentation/001.md",
    "deuda tecnica/paginas/testing/001.md",
    "deuda tecnica/registry.json",
    "deuda tecnica/registros/doc-9c4f7945-58ca-5ad6-8c93-37ec297aaf19.json",
    "deuda tecnica/registros/test-827d163b-4413-58c8-81db-9c3002ae5994.json",
    "deuda tecnica/registros/test-d12065fc-028e-5b3f-8969-5906e397f5e9.json"
  ],
  "steps": [
    {
      "id": "p0-base",
      "title": "Done in checkpoint 0597706: coordinator scaffold, exact deps, vite/vitest config, api/types.ts, operations.ts, test setup, fixture loader and MSW server",
      "checks": [
        "lint",
        "typecheck"
      ]
    },
    {
      "id": "p1-workers",
      "title": "Done in checkpoint 0597706: worker 1 client/validation/formatNumber and worker 2 errorMessages/useCalculator/OperationPicker/OperandField/index.css, TDD",
      "checks": [
        "test-coverage",
        "typecheck"
      ]
    },
    {
      "id": "p2-worker",
      "title": "Done: forge-sonnet-high worker built ResultPanel, Calculator and integration tests",
      "checks": [
        "test-coverage",
        "lint"
      ]
    },
    {
      "id": "p3-integrate",
      "title": "Coordinator: App.tsx renders Calculator, App.test.tsx; README and Frontend section of docs/architecture.md",
      "checks": [
        "build",
        "typecheck"
      ]
    },
    {
      "id": "p4-checks",
      "title": "Worker 3 (forge-haiku-high) ran lint, typecheck, coverage, build, npm audit --omit=dev and line counts",
      "checks": [
        "lint",
        "typecheck",
        "test-coverage",
        "build"
      ]
    },
    {
      "id": "p5-review",
      "title": "Reviewer (forge-sonnet-max) review; coordinator resolves S1-S4 and selected nits test-first, records remaining debt, visual check with headless Edge",
      "checks": [
        "test-coverage",
        "lint",
        "typecheck",
        "build"
      ]
    }
  ],
  "checks": [
    {
      "id": "lint",
      "kind": "npm-script",
      "cwd": "frontend",
      "script": "lint"
    },
    {
      "id": "typecheck",
      "kind": "npm-script",
      "cwd": "frontend",
      "script": "typecheck"
    },
    {
      "id": "test-coverage",
      "kind": "npm-script",
      "cwd": "frontend",
      "script": "test"
    },
    {
      "id": "build",
      "kind": "npm-script",
      "cwd": "frontend",
      "script": "build"
    }
  ],
  "beforeImages": [
    {
      "path": "frontend/src/App.tsx",
      "hash": "18a137cef9d87c4d25f456a1b1a008728439e9736146737eaad6f3b72cd665c3",
      "absent": false
    },
    {
      "path": "frontend/src/App.test.tsx",
      "hash": "d58aea41066fb71976c35abd5d151b41a4b226210aedfe2f17ad2941b5915194",
      "absent": false
    },
    {
      "path": "frontend/src/index.css",
      "hash": "1cf9ac3be5734527f8c7e9260e5983222c12f9687621a0f22ecbb8adcd35eff7",
      "absent": false
    },
    {
      "path": "frontend/index.html",
      "hash": "9ed5bef66720591663d47c548fd07fe5247b99c559b4e579bdaa700ecacdecf7",
      "absent": false
    },
    {
      "path": "frontend/package.json",
      "hash": "5a694c82fd10c87c4db91e17ba9efa60eb9130cab4d22b3471473cf5234cd081",
      "absent": false
    },
    {
      "path": "frontend/README.md",
      "hash": "ea0e1c3eaae403ddbae9cf22216893a9d6dcb883760172610ecdde2530d629e5",
      "absent": false
    },
    {
      "path": "frontend/src/features/calculator/Calculator.tsx",
      "hash": "a697cd6ac6b964857ffae092a609416d4face41d28ced5b09aa5167fc7b6a308",
      "absent": false
    },
    {
      "path": "frontend/src/features/calculator/Calculator.test.tsx",
      "hash": "46621ef5772d76d7eb6bef84a9d91bb61449096715f152b9c61fa77301c4c728",
      "absent": false
    },
    {
      "path": "frontend/src/features/calculator/Calculator.a11y.test.tsx",
      "hash": "0954dccac021d615474e2b4eb04ebfe48d8877064560eec68c13d18ada0ec498",
      "absent": false
    },
    {
      "path": "frontend/src/features/calculator/ResultPanel.tsx",
      "hash": "a6c1b04f71694cfcb18ea8a3b4e202456823313527c577b26cbc3ba162a98660",
      "absent": false
    },
    {
      "path": "frontend/src/features/calculator/ResultPanel.test.tsx",
      "hash": "6a2c7bc1d57f08dda24daa22a45862c3dbeac04fe58edac0960f114f2378e3f0",
      "absent": false
    },
    {
      "path": "frontend/src/features/calculator/OperationPicker.tsx",
      "hash": "251896021b7a5e34b9c01d3e1ee47b75774eea9c1e19bcf95283c93a808187e6",
      "absent": false
    },
    {
      "path": "frontend/src/features/calculator/OperandField.tsx",
      "hash": "d33647a6211da0b31fbd285caf847de693dc988c29a8981a471ae50c3aeaa6cd",
      "absent": false
    },
    {
      "path": "frontend/src/features/calculator/useCalculator.ts",
      "hash": "43174b866a6f5ac2df801c66d67ec2be37891910e25ebcebef7a450df800a61d",
      "absent": false
    },
    {
      "path": "frontend/src/features/calculator/errorMessages.ts",
      "hash": "3ab5ba88f777ac6850101dd1f4d75667749b0a115f33cb3d704736e9ae21c9bc",
      "absent": false
    },
    {
      "path": "frontend/src/features/calculator/operations.ts",
      "hash": "5cc3d402f8f30a62d77ec5d7b9f684511858b5aeffa2574fc853631bb053bf48",
      "absent": false
    },
    {
      "path": "frontend/src/features/calculator/validation.ts",
      "hash": "168abb49023d6382c66838df5431c9e38ec07542ceb8bc96dd547e0ee994c048",
      "absent": false
    },
    {
      "path": "frontend/src/features/calculator/validation.test.ts",
      "hash": "72ca49e4c00a905120a68bbe34b89f44c15e7d4dee977b0a08be78cbd6b9f124",
      "absent": false
    },
    {
      "path": "frontend/src/api/calculatorClient.ts",
      "hash": "9037693ab9bbb90bfce763c151f293d44252c81ce62fce19ec82b6aaf923d880",
      "absent": false
    },
    {
      "path": "frontend/src/api/calculatorClient.test.ts",
      "hash": "3f5cbc0c1372c6ed2e553c73aada1933356e6ce500774878e19bda2224c45b54",
      "absent": false
    },
    {
      "path": "frontend/src/lib/formatNumber.ts",
      "hash": "1ccb877e82aef9f34fe444856a46464596a1dd0aba96487d14a686629589045b",
      "absent": false
    },
    {
      "path": "docs/architecture.md",
      "hash": "e534674a187e14f1460966e77f678802240db0c4624dc3a34a2dd3d194eb84a3",
      "absent": false
    },
    {
      "path": "deuda tecnica/index.md",
      "hash": "de4e188a8d4313a8fd1b03f5f6a73e99bdc4ad8863dc6fd4978235c76de70bc2",
      "absent": false
    },
    {
      "path": "deuda tecnica/Documentacion.md",
      "hash": "c823f1533e47fa328331d543f39ff7c52cf4a82c5ee3ecb100e2dd06f0d6958d",
      "absent": false
    },
    {
      "path": "deuda tecnica/Pruebas y confiabilidad.md",
      "hash": "bf4ef48e88eed9d08d48e4e91339f352639692b70e7b941ce5b47c6b78967521",
      "absent": false
    },
    {
      "path": "deuda tecnica/paginas/documentation/001.md",
      "hash": "304f1e3707d079bdecc245a356e20619632b620d5f841b69d828e19fd8ac7d5c",
      "absent": false
    },
    {
      "path": "deuda tecnica/paginas/testing/001.md",
      "hash": "5a5e81f027ca6cec7b2f3c86252c94c3983dedd0815321a405cb7a14004c9873",
      "absent": false
    },
    {
      "path": "deuda tecnica/registry.json",
      "hash": "b5fef6c047f44dc8a53c38cb6b8fe542dc89ffd8f6054c83ff08e6f770484845",
      "absent": false
    },
    {
      "path": "deuda tecnica/registros/doc-9c4f7945-58ca-5ad6-8c93-37ec297aaf19.json",
      "hash": "cd5689591bede66df7dcaf5bac866c512d57ff13ec4b2641e716e478ac380cf2",
      "absent": false
    },
    {
      "path": "deuda tecnica/registros/test-827d163b-4413-58c8-81db-9c3002ae5994.json",
      "hash": "5656a577af505d967d974c99ea4af85f97e88bebb1afc280ea81c6bb82eb32b5",
      "absent": false
    },
    {
      "path": "deuda tecnica/registros/test-d12065fc-028e-5b3f-8969-5906e397f5e9.json",
      "hash": "0842ce95cc41a04038c38c9e88b3a425e66654d99d753ce5d36afe42da3a8e2c",
      "absent": false
    }
  ],
  "acceptedAt": "2026-10-14T01:54:07.574Z"
}

## Verification
- lint: exit 0; fingerprint 38747a164e02ca6e255506b56d7aebbca7429aa214f130c8b8097ba19a1a3696; receipt 392ec035-a88e-488f-8705-c09917135508
- typecheck: exit 0; fingerprint 38747a164e02ca6e255506b56d7aebbca7429aa214f130c8b8097ba19a1a3696; receipt 02e9d73d-fb96-4bfd-a150-b6ef395c0e31
- test-coverage: exit 0; fingerprint 38747a164e02ca6e255506b56d7aebbca7429aa214f130c8b8097ba19a1a3696; receipt e515508f-2054-4b75-bea2-95978ce176f7
- build: exit 0; fingerprint 38747a164e02ca6e255506b56d7aebbca7429aa214f130c8b8097ba19a1a3696; receipt 8872750e-d56f-4705-b091-17107daf5a1e

## Review
Independent review by forge-sonnet-max (code-review-and-quality, WCAG 2.2 AA, AntiSlop gate, ponytail), no edits. Result: no blockers; S1 validation errors silent to AT on Enter-submit (4.1.3) -> fixed with role=alert on field errors; S2 native disabled dropped keyboard focus to body -> fixed with aria-disabled + submit guard, verified by Calculator.a11y.test.tsx; S3 README backend-down claim wrong -> corrected; S4 timeout unpinned (only surviving mutant of 18) -> pinned test. Nits fixed: response/request mismatch guard, negative operand parentheses, copy (comma, too large, INVALID_OPERANDS, DOMAIN_ERROR), forced-colors selected state, favicon, engines, FormEvent import, no-op margins. Kept by decision: Percent/Of labels (task requires verbatim), arity vs operandLabels.length, aborted kind. Debt: test-827d163b (iOS keypad, suspected), test-d12065fc (result below the fold on short phones, verified by reviewer). AntiSlop gate: conditional FAIL on S1/S2 in the review; both resolved, so PASS: no emoji, no filler, no Oops phrasing, no em-dashes in UI copy, one accent, documented direction in index.css, every control has visible feedback. WCAG 2.2 AA: reviewer table passes all relevant SC in tested scope; 4.1.3 failure resolved. Contrast computed: minimum text 6.07:1, control borders >= 3.17:1, focus ring >= 6.23:1, light and dark. Visual check by coordinator: headless Edge 320/375/1280 light and dark, no horizontal scroll, smallest target 48 px, validation focuses operand A, sqrt hides operand B. npm audit --omit=dev: 0 vulnerabilities (run directly). Largest hand-maintained file 458 lines. docs/api and backend unchanged versus main.

## Delivery
Task 3 frontend complete on feat/frontend-ui: React 19 + TypeScript strict app in frontend/ calling POST /api/v1/calculations through a never-throwing client, explicit-operand form per ADR 0005, accessible (WCAG 2.2 AA in tested scope), AntiSlop copy, 187 tests, 100% line coverage (threshold 85%), build 228.41 kB JS / 71.84 kB gzip, npm audit 0. Review findings S1-S4 resolved; remaining debt recorded (test-827d163b, test-d12065fc, doc-9c4f7945).

## Arquitectura
- **Modelo de datos:** Contract mirror in frontend/src/api/types.ts: Operation and ErrorCode as literal unions derived from const arrays, CalculationRequest/CalculationResponse/Problem (RFC 9457), and CalculateResult as a discriminated union { ok: true, value } | { ok: false, error: CalculatorError } with kind problem|network|timeout|unexpected|aborted. No persistence.
- **Estructuras de datos:** Operation catalog OPERATION_LIST (array of OperationInfo with symbol, arity, operand labels tuple and an expression renderer) in features/calculator/operations.ts; Record<ErrorCode, string> and Record<CalculatorErrorKind, string> lookup tables in errorMessages.ts; FieldErrors object for per-field validation messages in Calculator.tsx.
- **Patrones:** Result type instead of exceptions (calculatorClient.ts); reducer state machine via useReducer (useCalculator.ts: idle -> submitting -> success|error, reset); AbortController per request for cancellation (supersede, Clear, unmount) plus a timeout controller; type guards for runtime response validation; presentational components free of fetch; table-driven lookup for copy; contract fixtures as MSW handlers (test/contractExamples.ts, import.meta.glob).
- **Flujo e integraciones:** Calculator form -> parseOperand per visible field (format only) -> useCalculator.submit -> calculate() POST /api/v1/calculations (relative URL; Vite proxies /api and /healthz to :8080 in dev, Go serves the build in production per ADR 0006) -> interpret status and body (2xx must match request operation and operand count; problem+json code -> problem; otherwise unexpected) -> reducer -> ResultPanel renders formatNumber expression in role=status or mapped message in role=alert.
- **Contratos:** Consumes docs/api/openapi.yaml unchanged: request { operation, operands }, 200 { operation, operands, result }, errors application/problem+json branched on code only (detail never shown). Public module interfaces: calculate(request, signal?) : Promise<CalculateResult>; parseOperand(raw) : ParseResult; formatNumber(value) : string (12 significant digits, exponential outside [1e-6, 1e12) per ADR 0003); useCalculator() : { state, submit, reset }.
- **Estado y persistencia:** Form values (operation, operand texts, field errors) are local useState in Calculator; request lifecycle is a useReducer discriminated union in useCalculator with the active AbortController in a ref. Nothing is persisted: no localStorage, cookies or global store; Clear and reload return to the initial state.

Mechanical receipts do not prove that declared requirements or review judgments are complete.
