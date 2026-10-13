---
name: antislop
description: Required Forge quality filter for UI and user-facing copy. Apply during authoring, then run the AntiSlop delivery gate before declaring the work ready.
license: MIT
---

# AntiSlop

This is Forge's adapted AntiSlop core, derived from `miqdadbadjuber/anti-slop` at `eece033d2727b1357a996d02e3633b5f8cdffdf2` under MIT.

## Apply during UI or copy work

- Use stated product direction and a real user need; AntiSlop is a filter, not a style generator.
- Every visual technique must have a written purpose for hierarchy, identity, readability, or interaction. Remove defaults used only because they look fashionable or AI-generated.
- Do not fabricate statistics, testimonials, customers, compliance claims, screenshots, visual assets, navigation destinations, or product behavior.
- Every control must work or be absent. Include loading, empty, error, keyboard, focus, contrast, responsive, and reduced-motion states where applicable.
- Use precise copy. Remove generic CTAs, empty hype, and claims without evidence.

## Delivery gate

Before handoff, report PASS with evidence for each applicable check:

1. No fabricated claims, testimonials, statistics, assets, or dead navigation.
2. Every control has a real action and visible feedback.
3. The UI works at supported breakpoints with keyboard access, visible focus, adequate contrast, and its required states.
4. Significant visual and copy choices serve a documented purpose rather than a generic template.
5. The implemented build and relevant interaction checks ran successfully.

Any failed item means the UI/copy deliverable is not ready. Load `antislop-ui`, `antislop-copywriting`, `antislop-human`, `antislop-layoutmobile`, or `antislop-code` only for the matching surface.
