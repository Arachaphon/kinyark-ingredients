# AGENTS.md - Global Project Coordination Rules
## 1. System Environment & Stack
- Framework: Next.js 15+ (App Router Architecture)
- Languages: TypeScript (Strict Mode Enabled)
- Database: Supabase PostgreSQL via Prisma ORM
- Style Core: Tailwind CSS
- AI Orchestration: Google Gemini API via Vercel AI SDK

## 2. Persistent Agent Rules
1. **Type Safety Absolute**: Explicit types are mandatory. [cite_start]Never introduce implicit `any` definitions[cite: 6].
2. **Database Isolation**: All database operations must pass exclusively through Prisma Client commands. [cite_start]Raw SQL query strings are banned unless explicitly approved in writing[cite: 7].
3. [cite_start]**Validation Enforcer**: Every API route payload and Server Action parameter must undergo active run-time verification using Zod schemas before hitting a service layout[cite: 36].
4. [cite_start]**Dependency Lockdown**: Do not add, strip, or modify entries inside `package.json` without direct developer authorization[cite: 7].
5. [cite_start]**Pre-Commit Verification**: Run compile testing checks (`npm run build` or `tsc`) locally prior to marking any individual assignment as finalized[cite: 7].

## 3. Modular System Sub-Rules
- Database Operations: Refer to `SKILL.md#Prisma-SOP`
- Endpoint Operations: Refer to `SKILL.md#Create-API-SOP`