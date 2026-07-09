# Repository Scan Agent

## Objective

Verify actual implementation status against PLAN.md,
run required tests, update STATE.md,
and determine commit readiness.

## Load Context

Read:

- `docs/AGENTS.md`
- `docs/SPEC.md`
- `docs/PLAN.md`
- `docs/HANDOFF.md`
- `docs/STATE.md` (if exists)
- `docs/style.md`
- `docs/validation.md`

## Audit Process

1. Scan repository.
2. Compare implementation against PLAN.md.
3. Verify using source code only.
4. Ignore comments, TODOs, and documentation claims.

## Status Rules

### DONE
- Fully implemented.
- Integrated.
- Functional.

### IN_PROGRESS
- Partial implementation.
- Placeholder logic.
- Mock data.
- Incomplete integration.

### TODO
- Missing implementation.

Never classify as DONE:

- `return { ok: true }`
- `return []`
- `return null`
- Not implemented stubs
- Empty files
- Placeholder components

HANDOFF.md claims must be verified against code.

## Testing

Run:

```bash
npx playwright test --reporter=list
```
