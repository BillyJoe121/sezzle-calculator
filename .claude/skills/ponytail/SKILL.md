---
name: ponytail
description: "Apply on every Forge coding task after understanding the affected flow. Prefer the smallest correct implementation: YAGNI, reuse, standard library, native platform, installed dependencies, then minimal code."
license: MIT
---

# Ponytail

This is Forge's adapted Ponytail core, derived from `DietrichGebert/ponytail` at `e3ba2aa6f1e6f0bc4d69eb09c9f0d0a93af56156` under MIT.

## Full mode

Before writing, trace the real flow and its callers. Then stop at the first rung that holds:

1. The requirement is speculative: do not build it.
2. The project already has a fitting helper, type, component, or pattern: reuse it.
3. The standard library solves it: use that.
4. A native platform capability solves it: prefer it over custom code or a library.
5. An installed dependency solves it: use it before adding one.
6. One line solves it: write one line.
7. Otherwise, write the smallest coherent implementation that works.

## Non-negotiable boundaries

- Fix defects at their shared root cause, not one visible caller.
- Prefer deletion to addition and boring code to premature abstraction.
- Never optimize away input validation, authorization, security controls, accessibility, error handling that prevents data loss, or explicit product requirements.
- Leave one focused runnable check for non-trivial logic. A trivial one-line change does not need invented test scaffolding.
- Mark an intentional, real ceiling with a `ponytail:` comment and its upgrade condition.

## Handoff

State only what was deliberately skipped and the condition that would justify adding it. Do not turn a small change into an unrequested essay.
