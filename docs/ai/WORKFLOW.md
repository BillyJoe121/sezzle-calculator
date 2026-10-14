# AI-assisted workflow

How this project was built with AI coding agents, where the evidence for each practice is, and what worked. The
prompts themselves are in [`PROMPTS.md`](PROMPTS.md).

## What Forge is

Forge is a local plugin and MCP server that turns an agent session into a recorded engineering cycle. It decides
nothing on its own: it asks the user the questions that matter (agent mode, Git branch, delivery), refuses steps
taken out of order, executes the planned checks itself and stores the evidence (hashes of what was read, check
output, review and delivery) in `.forge/`. The rules agents follow are in [`AGENTS.md`](../../AGENTS.md) and
[`.claude/skills/forge-core`](../../.claude/skills/forge-core/SKILL.md).

## The cycle of each task

1. **Preflight.** `forge_task_preflight` classifies the work (trivial, ligero, fullhouse) and returns the next
   steps, the Git state and related technical debt.
2. **Agent mode.** The user chooses: no subagents, simple workers or smart workers.
3. **Git or worktree.** The user chooses a new branch, or a worktree when another task is active in the same folder.
4. **Spec.** Goal, acceptance criteria and decisions, approved by the user before any file is created.
5. **Plan.** Ordered steps, each tied to a named check that Forge can run.
6. **Build with TDD.** Failing test first for domain and validation logic, then the smallest change that passes.
7. **Check.** Forge runs each planned check and records the real output; a later edit invalidates it.
8. **Review.** A recorded review of the change against the spec, including what was not done.
9. **Delivery.** A summary plus an architecture block: data model, data structures, patterns, flow, contracts, state.
10. **Development check.** The 500-line limit, documentation disposition and technical debt review for the task's files.
11. **Ready.** Forge marks the branch ready and asks the delivery question; only approved changes are committed.

## The four tasks

| Task | Branch and folder | Agent mode | Result |
|------|-------------------|------------|--------|
| 1 Foundation | `feat/foundation`, main folder | none | Spec, contract, 17 examples, architecture, ADRs, agent rules, vendored skills. Merged as `f155105`. |
| 2 Backend | `feat/backend-api`, own worktree | simple | Go service and contract test. Merged as `ea24883`. |
| 3 Frontend | `feat/frontend-ui`, own worktree | simple | React app, 187 tests. Merged as `90cc92f` after `forge_integration` verified the merged tree. |
| 4 Delivery | `feat/delivery`, main folder | simple | End-to-end check, Docker, CI, coverage report, final docs. |

Tasks 2 and 3 started from the same commit (`f155105`) in separate worktrees and ran at the same time. They
touched disjoint folders and never edited `docs/api/`, so nothing conflicted. Each was merged into `main` from its
own chat (task 3 at the author's explicit request; for task 2 the request is not recorded), so task 4 found
nothing left to integrate and verified the merged tree instead.

## Subagents and models

The agent mode is the user's choice per task. **None** kept all work in the coordinator in task 1, because the
architecture and the contract had to stay in one head. **Simple** delegated bounded work to economical workers in
tasks 2 to 4: implementation slices, an independent reviewer and a checks runner; integration and architecture
stayed with the coordinator. **Smart** (workers inherit the coordinator's model) was not used. Workers never ask
the user again or delegate further. Forge also recommends a main model per type of work; only the user can
switch it.

## Ponytail and AntiSlop

- **Ponytail:** build the smallest coherent thing. Do not build speculative features; reuse what exists; prefer
  the standard library and the platform; never remove validation, security, accessibility or error handling.
  Examples: no Go dependencies at all; native radio buttons for the operation picker; plain `docker build` in CI
  instead of extra actions.
- **AntiSlop:** a quality filter for UI and user-facing copy. No fabricated claims, no dead controls, no generic
  decoration; every visual or copy choice has a purpose, and loading, error, keyboard and focus states exist.

## Evidence map

| Practice | Where to look |
|----------|---------------|
| One branch per task, merged with `--no-ff` | `git log --graph --oneline --all`: merges `f155105` (foundation), `ea24883` (backend), `90cc92f` (frontend), then `feat/delivery`. |
| Parallel work in worktrees | `.forge/workflow/54a148d4-….json` and `ac3c786e-….json`: both start from `f155105` and their histories overlap in time. Locally, `git reflog show feat/backend-api` and `feat/frontend-ui` show both branches created at 13:12 and 13:13. |
| Spec, plan, checks with real output, review, delivery | `.forge/workflow/<task-id>.json` and the readable summary in `.forge/changes/<task-id>/CHANGE.md`, one per task. |
| Prompts and the author's answers | [`PROMPTS.md`](PROMPTS.md) and the Word originals in [`prompts/`](prompts/). |
| Decisions | [`docs/adr/`](../adr/) (six ADRs) and the decisions list in [`docs/spec.md`](../spec.md). |
| Contract-first, tested on both sides | [`docs/api/openapi.yaml`](../api/openapi.yaml) and [`docs/api/examples/`](../api/examples/); replayed by `backend/internal/httpapi/contract_test.go` and served to the frontend tests by `frontend/src/test/contractExamples.ts` and `server.ts`. |
| Tests and coverage | [`docs/coverage.md`](../coverage.md); thresholds enforced by `frontend/vite.config.ts` and by CI. |
| CI | [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml); runs and coverage artifacts appear in the repository's Actions tab after the first push. |
| Container | [`Dockerfile`](../../Dockerfile) and [`.dockerignore`](../../.dockerignore). |
| Technical debt | [`deuda tecnica/index.md`](../../deuda%20tecnica/index.md): every finding with evidence, priority, status and the task that found it (the views are generated by Forge in Spanish). |
| Skills that guided the agents | [`.claude/skills/`](../../.claude/skills/) and its README; licenses in [`THIRD_PARTY_NOTICES.md`](../../THIRD_PARTY_NOTICES.md). |
| Agent rules | [`AGENTS.md`](../../AGENTS.md). |

## What worked and what did not

What worked:

- **Shared fixtures.** Both sides were built in separate worktrees against the same contract and its 17 JSON examples. On the
  first end-to-end run every example matched in status, content type and body; the only difference was the
  human-readable `detail` of one error, which the contract leaves free.
- **Independent review.** Reviewers found real problems before merge: a misconfigured `STATIC_DIR` could list the
  contents of directories without an `index.html` (task 2), and field errors were not announced when focus stayed in the field (task 3).
- **A written debt register.** Doc drift found in task 3 (planned names such as `CalculatorForm` that the code
  does not use) was recorded and fixed in task 4 instead of being forgotten.

What did not, or needed a workaround:

- **Merges came earlier than planned.** The prompts left both merges to task 4, but each was merged from its own
  chat. The frontend branch was also fast-forwarded to `main` before its first commit, so `git log --graph` draws
  it after the backend branch although both ran in parallel; the Forge records above show the overlap.
- **Forge only runs allowlisted commands.** End-to-end, Docker, line-count and actionlint checks in task 4 were
  written as `node --test` scripts in `.forge/tmp/` (scratch, not versioned); their output is stored in the task 4
  Forge record.
- **Platform gaps.** The Windows machine had no C compiler, so `go test -race` only runs in CI. Node 24.14 is
  slightly older than what `jsdom` declares (24.15), which shows warnings locally; CI and Docker use 24.21.
  Windows Application Control also blocked the `vet.exe` of the downloaded Go 1.27.2 toolchain, so local vet ran
  with `cmd/vet` built from the same sources (`go vet -vettool=...`) and local tests used `-vet=off`; CI runs both
  normally on Linux.
