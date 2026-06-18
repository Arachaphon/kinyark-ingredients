# AGENTS.md - Global Project Coordination Rules

## 1. System Environment & Stack
- Framework: Next.js 15+ (App Router Architecture)
- Languages: TypeScript (Strict Mode Enabled)
- Database: Supabase PostgreSQL via Prisma ORM
- Style Core: Tailwind CSS
- AI Orchestration: Google Gemini API via Vercel AI SDK

## 2. Persistent Agent Rules
- **Permission Before Action**: Always explain the logic and ask for human confirmation before running database migrations (`prisma migrate`), executing destructive commands, moving to a new development phase, or updating configuration files.
  - **Strict Scope**: Do not touch files or directories listed in the 'Do Not Touch' section of `HANDOFF.md` under any circumstances. Stay strictly focused on the currently assigned task/file; do NOT refactor, modify, or explore unrelated parts of the codebase without explicit instructions.
  1. **Type Safety Absolute**: Explicit types are mandatory. Never introduce implicit `any` definitions.
  2. **Database Isolation**: All database operations must pass exclusively through Prisma Client commands. Raw SQL query strings are banned unless explicitly approved in writing.
  3. **Validation Enforcer**: Every API route payload and Server Action parameter must undergo active run-time verification using Zod schemas before hitting a service layout.
  4. **Dependency Lockdown**: Do not add, strip, or modify entries inside `package.json` without direct developer authorization.
  5. **Pre-Commit Verification**: Run compile testing checks (`npm run build` or `tsc`) locally prior to marking any individual assignment as finalized.
  - **Command `/caveman`**: When I type `/caveman` in the prompt, switch fully to Caveman Mode. In this mode, drop all verbose explanations, greetings, and polite fillers. Output ONLY raw, minimal code, syntax errors, or highly concise 1-3 word bullet points to maximize token efficiency and execution speed.
  ## 3. Modular System Sub-Rules
- Database Operations: Refer to `SKILL.md#Prisma-SOP`
- Endpoint Operations: Refer to `SKILL.md#Create-API-SOP`

## Git Restrictions

The agent must NEVER:

- create branches
- switch branches
- commit changes
- amend commits
- rebase branches
- merge branches
- push to remote
- create pull requests
- close pull requests
- create tags
- modify git history

The agent may only:

- inspect git status
- inspect git diff
- inspect git log

All Git operations require explicit human execution.