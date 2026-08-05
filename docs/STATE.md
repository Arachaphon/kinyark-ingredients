# STATE.md - Live Architecture Records & Decisions

_Last Scan: 2026-07-22 · Branch: feature/upload-profile-image · Sync: Team22 KINYARK timeline loaded_

## 1. Architectural Decisions
- **Core Strategy**: Deploying Next.js App Router linked to Prisma ORM and backed by a Supabase cloud cluster.
- **Justification**: Accelerates rapid functional deployment on the Vercel platform while maintaining deep PostgreSQL data integrity constraints.

## 2. Artificial Intelligence Engineering Architecture
- **Pantry Core Matching Engine**: Uses Google Gemini API (`@google/generative-ai`) + DeepSeek (OpenAI-compatible SDK) at `/api/ai/route.ts`. Does NOT yet use Vercel AI SDK `streamText()`.
- **Prompt Module**: `src/lib/ai/prompts.ts` exists on branch `feature/ai-prompts` (not yet merged into `dev`). Once merged, this becomes the single source for prompt-building functions per `SKILL.md#SOP-003-AI-Prompt-Route`.
- **Index Query System**: Employs PostgreSQL Full-Text Search (not implemented yet) — reserved for Phase 3 service layer.

## 3. Sprint Backlog Progress (Team22 KINYARK)

| Iteration | Period | Tasks | STATUS |
|---|---|---|---|
| Iteration 0 | Week 1–2 (Jul 14–24) | W1-1 → W1-8, W2-1 → W2-10 | 13 Complete/Done, 1 InProgress, 5 ToDO |
| Iteration 01 | Week 1–2 (Aug 3–13) | W1-1 → W1-10, W2-1 → W2-6 | W1-1/W1-2 Done, W1-3/W1-6 Complete, W1-5 Testing, W1-7/W1-9 Testing, W2-1/W2-4 Testing, W1-10 Done; ที่เหลือ ToDO |
| Iteration 02 | Week 3 (Jul 27–31) | W3-1 → W3-10 | 2 Done (W3-2 Upload Profile Image, W3-5 Delete Account), 8 ToDO |
| Iteration 03 | Week 4 (—) | W4-1 → W4-10 | All ToDO (unassigned, no features defined) |

**Completed in Iteration 0:** UI Review, User Registration, Login/Logout, Profile (GET), Password Change, Integration stubs
**Current Focus:** Iteration 01 Recipe CRUD: W1-5 Update 🔶 Testing (PR #34 draft, CI green), W1-7 Delete/W1-9 Ingredients/W2-1 Validate/W2-4 Upload draft PRs ready

## 4. Phase Status Summary

| Phase | Status |
|---|---|
| Phase 1: DB & Security | DONE (RLS unverifiable from code) |
| Phase 2: Auth & Proxy | IN_PROGRESS (W2-1 Logout User ✅ Done, W2-3 Get Profile ✅ Done; W2-5 Update Profile 🔶 InProgress; W2-8 Change Password ✅ Done; register bug) |
| Phase 3: Recipe CRUD & Storage | IN_PROGRESS (W1-1 Create ✅, W1-2 Get ✅, W1-5 Update 🔶 Testing (PR #34 draft, CI green); W1-7 Delete 🔶 Testing, W1-9 Ingredients 🔶 Testing, W2-1 Validate 🔶 Testing, W2-4 Upload Image 🔶 Testing — draft PRs) |
| Phase 4: AI Matching Engine | NOT_STARTED (W2-2, W2-6, W2-7, W2-9 ❌ ToDO) |
| Phase 5: Testing & Deployment | IN_PROGRESS (W3-5 ✅ Done; W4 cross-iteration tasks partial) |

## 5. Playwright Baseline Status
- Installed: YES
- Browser Installed: YES (Chromium)
- Auth E2E Tests Passing: YES (auth.spec.ts, profile.spec.ts)

## 6. Critical Blockers
1. Zod validation fires AFTER `signUp()` in `register/actions.ts` — partially fixed (signOut added post-signup)
2. `ingredient.schema.ts` has stale `quantity`/`unit` fields (removed from DB)
3. `GET /api/ingredients` is a stub returning `{ ok: true }`
4. Duplicate proxy: `src/proxy.ts` vs `src/lib/supabase/proxy.ts`
5. Service layer `src/lib/services/` does not exist on this branch (exists on `feature/ai-prompts`, not yet merged)
6. `feature/ai-prompts` not merged into current branch — AI prompt module (`prompts.ts`) and service layer are missing
7. W4 iteration has no feature names or assignments defined in timeline.xlsx
