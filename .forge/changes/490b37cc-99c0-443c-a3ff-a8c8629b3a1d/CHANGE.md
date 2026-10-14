# Change record

Task: 490b37cc-99c0-443c-a3ff-a8c8629b3a1d
Initial base: 90cc92fb6f424eb6d9d0627b6977693ec1c641c2
Branch: feat/delivery

## Intent
Task 4: integration and delivery. Verify the already-merged backend and frontend end to end, add Dockerfile, .dockerignore, GitHub Actions CI, docs/coverage.md, final README, docs/ai/PROMPTS.md with the four original prompts, final docs/ai/WORKFLOW.md, and update shared docs (architecture, spec, AGENTS.md, ADRs) and documentation debt.

## Specification
{
  "goal": "Make the repository ready to deliver: verify the merged tree end to end, add a Docker image, CI, a coverage report, the final README and the AI workflow documentation, fix the Go standard library vulnerabilities found in review by moving to Go 1.27.2, then commit and push.",
  "risk": "medium",
  "acceptanceCriteria": [
    "Backend (gofmt -l, go vet, go test -count=1 -cover) and frontend (lint, typecheck, vitest run --coverage, build) checks pass on feat/delivery.",
    "E2E smoke: backend on :8080 and Vite on :5173; curl directly and through the proxy; real outputs saved; all processes stopped afterwards.",
    "Multi-stage Dockerfile (node:24.21.0-bookworm-slim, golang:1.27.2-bookworm, distroless static nonroot); .dockerignore excludes local state including **/.env and **/.env.*; Docker smoke builds, runs and curls /healthz, the API and /.",
    "CI workflow (push and pull_request, contents read, concurrency, SHA-pinned actions, Go coverage thresholds, artifacts, docker build) passes actionlint; real CI is checked after the push.",
    "backend/go.mod declares go 1.27.2 and the Dockerfile builds with golang:1.27.2-bookworm; govulncheck on backend/ reports no reachable vulnerability, or every remaining one is recorded as verified Vulnerabilidades debt. Debt vul-4fdf6bb3 is resolved when the scan is clean.",
    "Docs cite Go 1.27.2 where they cite the exact version (spec.md, architecture.md, ADR 0004, backend/README.md) and coverage.md/README show the numbers observed with it.",
    "Reviewer fixes: command blocks work when pasted from the repo root (README, coverage.md, architecture.md); the install-script claim mentions fsevents; README and AGENTS no longer say CI runs every check (govulncheck and npm audit are manual); WORKFLOW.md wording on parallel worktrees and STATIC_DIR listing corrected; missing static caching/compression recorded as suspected Rendimiento debt.",
    "docs/coverage.md, final README, docs/ai/PROMPTS.md, final docs/ai/WORKFLOW.md and updated shared docs as approved before; no hand-maintained file exceeds 500 lines; git log --graph shows the foundation, the two parallel branches and their merges.",
    "The work is committed on feat/delivery with Conventional Commits and pushed to origin (https://github.com/BillyJoe121/sezzle-calculator) after the user's explicit request."
  ],
  "preservedBehaviors": [
    "docs/api/ is untouched.",
    "No Go or TypeScript application code changes; in backend/ only the go directive in go.mod changes.",
    "Debt doc-1d33fb61, doc-b17a3c61, test-827d163b, test-d12065fc and test-c472d4d1 stay open.",
    "No force-push, rebase, reset, stash, branch or worktree deletion."
  ],
  "sourceDocuments": [
    "docs/spec.md"
  ],
  "documentHashes": [
    {
      "path": "docs/spec.md",
      "hash": "eab38c15cb690ad00b9f89eec3299400b06b43108eb89397556c9b05fe028895"
    }
  ],
  "decisions": [
    "User (2026-10-14): register the Go vulnerabilities, fix them with Go 1.27.2, stop the :8080 container, run the final checks, record remaining vulnerabilities as debt, apply the minor doc/config fixes, close in Forge, commit and push.",
    "O2: soften the CI wording instead of adding govulncheck/npm audit jobs, so a future advisory does not turn the delivered CI red; both are documented as manual commands.",
    "N1 (push and pull_request both trigger) kept: the evaluator sees CI on any pushed branch."
  ],
  "acceptedAt": "2026-10-14T07:41:32.160Z"
}

