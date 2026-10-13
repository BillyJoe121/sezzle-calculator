---
name: accessible-ui-engineering-wcag22
description: Design, implement, audit, and verify web interfaces against a declared WCAG 2.2 conformance target. Use for accessibility requirements, semantic HTML, keyboard and focus behavior, forms, errors, dialogs, authentication, drag alternatives, target size, reflow, contrast, motion, media, and assistive-technology testing.
---

# Accessible UI Engineering WCAG 2.2

Treat accessibility as product behavior with traceable evidence. Default to WCAG 2.2 Level AA unless the spec or governing policy requires a different target.

## Workflow

1. Declare the conformance target, pages, states, breakpoints, languages, technologies, user journeys, and exclusions. Do not imply legal compliance from a partial audit.
2. Build an applicability matrix from `references/wcag22-engineering-matrix.md`. Include complete processes, not only isolated screens.
3. Prefer native HTML semantics. Use ARIA only when native elements cannot express the interaction; follow the WAI-ARIA APG pattern and keyboard contract.
4. Define acceptance criteria for keyboard, focus, names/roles/values, status messages, errors, zoom/reflow, contrast, motion, media, pointer alternatives, authentication, and recovery.
5. Implement the smallest coherent correction without weakening visual or product requirements silently.
6. Run automated checks, then manual keyboard, zoom, screen-reader, high-contrast, motion, and responsive checks. Automation cannot establish conformance alone.
7. Record every tested criterion as pass, fail, not applicable, or not tested, with evidence and remaining risk.

## WCAG 2.2 additions to inspect explicitly

- 2.4.11 Focus Not Obscured (Minimum), AA.
- 2.5.7 Dragging Movements, AA.
- 2.5.8 Target Size (Minimum), AA.
- 3.2.6 Consistent Help, A.
- 3.3.7 Redundant Entry, A.
- 3.3.8 Accessible Authentication (Minimum), AA.

Also inspect the full applicable A and AA baseline; the additions are not a substitute for it.

## Evidence ladder

1. Static checks: HTML validity signals, lint rules, accessible-name inspection, color calculations, and component tests.
2. Browser behavior: keyboard-only traversal, visible/unobscured focus, zoom to 200%, reflow at 320 CSS px equivalent, text spacing, pointer and touch behavior.
3. Assistive technology: at least one representative screen reader/browser combination for critical journeys; expand combinations according to audience and risk.
4. Human judgment: labels, instructions, reading order, alternative text, error recovery, cognitive load, and comprehension.

Never report a criterion as passing solely because axe, Lighthouse, or a linter found no violation.

## Implementation rules

- Keep DOM order aligned with reading and focus order.
- Give every control an accessible name and every state change an appropriate programmatic signal.
- Never remove focus outlines without an equally visible replacement.
- Provide keyboard and non-drag alternatives for pointer interactions.
- Make errors identifiable, associated with fields, understandable, and recoverable.
- Avoid cognitive-function tests in authentication when an accessible alternative can be offered.
- Preserve content and operation under zoom, text spacing, orientation changes, reduced motion, and forced colors.
- Test loading, empty, validation, failure, timeout, permission, and success states—not only the happy path.

## Reporting contract

Report target and scope, tested environments, criteria evaluated, evidence, defects with severity, untested areas, and exact remediation. Say “supports the tested WCAG 2.2 AA criteria in this scope” rather than claiming universal accessibility or legal compliance.

Use the official sources listed in `references/official-sources.md`; when interpretation is uncertain, consult the criterion's Understanding document and applicable W3C techniques before deciding.
