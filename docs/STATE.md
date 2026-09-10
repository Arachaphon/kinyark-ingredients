# STATE.md - Live Architecture Records & Decisions

_Last Scan: 2026-08-31 · Branch: refactor/test-suite-cleanup · Sync: Team22 KINYARK timeline updated_

## 1. Architectural Decisions
- **Core Strategy**: Deploying Next.js App Router linked to Prisma ORM and backed by a Supabase cloud cluster.
- **Justification**: Accelerates rapid functional deployment on the Vercel platform while maintaining deep PostgreSQL data integrity constraints.

## 2. Artificial Intelligence Engineering Architecture
- **Pantry Core Matching Engine**: Uses Google Gemini API (`@google/generative-ai`) + DeepSeek (OpenAI-compatible SDK) at `/api/ai/route.ts`.
- **Recommendation Services**: Implements Weekly Recommendations and Ingredient Pair Recipes (`src/lib/ai/`).
- **Index Query System**: Employs PostgreSQL Full-Text Search and In-Memory Filtering for high-performance pantry matching.

## 3. Sprint Backlog Progress (Team22 KINYARK)

| Iteration | Period | Tasks | STATUS |
|---|---|---|---|
| Iteration 0 | Week 1–2 (Jul 14–24) | W1-1 → W1-8, W2-1 → W2-10 | 13 Complete/Done, 1 InProgress, 5 ToDO |
| Iteration 01 | Week 1–2 (Aug 3–13) | W1-1 → W1-10, W2-1 → W2-6 | W1-1/W1-2 Done, W1-3/W1-6 Complete, W1-5 Testing, W1-10 Done |
| Iteration 02 | Week 3 (Jul 27–31) | W3-1 → W3-10 | Complete (Upload Profile Image, Delete Account, CRUD) |
| Iteration 03 | Week 1 (Sep 1–4) | W1-1 → W1-6 | W1-1 Complete (E2E), W1-5 Complete (CI/CD); W1-2, W1-3, W1-4, W1-6 ToDO |

**Current Focus:** Iteration 03 Testing & Deployment:
- **W1-1 (E2E Functional Testing):** ✅ Complete (28/28 Playwright tests passing)
- **W1-5 (Production Deployment & CI/CD Setup):** ✅ Complete (`ci.yml`, `playwright.yml`, `deploy-production.yml` configured)
- **Upcoming Tasks:** W1-2 Cross-Browser Testing, W1-3 Performance & Error Validation, W1-4 Final Bug Fixing, W1-6 Post-Deployment Smoke Testing

## 4. Phase Status Summary

| Phase | Status |
|---|---|
| Phase 1: DB & Security | DONE (Schema, Migrations & RLS Draft Complete) |
| Phase 2: Auth & Proxy | DONE (Login, Register, Logout, Profile, Password Change) |
| Phase 3: Recipe CRUD & Storage | DONE (Recipe CRUD, Media Upload, Reviews, Favorites, Search) |
| Phase 4: AI Matching Engine | DONE (Recipe Generation, Weekly Recommendations) |
| Phase 5: Testing & Deployment | IN_PROGRESS (Phase 5.1 & 5.2 Complete ✅; Phase 5.3–5.5 Ongoing) |

## 5. Test Suite & CI/CD Baseline Status
- **Test Directory Organization:** Refactored into clean modular structure (`tests/unit/`, `tests/api/`, `tests/integration/`, `tests/e2e/`, `tests/result/`)
- **Jest Test Suites:** **27/27 PASSED (100%)** (234 tests passed, 19 todo)
- **Playwright E2E Tests:** **28/28 PASSED (100%)** across 8 spec files
- **E2E Test Report:** `tests/result/e2e-test-report.md`
- **CI/CD Pipelines:** Automated workflows configured for Type Check, Linting, Unit Testing, E2E Testing, and Prisma Migrate Deploy on Production

## 6. Critical Blockers & Action Items
1. **GitHub Environment Setup:** Enable `environment: production` with required reviewer approvals in GitHub Repo Settings before final production deployment.
2. **Supabase RLS Policy Execution:** Apply the drafted 17-model SQL RLS policies in Supabase SQL Editor (`docs/audit-report.md`).