## Plan
{
  "scope": [
    "Dockerfile",
    ".dockerignore",
    ".github/workflows/ci.yml",
    ".gitignore",
    "README.md",
    "AGENTS.md",
    "docs/coverage.md",
    "docs/spec.md",
    "docs/architecture.md",
    "docs/adr/0004-go-standard-library-without-framework.md",
    "docs/adr/0006-single-container-same-origin-no-cors.md",
    "docs/ai/WORKFLOW.md",
    "docs/ai/PROMPTS.md",
    "docs/ai/prompts/Prompt 1 - Fundacion, contrato y arquitectura.docx",
    "docs/ai/prompts/Prompt 2 - Backend Go.docx",
    "docs/ai/prompts/Prompt 3 - Frontend React.docx",
    "docs/ai/prompts/Prompt 4 - Integracion y entrega.docx",
    "backend/go.mod",
    "backend/README.md",
    "frontend/README.md",
    "deuda tecnica/registry.json",
    "deuda tecnica/index.md",
    "deuda tecnica/Documentacion.md",
    "deuda tecnica/Pruebas y confiabilidad.md",
    "deuda tecnica/Vulnerabilidades.md",
    "deuda tecnica/Rendimiento.md",
    "deuda tecnica/paginas/documentation/001.md",
    "deuda tecnica/paginas/testing/001.md",
    "deuda tecnica/paginas/vulnerabilities/001.md",
    "deuda tecnica/paginas/performance/001.md",
    "deuda tecnica/registros/doc-9c4f7945-58ca-5ad6-8c93-37ec297aaf19.json",
    "deuda tecnica/registros/doc-cd1bf90f-871f-52c8-8e5d-e765f976014b.json",
    "deuda tecnica/registros/test-73515323-6808-55fc-8986-df71ccb1d429.json",
    "deuda tecnica/registros/vul-4fdf6bb3-c7b2-5e90-802d-f16711065570.json",
    "deuda tecnica/registros/perf-6385b81a-e08a-554a-8d9e-8ba0f07de33d.json"
  ],
  "steps": [
    {
      "id": "s1-go-bump",
      "title": "Raise backend/go.mod and the Dockerfile builder to Go 1.27.2, update the version in the docs, rerun vet, tests and govulncheck; resolve vul-4fdf6bb3 or record what remains",
      "checks": [
        "go-fmt",
        "go-vet",
        "go-test",
        "go-vuln"
      ]
    },
    {
      "id": "s2-review-fixes",
      "title": "Apply the reviewer's doc and config fixes (R2, O1, O2 wording, N2, N3, N4) and record O3 as suspected performance debt",
      "checks": [
        "ci-lint",
        "line-limit"
      ]
    },
    {
      "id": "s3-final-checks",
      "title": "Stop the :8080 container (user approved) and rerun every check: frontend, E2E, Docker, CI lint, git graph",
      "checks": [
        "fe-lint",
        "fe-typecheck",
        "fe-test-coverage",
        "fe-build",
        "e2e-smoke",
        "docker-smoke",
        "git-graph"
      ]
    },
    {
      "id": "s4-close",
      "title": "Review, delivery, development check, ready, delivery question, commit, add origin and push",
      "checks": [
        "git-graph"
      ]
    }
  ],
  "checks": [
    {
      "id": "go-fmt",
      "kind": "node-test",
      "cwd": null,
      "paths": [
        ".forge/tmp/delivery/gofmt.test.mjs"
      ]
    },
    {
      "id": "go-vet",
      "kind": "node-test",
      "cwd": null,
      "paths": [
        ".forge/tmp/delivery/vet.test.mjs"
      ]
    },
    {
      "id": "go-test",
      "kind": "node-test",
      "cwd": null,
      "paths": [
        ".forge/tmp/delivery/gotest.test.mjs"
      ]
    },
    {
      "id": "go-vuln",
      "kind": "node-test",
      "cwd": null,
      "paths": [
        ".forge/tmp/delivery/govulncheck.test.mjs"
      ]
    },
    {
      "id": "fe-lint",
      "kind": "npm-script",
      "cwd": "frontend",
      "script": "lint"
    },
    {
      "id": "fe-typecheck",
      "kind": "npm-script",
      "cwd": "frontend",
      "script": "typecheck"
    },
    {
      "id": "fe-test-coverage",
      "kind": "npm-script",
      "cwd": "frontend",
      "script": "test"
    },
    {
      "id": "fe-build",
      "kind": "npm-script",
      "cwd": "frontend",
      "script": "build"
    },
    {
      "id": "e2e-smoke",
      "kind": "node-test",
      "cwd": null,
      "paths": [
        ".forge/tmp/delivery/e2e.test.mjs"
      ]
    },
    {
      "id": "docker-smoke",
      "kind": "node-test",
      "cwd": null,
      "paths": [
        ".forge/tmp/delivery/docker.test.mjs"
      ]
    },
    {
      "id": "ci-lint",
      "kind": "node-test",
      "cwd": null,
      "paths": [
        ".forge/tmp/delivery/actionlint.test.mjs"
      ]
    },
    {
      "id": "line-limit",
      "kind": "node-test",
      "cwd": null,
      "paths": [
        ".forge/tmp/delivery/lines.test.mjs"
      ]
    },
    {
      "id": "git-graph",
      "kind": "node-test",
      "cwd": null,
      "paths": [
        ".forge/tmp/delivery/gitgraph.test.mjs"
      ]
    }
  ],
  "beforeImages": [
    {
      "path": "Dockerfile",
      "hash": "ceea94e51c53e81a3772d3d7ae4435d1d0058da8e1902a87658c25920b5678b2",
      "absent": false
    },
    {
      "path": ".dockerignore",
      "hash": "2b09af38891ca16d071398a955672e08dba95a9ebb6761a1f3a53608939f12c7",
      "absent": false
    },
    {
      "path": ".github/workflows/ci.yml",
      "hash": "cb2df7969462804441e30806f734e35d5770f371e2227e5014c39bf6ae800f1f",
      "absent": false
    },
    {
      "path": ".gitignore",
      "hash": "83956950d6044010bd25307035b8991478ffbbe4bb89e27651cc959524368aad",
      "absent": false
    },
    {
      "path": "README.md",
      "hash": "a23cf9e14a22b018fdf861ad2ed9ef5bc02b44a9949bfc2aa86560681db5c89c",
      "absent": false
    },
    {
      "path": "AGENTS.md",
      "hash": "36eecbaee6d91114698f7bb8952c15c34d3b19c779126168cd86d64ca3d43a49",
      "absent": false
    },
    {
      "path": "docs/coverage.md",
      "hash": "e65d23ad56c56b6bed2dbbab4384288b01ddb9b2a6e73b5bd57df3e177e311c9",
      "absent": false
    },
    {
      "path": "docs/spec.md",
      "hash": "eab38c15cb690ad00b9f89eec3299400b06b43108eb89397556c9b05fe028895",
      "absent": false
    },
    {
      "path": "docs/architecture.md",
      "hash": "40003b4b564f344477881625be2cffc2bef9a45e7f349fb208a8b3eddb3e9039",
      "absent": false
    },
    {
      "path": "docs/adr/0004-go-standard-library-without-framework.md",
      "hash": "62495321a8c3ec4270d30e3fa967e4e0ec0fbcfa2a7c260e986aea7b24ffebb7",
      "absent": false
    },
    {
      "path": "docs/adr/0006-single-container-same-origin-no-cors.md",
      "hash": "5f48f56a01d6b4430402081d69683dc9c7ce0b082f6e682147b9e8fa5dfec7f8",
      "absent": false
    },
    {
      "path": "docs/ai/WORKFLOW.md",
      "hash": "f3e139b5fb4ca707a0b27c478c408ef62d3d57b4510ab916b2784a5fd9319b9e",
      "absent": false
    },
    {
      "path": "docs/ai/PROMPTS.md",
      "hash": "6e9dbe045fb396e8c4fc515e5bd4ba46c252d91f030633cb052e21d9322d4c95",
      "absent": false
    },
    {
      "path": "docs/ai/prompts/Prompt 1 - Fundacion, contrato y arquitectura.docx",
      "hash": "6070769711041aecfff7c5257c9c04994d4cd6ce4c06b0d9d01a19f6a812c847",
      "absent": false
    },
    {
      "path": "docs/ai/prompts/Prompt 2 - Backend Go.docx",
      "hash": "1a6fd1b1b07721eef6502f2ea546bcb9076566ae70c2f1d16d296d25c3c893ba",
      "absent": false
    },
    {
      "path": "docs/ai/prompts/Prompt 3 - Frontend React.docx",
      "hash": "fd5d50d3d30a2ed2eeb26f98f07e18acc241d7ab912e36f399126961ed6a0aab",
      "absent": false
    },
    {
      "path": "docs/ai/prompts/Prompt 4 - Integracion y entrega.docx",
      "hash": "fb22894c293bc1050772a0faac1854a44e8b677389372f7c12835cf9a9f75ae7",
      "absent": false
    },
    {
      "path": "backend/go.mod",
      "hash": "771c08ef430f9027869542f786e07bfbbde0ebefba5ea418bfa7491dc8c95bcd",
      "absent": false
    },
    {
      "path": "backend/README.md",
      "hash": "35c881aab3bf3dc4ea8c9d5d8935c2c061e7766b3b5056933db85407343e5e96",
      "absent": false
    },
    {
      "path": "frontend/README.md",
      "hash": "07b0ee85fcb4633694895a944badb641aa000942f82f632224d1aad6284e0544",
      "absent": false
    },
    {
      "path": "deuda tecnica/registry.json",
      "hash": "fd236bf9056709cc3146a9107b1744878d2af3a9d914d1becd3ed3f3ce0e8cb8",
      "absent": false
    },
    {
      "path": "deuda tecnica/index.md",
      "hash": "4c6ab36d45589cd6dcbb23163df98673b0d660764b0806f7bef2be7600f22989",
      "absent": false
    },
    {
      "path": "deuda tecnica/Documentacion.md",
      "hash": "9be9cd8f348cf988dc8399889dd26536147abc2f76f456517313773a787a0172",
      "absent": false
    },
    {
      "path": "deuda tecnica/Pruebas y confiabilidad.md",
      "hash": "51afe3d0ba348cc8bd1133132746e742caadbb6a26c3d95045e1c06e04bbe88a",
      "absent": false
    },
    {
      "path": "deuda tecnica/Vulnerabilidades.md",
      "hash": "c2ca4eb9c0c8e69c762f1c032d478724695a01642eec233f1d7d3a3aa18f534f",
      "absent": false
    },
    {
      "path": "deuda tecnica/Rendimiento.md",
      "hash": "3aad1ae3209862a5637e04024c2161eea35025c0036152abf87aca2eb2dc74a7",
      "absent": false
    },
    {
      "path": "deuda tecnica/paginas/documentation/001.md",
      "hash": "ac4656bad42bc875a7183f74d4dd24d63b00d320c6f5f8812a7b4c105566ba1a",
      "absent": false
    },
    {
      "path": "deuda tecnica/paginas/testing/001.md",
      "hash": "4383be289c9776408d0a671cf89a9e464ee79c6304caceb9472d1a2c35d0f8e0",
      "absent": false
    },
    {
      "path": "deuda tecnica/paginas/vulnerabilities/001.md",
      "hash": "ee5586c07340ca53499f09c99c03cf87243f6210529e4e08a6057407ec207441",
      "absent": false
    },
    {
      "path": "deuda tecnica/paginas/performance/001.md",
      "hash": "1e6c9171d340ce913f5b8713bef6491203634aa97496bacc78d6e8cf66c3cfc6",
      "absent": false
    },
    {
      "path": "deuda tecnica/registros/doc-9c4f7945-58ca-5ad6-8c93-37ec297aaf19.json",
      "hash": "04aee06547d631500aa289f6cd47e49f150a8892af1ac8ba100546b55b2cafbf",
      "absent": false
    },
    {
      "path": "deuda tecnica/registros/doc-cd1bf90f-871f-52c8-8e5d-e765f976014b.json",
      "hash": "98e26e005c2612018e16f770bcb03f2334f7085533e2dedd9ff793bc45d04d8a",
      "absent": false
    },
    {
      "path": "deuda tecnica/registros/test-73515323-6808-55fc-8986-df71ccb1d429.json",
      "hash": "549db91d7a31fcac8077e0c1fa430dcfba130dfb4e09296bd4cddde0c271508a",
      "absent": false
    },
    {
      "path": "deuda tecnica/registros/vul-4fdf6bb3-c7b2-5e90-802d-f16711065570.json",
      "hash": "dc2893f47b53d0d8712628496f36d1192954ca8053a7a907850f6361331bce4a",
      "absent": false
    },
    {
      "path": "deuda tecnica/registros/perf-6385b81a-e08a-554a-8d9e-8ba0f07de33d.json",
      "hash": "346629e4769f2877986717525cd206e1b97d9944f22eeed0989acb842282d38a",
      "absent": false
    }
  ],
  "acceptedAt": "2026-10-14T07:41:48.559Z"
}

