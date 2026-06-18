# STATE.md - Live Architecture Records & Decisions

_Last Scan: 2026-06-18 · Branch: chore/setup-ai-docs_

## 1. Architectural Decisions
- **Core Strategy**: Deploying Next.js App Router linked to Prisma ORM and backed by a Supabase cloud cluster.
- **Justification**: Accelerates rapid functional deployment on the Vercel platform while maintaining deep PostgreSQL data integrity constraints.

## 2. Artificial Intelligence Engineering Architecture
- **Pantry Core Matching Engine**: Uses Google Gemini API (`@google/generative-ai`) + DeepSeek (OpenAI-compatible SDK) at `/api/ai/route.ts`. Does NOT yet use Vercel AI SDK `streamText()`.
- **Index Query System**: Employs PostgreSQL Full-Text Search (not implemented yet) — reserved for Phase 3 service layer.

## 3. Phase Status Summary

| Phase | Status |
|---|---|
| Phase 1: DB & Security | DONE (RLS unverifiable from code) |
| Phase 2: Auth & Proxy | IN_PROGRESS (register bug, proxy duplication) |
| Phase 3: Recipe CRUD & Storage | IN_PROGRESS (~10% done) |
| Phase 4: AI Matching Engine | IN_PROGRESS (no streaming, no ingredient_ids input) |
| Phase 5: Testing & Deployment | TODO (Playwright browser not installed) |

## 4. Playwright Baseline Status
- Installed: YES
- Browser Installed: NO — Chromium binary missing, run `npx playwright install`
- Auth Smoke Tests Passing: NO — 0/4 pass (browser missing)

## 5. Critical Blockers
1. Zod validation fires AFTER `signUp()` in `register/actions.ts`
2. `ingredient.schema.ts` has stale `quantity`/`unit` fields (removed from DB)
3. `GET /api/ingredients` is a stub returning `{ ok: true }`
4. Duplicate proxy: `src/proxy.ts` vs `src/lib/supabase/proxy.ts`
5. Service layer `src/lib/services/` does not exist
6. Playwright Chromium binary missing