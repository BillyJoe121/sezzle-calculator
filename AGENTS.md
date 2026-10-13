# AGENTS.md

Guide for any agent (or human) working in this repository. Read it before changing anything.

## Purpose

A full-stack calculator for the Sezzle take-home assessment: a React + TypeScript frontend that calls a Go REST
microservice. Operations: add, subtract, multiply, divide, power, sqrt and percentage. Priorities, in order:
correctness, clarity, maintainability. No extra features.

- What and why: [`docs/spec.md`](docs/spec.md)
- How it fits together: [`docs/architecture.md`](docs/architecture.md) and the ADRs in [`docs/adr/`](docs/adr/)
- The API: [`docs/api/`](docs/api/)

## Structure

```text
.claude/skills/   vendored agent skills (do not edit; see its README)
backend/          Go service, standard library only        (created in task 2)
frontend/         React + TypeScript + Vite app            (created in task 3)
docs/
  spec.md         product spec and acceptance criteria
  architecture.md components, layers, numeric and error models, tests, branch plan
  adr/            architecture decision records
  api/            OpenAPI 3.1 contract and executable examples (source of truth)
  ai/             how the project was built with AI agents
deuda tecnica/    technical debt register, maintained with forge_debt (created with the first finding)
.forge/           Forge records; changes/ and workflow/ are versioned evidence
```

## Commands

Available now:

```sh
npx --yes @redocly/cli@2.54.2 lint docs/api/openapi.yaml   # validate the contract
```

Planned. These do not exist until the task in brackets lands; do not claim to have run them before that:

```sh
# backend/ [task 2]
go run ./cmd/server                                          # serve on :8080 (PORT, STATIC_DIR)
go test ./...                                                # unit and contract tests
go test -coverprofile=coverage.out ./... && go tool cover -func=coverage.out
go vet ./... && gofmt -l .

# frontend/ [task 3]
npm ci
npm run dev                                                  # Vite on :5173, proxies /api and /healthz to :8080
npm test                                                     # Vitest with coverage and thresholds
npm run typecheck
npm run build

# repository root [task 4]
docker build -t sezzle-calculator . && docker run --rm -p 8080:8080 sezzle-calculator
```

## The contract is the source of truth

- `docs/api/openapi.yaml` and `docs/api/examples/*.json` define every status, `code`, field and edge rule.
  Both test suites load the examples as fixtures.
- Backend and frontend branches never edit `docs/api/`. If the contract is missing something or contradicts
  itself, stop, report it to the user and record it in `deuda tecnica/`. Do not patch one side to "make it work".
- A contract change is its own branch: update `openapi.yaml` and the examples together, lint, merge to `main`
  first. See [`docs/api/README.md`](docs/api/README.md).

## Rules

- **Forge.** Follow [`.claude/skills/forge-core/SKILL.md`](.claude/skills/forge-core/SKILL.md): classify the
  work (trivial, ligero, fullhouse), run `forge_task_preflight`, and follow `execution.nextSteps` in order (agent
  mode, Git decision, spec, plan, edit, implementation, one check per planned check, review, delivery,
  `forge_development_check`, ready). Without the Forge MCP server, follow the same order manually and say so.
  Never report a check you did not run.
- **Ponytail.** Smallest coherent change. Prefer existing code, then the standard library, then the platform.
  Never remove validation, security controls, accessibility or error handling to make something shorter.
- **TDD.** For domain logic, request decoding and validation, `parseOperand` and `formatResult`, write the
  failing test first. Coverage targets: `internal/calculator` ≥ 95 %, `internal/httpapi` ≥ 85 %,
  frontend ≥ 85 % (lines).
- **500 lines.** No hand-maintained file exceeds 500 physical lines (generated files, lockfiles, vendored skills
  and data excluded). Split by responsibility.
- **Technical debt.** Record incidental findings with `forge_debt` in `deuda tecnica/` (categories: Vulnerabilidades,
  Spaghetti, Kill List, Pruebas y confiabilidad, Documentacion, Rendimiento). Keep suspected and verified evidence
  separate. Report critical risks immediately; never expand the task on your own. A Kill List entry never
  authorizes a deletion.
- **One branch per task.** Short-lived, created from `main`. Parallel tasks use their own worktree:
  task 2 in `../AssessmentSezzle.worktrees/feat-backend-api` (`feat/backend-api`), task 3 in
  `../AssessmentSezzle.worktrees/feat-frontend-ui` (`feat/frontend-ui`). Task 2 touches only `backend/`,
  task 3 only `frontend/`; shared files such as the README and `.gitignore` are task 4's.
- **Commits.** Conventional Commits in English (`feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`).
  Stage only the changes the user approved.
- **Git safety.** Never push, force-push, rebase shared history, reset, stash or delete branches automatically.
  Merges into `main` happen only after the user confirms.
- **Language.** Code, identifiers, comments, UI text, documentation and commit messages are in English.
- **Scratch work** goes in `.forge/tmp/<task>/` (ignored). Never commit secrets or `.env` files.
- **Docs in the same branch.** Update the README, spec, architecture or ADRs affected by a change in the same
  branch. A new architectural decision gets a new ADR.

## Conventions

- **Go:** `gofmt`, `go vet`, standard library only (no `require` in `go.mod`), errors as sentinel values checked
  with `errors.Is`, table-driven tests, `internal/calculator` never imports `net/http`.
- **TypeScript:** `strict` mode, no `any` in application code, pure functions for parsing and formatting,
  components free of fetch logic (that belongs in `src/api/`).
- **Formatting:** `.editorconfig` (tabs in Go; 2 spaces in TS, JSON, YAML and CSS) and LF line endings
  (`.gitattributes`).

## Skills by area

Skills live in [`.claude/skills/`](.claude/skills/); the table there lists origin and license.

| Area | Skills |
|------|--------|
| Every task | `forge-core`, `ponytail`, `git-workflow-and-versioning`, `planning-and-task-breakdown` |
| Spec and contract | `spec-driven-development`, `api-and-interface-design`, `documentation-and-adrs` |
| Backend (task 2) | `test-driven-development`, `api-and-interface-design`, `security-and-hardening`, `code-review-and-quality` |
| Frontend (task 3) | `frontend-ui-engineering`, `accessible-ui-engineering-wcag22`, `antislop`, `antislop-ui`, `test-driven-development`, `code-review-and-quality` |
| Delivery (task 4) | `ci-cd-and-automation`, `security-and-hardening`, `documentation-and-adrs`, `antislop`, `code-review-and-quality` |