## Verification
- go-fmt: exit 0; fingerprint 6121b18d1d4fba75b29d9d664a385351cf22885489835fdd74388151148039ca; receipt 0c551b70-7ed8-4074-b9d3-14eb37f65b64
- go-vet: exit 0; fingerprint 6121b18d1d4fba75b29d9d664a385351cf22885489835fdd74388151148039ca; receipt 5fedc438-9db1-49a5-b835-4fee524047a2
- go-test: exit 0; fingerprint 6121b18d1d4fba75b29d9d664a385351cf22885489835fdd74388151148039ca; receipt 95b1e23b-41ff-4ad8-b242-f148857eb08e
- go-vuln: exit 0; fingerprint 6121b18d1d4fba75b29d9d664a385351cf22885489835fdd74388151148039ca; receipt 7d5c7698-2340-4f6d-b533-5fbbc542684d
- fe-lint: exit 0; fingerprint 6121b18d1d4fba75b29d9d664a385351cf22885489835fdd74388151148039ca; receipt 144bebb5-2303-4260-96c8-ed11286da7cb
- fe-typecheck: exit 0; fingerprint 6121b18d1d4fba75b29d9d664a385351cf22885489835fdd74388151148039ca; receipt 61856575-6a30-49a2-9e07-c74067aef934
- fe-test-coverage: exit 0; fingerprint 6121b18d1d4fba75b29d9d664a385351cf22885489835fdd74388151148039ca; receipt b3f46f66-0f50-467a-be0b-0c88a8a5df24
- fe-build: exit 0; fingerprint 6121b18d1d4fba75b29d9d664a385351cf22885489835fdd74388151148039ca; receipt afb62d20-2bb7-41be-99e9-8bb2de468458
- e2e-smoke: exit -1; fingerprint 6121b18d1d4fba75b29d9d664a385351cf22885489835fdd74388151148039ca; receipt e89b23e6-3a71-4d7b-be2c-f7908eea3df7
- e2e-smoke: exit 0; fingerprint 6121b18d1d4fba75b29d9d664a385351cf22885489835fdd74388151148039ca; receipt 2d77b1b6-8791-499d-8645-8f252bcb56c6
- docker-smoke: exit 0; fingerprint 6121b18d1d4fba75b29d9d664a385351cf22885489835fdd74388151148039ca; receipt fb131e4a-7665-4065-9503-1565e9910387
- ci-lint: exit 1; fingerprint 6121b18d1d4fba75b29d9d664a385351cf22885489835fdd74388151148039ca; receipt 7e670219-19fd-44e2-98cb-0f6c9b07a8b0
- line-limit: exit 0; fingerprint 6121b18d1d4fba75b29d9d664a385351cf22885489835fdd74388151148039ca; receipt 59c7cad5-d72e-49a7-803d-e42c461da7a8
- git-graph: exit 0; fingerprint 6121b18d1d4fba75b29d9d664a385351cf22885489835fdd74388151148039ca; receipt eeb12ead-04a4-40cc-935f-0e23acd349b1
- ci-lint: exit 0; fingerprint 6121b18d1d4fba75b29d9d664a385351cf22885489835fdd74388151148039ca; receipt f95563eb-d33b-4f33-95d8-d9dad2b77ada

