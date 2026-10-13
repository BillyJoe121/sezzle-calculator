# AI-assisted workflow

How this project is built with AI coding agents. One page by design; task 4 completes it with the prompts and
what worked or did not.

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

## Subagents and models

The agent mode is the user's choice per task. **None** keeps all work in the coordinator; it was used for task 1
because architecture and the contract must stay in one head. **Simple** delegates bounded work to economical
workers. **Smart** gives workers the coordinator's model and effort. Workers never ask the user again or delegate
further. Forge also recommends a main model per type of work (for example a larger model for fullhouse work);
only the user can switch it.

## One branch per task, worktrees for parallel work

Each task is a short-lived branch merged into `main` after the user confirms, so the history shows one merge per
task. Tasks 2 (backend) and 3 (frontend) run at the same time, so each gets its own Git worktree: two agents never
share a working tree, an index or a checked-out branch. They touch disjoint folders and share only `docs/api/`,
which neither may edit. Task 4 integrates both branches with `forge_integration`.

## Ponytail and AntiSlop

- **Ponytail:** build the smallest coherent thing. Do not build speculative features; reuse what exists; prefer
  the standard library and the platform; never remove validation, security, accessibility or error handling.
- **AntiSlop:** a quality filter for UI and user-facing copy. No fabricated claims, no dead controls, no generic
  decoration; every visual or copy choice has a purpose, and loading, error, keyboard and focus states exist.

## Where the evidence is

| Evidence | Location |
|----------|----------|
| Spec, plan, check output, review and delivery per task | `.forge/workflow/<task-id>.json` |
| Human-readable change record per task | `.forge/changes/<task-id>/` |
| Technical debt register | `deuda tecnica/` (created when the first finding is recorded) |
| Decisions | [`docs/adr/`](../adr/) |
| Skills that guided the agents | [`.claude/skills/`](../../.claude/skills/) |
| Prompts used | *Completed in task 4.* |
