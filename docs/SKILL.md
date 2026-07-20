# SKILL.md - Reusable Standard Operating Procedures
## SOP-001: Create API Endpoint Execution
1. [cite_start]**Define Validation**: Build an explicit validation validator module for user requests inside `lib/validations/` using Zod[cite: 36, 37].
2. [cite_start]**Service Layer**: Establish a distinct controller operation module interacting safely with Prisma database clients[cite: 36].
3. [cite_start]**Build Route**: Deploy the logical execution blocks within the designated `src/app/api/` target folder path[cite: 38].
4. **Enforce Security**: Verify user login tokens and authenticate the incoming origin request against Supabase Auth policies.
5. [cite_start]**Output Delivery**: Return standard JSON responses leveraging verified custom TypeScript signatures[cite: 36].

## SOP-002: Prisma Database Migration Lifecycle
1. [cite_start]Add required structure modifications exclusively inside `prisma/schema.prisma`[cite: 36].
2. [cite_start]Run database migration tools locally: `npx prisma migrate dev`[cite: 36].
3. [cite_start]Rebuild the internal Prisma Client code schema references: `npx prisma generate`[cite: 36].
4. [cite_start]Verify relational integrity within local visualizer interfaces before shipping modifications to production[cite: 36].

## SOP-003: AI Prompt Route
1. **Validate first**: every payload to `/api/ai/*` (e.g. `ingredient_ids[]`, `userContext`) must pass a Zod schema in `src/lib/validations/` before it reaches prompt-building code. Never forward raw client input straight into a prompt string.
2. **Build the prompt in one place**: prompt strings live in `src/lib/ai/prompts.ts` only. Route handlers call a builder function (e.g. `buildIngredientPrompt(ingredients[], userContext)`); they do not concatenate prompt text inline.
3. **Provider call**: route handlers under `src/app/api/ai/` select the provider (`gemini` via `@google/generative-ai`, or `deepseek` via the OpenAI-compatible SDK) and call it directly. This is the current pattern — do not assume Vercel AI SDK `streamText()` is wired up; that migration is tracked separately in `PLAN.md` Phase 4.1 and requires approval before starting (architecture change).
4. **Enforce output shape**: instruct the model to return strict JSON (e.g. `{ menus: [{ name, ingredients_needed, steps }] }`) and parse/validate the response before sending it to the client. Never pass raw model text straight through to the frontend.
5. **Cost & rate controls**: cap `maxTokens`, limit how much context is sent (max 10 favorites, 20 search-history entries per PLAN.md 4.5), and rate-limit the route per user. Do not call the AI provider on every page load — cache where PLAN.md specifies it (e.g. Daily Smart Picks).
6. **Error handling**: wrap provider calls in try/catch, return `{ success: false, message }` with a proper HTTP status on failure. Never leak the raw provider error or API key details to the client.