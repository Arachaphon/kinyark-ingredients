# STATE.md - Live Architecture Records & Decisions

_Last Scan: 2026-07-09 · Branch: docs/plan-v2-update · Sync: Team01 Sprint Backlog loaded_

## 1. Architectural Decisions
- **Core Strategy**: Deploying Next.js App Router linked to Prisma ORM and backed by a Supabase cloud cluster.
- **Justification**: Accelerates rapid functional deployment on the Vercel platform while maintaining deep PostgreSQL data integrity constraints.

## 2. Artificial Intelligence Engineering Architecture
- **Pantry Core Matching Engine**: Uses Google Gemini API (`@google/generative-ai`) + DeepSeek (OpenAI-compatible SDK) at `/api/ai/route.ts`. Does NOT yet use Vercel AI SDK `streamText()`.
- **Prompt Module**: `src/lib/ai/prompts.ts` exists on branch `feature/ai-prompts` (not yet merged into `dev` or `docs/plan-v2-update`). Once merged, this becomes the single source for prompt-building functions per `SKILL.md#SOP-003-AI-Prompt-Route`.
- **Index Query System**: Employs PostgreSQL Full-Text Search (not implemented yet) — reserved for Phase 3 service layer.
- **Docs Folder Conflict**: `docs/plan-v2-update` stores rule docs under `rules/`; `feature/ai-prompts` stores the same docs under `docs/`. This must be resolved (pick one location) before merging the two branches — expect path conflicts otherwise.

## 3. Sprint Backlog Progress (Team01)

| Iteration | Week | Tasks | STATUS |
|---|---|---|---|
| Iteration 0 | Week 1 (Jul 14–20) | W1-1 → W1-16 | All ToDO |
| Iteration 0 | Week 2 (Jul 22–Aug 3) | W2-1 → W2-15 | All blank (unstarted) |
| Iteration 01 | Week 3 (Aug 5–17) | W3-1 → W3-28 | Mixed (some unassigned) |
| Iteration 01 | Week 4 (Jul 28–Aug?) | W4-1 → W4-10 | Mostly unassigned, blank |

**Current Phase:** Iteration 0 — all tasks at ToDO/unstarted. Sprint starts Jul 14.

## 4. Phase Status Summary

| Phase | Status |
|---|---|
| Phase 1: DB & Security | DONE (RLS unverifiable from code) |
| Phase 2: Auth & Proxy | IN_PROGRESS (register bug, proxy duplication; mapped to W1-5–W1-9) |
| Phase 3: Recipe CRUD & Storage | IN_PROGRESS (W3-6–W3-14 planned for Aug 5–10) |
| Phase 4: AI Matching Engine | IN_PROGRESS (W2-4–W2-15 planned for Jul 22–Aug 3) |
| Phase 5: Testing & Deployment | TODO (W3-14, W3-28, W4-1–W4-6 planned) |

## 4. Playwright Baseline Status
- Installed: YES
- Browser Installed: NO — Chromium binary missing, run `npx playwright install`
- Auth Smoke Tests Passing: NO — 0/4 pass (browser missing)

## 5. Critical Blockers
1. Zod validation fires AFTER `signUp()` in `register/actions.ts`
2. `ingredient.schema.ts` has stale `quantity`/`unit` fields (removed from DB)
3. `GET /api/ingredients` is a stub returning `{ ok: true }`
4. Duplicate proxy: `src/proxy.ts` vs `src/lib/supabase/proxy.ts`
5. Service layer `src/lib/services/` does not exist on this branch (exists on `feature/ai-prompts`, not yet merged)
6. Playwright Chromium binary missing
7. `feature/ai-prompts` not merged into `docs/plan-v2-update` — AI prompt module (`prompts.ts`) and service layer are missing from this branch until merged
8. Rule-doc location mismatch between branches (`rules/` vs `docs/`) — must be resolved before merging `feature/ai-prompts`