## Review
Independent read-only review by forge-sonnet-max (previous chat): no Critical findings. R1 Go 1.27.0 stdlib vulnerabilities -> fixed (go 1.27.2, golang:1.27.2-bookworm; govulncheck v1.8.0 clean; vul-4fdf6bb3 resolved). R2 cd blocks failing from repo root -> fixed (cd ../frontend in README, coverage.md, architecture.md). R3 container on :8080 -> stopped with user approval. O1 fsevents install script -> wording fixed in Dockerfile and README. O2 CI does not run govulncheck/npm audit -> wording softened in README and AGENTS, both documented as manual (no new CI jobs so a future advisory does not break the delivered CI). O3 static caching/compression -> recorded as suspected performance debt perf-6385b81a. N1 duplicate push/PR runs -> kept on purpose. N2 .dockerignore -> **/.env and **/.env.*. N3, N4 WORKFLOW wording fixed. The coordinator reviewed the delta (go.mod directive, Dockerfile tag, docs) line by line. Residual risks: local vet ran with cmd/vet built from the 1.27.2 sources and local go test with -vet=off because Windows Application Control blocks the downloaded vet.exe; go test -race and the real GitHub Actions run are only verified after the push; the first e2e-smoke attempt timed out on a slow Edge start and passed on rerun (also passed locally in 21 s).

