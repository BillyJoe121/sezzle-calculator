# WCAG 2.2 engineering matrix

Use this routing matrix to identify likely criteria. Confirm applicability against the normative specification.

| Surface | Inspect at minimum |
|---|---|
| Images, icons, charts, canvas, 3D | 1.1.1, 1.3.1, 1.4.1, 1.4.11; provide an equivalent representation for essential canvas/WebGL information |
| Audio and video | Applicable 1.2 criteria, controls, keyboard access, status, autoplay behavior |
| Layout and typography | 1.3.1-1.3.5, 1.4.3-1.4.5, 1.4.10-1.4.13, 3.1.1-3.1.2 |
| Keyboard and focus | 2.1.1-2.1.2, 2.4.1-2.4.7, 2.4.11, 3.2.1 |
| Animation and time | 2.2.1-2.2.2, 2.3.1, 2.3.3, 2.5.4; reduced motion is necessary evidence but not the entire analysis |
| Pointer, touch, drag | 2.5.1-2.5.4, 2.5.7-2.5.8 |
| Forms and errors | 1.3.1, 1.3.5, 2.4.6, 3.2.2, 3.3.1-3.3.4, 3.3.7, 4.1.2-4.1.3 |
| Authentication | 1.3.5, 3.3.1-3.3.4, 3.3.7-3.3.8; include password managers and copy/paste |
| Navigation and help | 2.4.1-2.4.6, 3.2.3-3.2.6 |
| Dialogs, menus, tabs, comboboxes | 1.3.1, 2.1.1-2.1.2, 2.4.3, 2.4.7, 2.4.11, 4.1.2; use the relevant APG keyboard pattern |
| Live/realtime content | 2.2.2, 3.2.1-3.2.2, 4.1.3; avoid focus theft and announcement floods |

## Per-criterion evidence record

Record:

- criterion and level;
- applicable page, component, state, and complete process;
- expected behavior;
- automated evidence;
- manual evidence;
- assistive technology/browser evidence where required;
- result: pass, fail, not applicable, or not tested;
- defect, owner, and retest status.
