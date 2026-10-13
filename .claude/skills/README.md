# Repository skills

Agent skills used to build this project, copied verbatim (complete folders, byte for byte) from the local Forge
plugin, version `2.7.0+codex.20261012203250`, on 2026-10-13. They are vendored so that any agent working in the
repository, and any reviewer, sees the same instructions that guided the work. Do not edit them here; see
[Updating](#updating). Attribution and license texts are in [`THIRD_PARTY_NOTICES.md`](../../THIRD_PARTY_NOTICES.md).

Tasks: 1 foundation, 2 backend, 3 frontend, 4 delivery (see [`docs/architecture.md`](../../docs/architecture.md#branches-and-worktrees)).

| Skill | Use in this project | Tasks | Origin | License |
|-------|---------------------|-------|--------|---------|
| [`forge-core`](forge-core/SKILL.md) | Work levels, Forge cycle order and invariants for every task. | 1–4 | Forge (MyConfig), authored | MIT |
| [`ponytail`](ponytail/SKILL.md) | Smallest coherent change: standard library and platform first, never dropping validation, security, accessibility or error handling. | 1–4 | Forge adaptation of `DietrichGebert/ponytail` @ `e3ba2aa6f1e6f0bc4d69eb09c9f0d0a93af56156` | MIT |
| [`spec-driven-development`](spec-driven-development/SKILL.md) | Writing and updating `docs/spec.md` before code. | 1, then on spec changes | `addyosmani/agent-skills` @ `be42637c5af93fdc8526b68ec2f2651b930f316c`, unchanged | MIT |
| [`planning-and-task-breakdown`](planning-and-task-breakdown/SKILL.md) | Per-task plans with verifiable steps and checks. | 1–4 | `addyosmani/agent-skills` @ `be42637c…`, reference paths adjusted by Forge | MIT |
| [`git-workflow-and-versioning`](git-workflow-and-versioning/SKILL.md) | One branch per task, worktrees for parallel tasks, Conventional Commits. | 1–4 | `addyosmani/agent-skills` @ `be42637c…`, unchanged | MIT |
| [`documentation-and-adrs`](documentation-and-adrs/SKILL.md) | ADRs in `docs/adr/`, README, API documentation. | 1, 4 | `addyosmani/agent-skills` @ `be42637c…`, unchanged | MIT |
| [`api-and-interface-design`](api-and-interface-design/SKILL.md) | The contract in `docs/api/`, error semantics, validation at the boundary. | 1–3 | `addyosmani/agent-skills` @ `be42637c…`, unchanged | MIT |
| [`test-driven-development`](test-driven-development/SKILL.md) | Failing test first for the domain, decoding, `parseOperand` and `formatResult`. | 2, 3 | `addyosmani/agent-skills` @ `be42637c…`, reference paths adjusted by Forge | MIT |
| [`security-and-hardening`](security-and-hardening/SKILL.md) | Body limit, strict decoding, server timeouts, no internal details in errors, container hardening. | 2, 4 | `addyosmani/agent-skills` @ `be42637c…`, reference paths adjusted by Forge | MIT |
| [`code-review-and-quality`](code-review-and-quality/SKILL.md) | The review step of every Forge cycle. | 2–4 | `addyosmani/agent-skills` @ `be42637c…`, reference paths adjusted by Forge | MIT |
| [`frontend-ui-engineering`](frontend-ui-engineering/SKILL.md) | React components, state, responsive layout. | 3 | `addyosmani/agent-skills` @ `be42637c…`, reference paths adjusted by Forge | MIT |
| [`accessible-ui-engineering-wcag22`](accessible-ui-engineering-wcag22/SKILL.md) | Labels, error association, live region, keyboard use and contrast at WCAG 2.2 AA. | 3 | Forge (MyConfig), authored from W3C WCAG 2.2 sources | MIT; W3C terms apply to the cited W3C documents |
| [`antislop`](antislop/SKILL.md) | Quality filter for UI and user-facing copy (UI text, error messages, README). | 3, 4 | Forge adaptation of `miqdadbadjuber/anti-slop` @ `eece033d2727b1357a996d02e3633b5f8cdffdf2` | MIT |
| [`antislop-ui`](antislop-ui/SKILL.md) | Purposeful, product-specific visual choices for the calculator page. | 3 | Forge adaptation of `miqdadbadjuber/anti-slop` @ `eece033d…` | MIT |
| [`ci-cd-and-automation`](ci-cd-and-automation/SKILL.md) | CI pipeline with tests and coverage gates. | 4 | `addyosmani/agent-skills` @ `be42637c…`, unchanged | MIT |

"Reference paths adjusted by Forge" means the Forge copy differs from the upstream file only in links to shared
reference documents (`../../references/…` became `../../references/addy-agent-skills/…`).

## Known limitations of the copies

The skills were not edited, so some references point outside their folder or to skills that are not bundled.

**Relative links that point outside the skill folder.** They do not resolve in this repository:

| Skill | Target |
|-------|--------|
| `forge-core` | `../../integrations/orchestration/README.md`, `../../integrations/git-workflow/README.md`, `../../integrations/development-rules/README.md`, `../../integrations/context/README.md`, `../../integrations/knowledge/README.md` |
| `planning-and-task-breakdown` | `../../references/addy-agent-skills/definition-of-done.md` |
| `test-driven-development` | `../../references/addy-agent-skills/testing-patterns.md` |
| `security-and-hardening` | `../../references/addy-agent-skills/security-checklist.md` |
| `code-review-and-quality` | `../../references/addy-agent-skills/security-checklist.md`, `../../references/addy-agent-skills/performance-checklist.md` |
| `frontend-ui-engineering` | `../../references/addy-agent-skills/accessibility-checklist.md` |

They live in the Forge plugin. The rules that matter for this project are restated in
[`AGENTS.md`](../../AGENTS.md).

**Skills mentioned but not bundled.** These are not needed for this project:

| Skill | Mentions |
|-------|----------|
| `spec-driven-development` | `incremental-implementation`, `context-engineering` |
| `git-workflow-and-versioning` | `deprecation-and-migration`, `shipping-and-launch` |
| `api-and-interface-design` | `deprecation-and-migration` |
| `test-driven-development` | `browser-testing-with-devtools` |
| `code-review-and-quality` | `performance-optimization` |
| `ci-cd-and-automation` | `debugging-and-error-recovery` |
| `antislop` | `antislop-code`, `antislop-copywriting`, `antislop-human`, `antislop-layoutmobile` |

**Plan location.** `spec-driven-development` and `planning-and-task-breakdown` suggest saving plans to
`tasks/plan.md`. This project records each task's spec, plan and checks in the Forge workflow record
(`.forge/workflow/`) instead; the project spec is `docs/spec.md`.

**Line endings.** The upstream files use CRLF. `.gitattributes` marks `.claude/skills/**` as `-text` so Git
stores and checks them out byte for byte, while the rest of the repository is normalized to LF.

## Updating

Replace a skill folder with a fresh complete copy from Forge, then confirm the file count and SHA-256 of every
file match the source. Update the version, revisions and table above and `THIRD_PARTY_NOTICES.md` in the same
commit.
