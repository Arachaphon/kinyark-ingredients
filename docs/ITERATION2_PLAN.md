# Iteration 2 Plan: Backend, Database & AI Core (Zero Frontend Impact)

This plan outlines the tasks for **Iteration 2** that can be developed, tested, and verified entirely on the backend, database, or service layers. This decouples backend progress from the frontend UI team, preventing any blockages or merge conflicts on frontend components.

---

## 1. Objectives
- **Zero Frontend UI Dependencies**: All features must be verifiable via automated tests or HTTP client requests (`.http` files / Postman).
- **Security & Integrity**: Hardening database constraints and Row-Level Security (RLS) policies.
- **AI Core Readiness**: Building the prompt modules and AI service adapters.
- **Fast Search Core**: Implementing database-level full-text search instead of basic in-memory filtering.

---

## 2. Key Tasks & Backlog

### Task 2.1: PostgreSQL Full-Text Search (Database & API Layer)
- **Objective**: Implement database-level search capability using PostgreSQL's native full-text search features.
- **Implementation**:
  - Add search indexes in `prisma/schema.prisma` for `Recipe` and `Ingredient` tables (using raw SQL migrations or pg_trgm if necessary).
  - Update `GET /api/recipes` to accept search query parameters (`?q=...`) and perform database-level text search.
- **Verification**: Verify using HTTP Client (`search.http`) or Jest integration tests.

### Task 2.2: Hardening Supabase Row-Level Security (RLS) & Policies
- **Objective**: Ensure that only authorized users can modify their own recipes or store posts directly at the database level.
- **Implementation**:
  - Audit and write SQL policies in Supabase for `Recipe`, `StorePost`, and `Review` tables.
  - Test constraints by sending requests with different user tokens to verify that unauthorized modifications return `403 Forbidden` / database violation errors.
- **Verification**: Test suite verifying unauthorized database mutations fail.

### Task 2.3: Implement the AI Service Layer & Prompts Module
- **Objective**: Develop the prompt construction logic and Google Gemini / DeepSeek API integration wrapper.
- **Implementation**:
  - Establish `src/lib/services/ai.ts` (handling connection, retries, and formatting).
  - Move prompts from components to `src/lib/ai/prompts.ts`.
  - Create the AI matching route `POST /api/ai/match` that accepts ingredients and returns structured JSON responses using Zod schemas.
- **Verification**: Run service unit tests (`npm run test tests/services.test.ts`).

### Task 2.4: API Rate Limiting & Upload Security Guardrails
- **Objective**: Prevent abuse on resource-heavy endpoints (like image upload routes).
- **Implementation**:
  - Implement a basic rate-limiting middleware or utility in `src/proxy.ts` / API routes using memory cache or database tracking.
  - Enforce file size (max 5MB) and mime-type filters directly inside `/api/recipes/upload` before forwarding to Supabase.
- **Verification**: Jest tests attempting to send oversized/unsupported files or spamming requests.

### Task 2.5: Setup HTTP Client Integration Test Suite (`.http`)
- **Objective**: Build a collection of IDE-runnable HTTP requests representing user flows for developers to test local changes without a browser.
- **Implementation**:
  - Create `tests/http/recipes.http` and `tests/http/auth.http` in the workspace.
  - Define requests for SignUp, Login, Create Recipe, Upload Image, Update, and Delete.
- **Verification**: Run requests locally inside the IDE to see responses.

---

## 3. Timeline & Estimates

| Task ID | Task Name | Est. Effort | Target Deliverable |
|---|---|---|---|
| **W3-A** | PostgreSQL Full-Text Search | 10 hrs | `GET /api/recipes?q=...` with full-text search |
| **W3-B** | Supabase RLS Hardening | 8 hrs | SQL migration + policy script |
| **W3-C** | AI Service Layer & Prompts | 12 hrs | `POST /api/ai/match` structured JSON output |
| **W3-D** | Rate Limiting & Upload Guards | 6 hrs | Middleware/route file validations |
| **W3-E** | HTTP Test Scripts (`.http`) | 4 hrs | `.http` integration test templates |

---

## 4. How to Test & Verify in Isolation
To ensure zero impact on the frontend, use this command pipeline to verify all backend tasks:

```bash
# 1. Run local database migrations & generate client
npx prisma db push

# 2. Run the automated backend test suites
npm run test

# 3. Test HTTP routes using REST Client extension in VS Code
# (Open tests/http/recipes.http and click "Send Request")
```