## Delivery
Task 4 delivery: Docker image, CI, coverage report, final README, PROMPTS.md with the 4 prompts, final WORKFLOW.md and updated shared docs; Go raised to 1.27.2 to remove 6 reachable net/http vulnerabilities (govulncheck clean); reviewer fixes applied; 13 checks passed (go-fmt, go-vet, go-test, go-vuln, fe-lint, fe-typecheck, fe-test-coverage, fe-build, e2e-smoke, docker-smoke, ci-lint, line-limit, git-graph). Debt: resolved doc-9c4f7945 and vul-4fdf6bb3; created doc-cd1bf90f, test-73515323 and perf-6385b81a (suspected).

## Arquitectura
- **Modelo de datos:** sin cambios.
- **Estructuras de datos:** sin cambios.
- **Patrones:** Multi-stage container build (Dockerfile: Node build -> Go static build -> distroless nonroot runtime) and a CI pipeline with SHA-pinned actions and fan-in (docker job needs backend and frontend) in .github/workflows/ci.yml.
- **Flujo e integraciones:** Delivery flow: one image serves the SPA from STATIC_DIR=/app/web and the API on :8080 (same origin, ADR 0006). CI: backend (gofmt, vet, test -race, coverage gates) and frontend (lint, typecheck, test, build) in parallel, then docker build.
- **Contratos:** sin cambios (docs/api untouched). Toolchain contract: backend/go.mod go 1.27.2 and golang:1.27.2-bookworm in the Dockerfile; setup-go reads go.mod.
- **Estado y persistencia:** sin cambios: the service stays stateless; coverage reports are CI artifacts, not committed.

Mechanical receipts do not prove that declared requirements or review judgments are complete.
