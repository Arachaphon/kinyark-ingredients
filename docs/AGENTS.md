# AGENTS.md - Global Project Coordination Rules

## 1. System Environment & Stack

* Framework: Next.js 15+ (App Router Architecture)
* Language: TypeScript (Strict Mode Enabled)
* Database: Supabase PostgreSQL via Prisma ORM
* Styling: Tailwind CSS
* AI Orchestration: Google Gemini API (`@google/generative-ai`, raw SDK) + DeepSeek (OpenAI-compatible SDK) at `src/app/api/ai/route.ts`. Vercel AI SDK (`streamText()`) is the Phase 4 target, NOT yet implemented — do not assume streaming exists.

---

## 2. Persistent Agent Rules

### Permission Before Action

Always explain the reasoning and request human approval before:

* Running Prisma migrations
* Executing destructive commands
* Updating configuration files
* Modifying environment variables
* Installing or removing dependencies
* Changing project architecture
* Moving to a new project milestone

Examples of project milestones:

* Database Foundation
* Authentication System
* Recipe Management
* Social Features
* AI Recommendation System

Human approval is NOT required for normal implementation tasks inside the current milestone.

**Sound Notification:** When asking for human approval or permission, the agent must run the following PowerShell command to play a question/alert sound to notify the developer:
`powershell -c "[System.Media.SystemSounds]::Question.Play()"`

---

### Strict Scope

Stay focused on the assigned task only.

Do NOT:

* Refactor unrelated code
* Modify unrelated files
* Explore unrelated modules
* Touch files listed under "Do Not Touch" in HANDOFF.md

---

### Type Safety Absolute

* TypeScript strict typing is mandatory.
* Never introduce implicit `any`.
* Prefer explicit return types for exported functions.

---

### Database Isolation

* All database operations must use Prisma Client.
* Raw SQL is prohibited unless explicitly approved.

---

### Validation Enforcer

Every:

* API Route
* Server Action
* External Input

must be validated using Zod before reaching the service layer.

---

### Dependency Lockdown

Do not modify:

* package.json
* package-lock.json
* pnpm-lock.yaml

without explicit approval.

---

### Pre-Completion Verification

Before marking a task complete:

* Verify TypeScript passes
* Verify build passes when applicable
* Verify validation rules exist
* Verify affected files follow project conventions

---

### Play Sound on Completion

At the end of every response/turn, the agent should play a system sound (like an Asterisk chime) using PowerShell to notify the developer that the task/turn has finished running:
`powershell -c "[System.Media.SystemSounds]::Asterisk.Play()"`

---

### Command: /caveman

When the user enters `/caveman`:

* Remove explanations
* Remove greetings
* Remove unnecessary text
* Output only:

  * code
  * errors
  * short bullet points

Maximum brevity mode.

---

## 3. Definition of Done

A task is considered complete only when:

* Implementation is finished
* Type safety is verified
* Validation is implemented
* Required documentation is updated
* Completion summary is generated

Git operations are NOT required for task completion.

---

## 4. Documentation Policy

Do NOT update documentation after every minor code change.

Documentation updates are required when:

* A PLAN.md task is completed
* A work session ends
* An architecture decision changes
* A handoff is required

Relevant files may include:

* PLAN.md
* STATE.md
* HANDOFF.md

Before updating documentation:

1. Analyze current progress
2. Propose documentation changes
3. Show changes to the developer
4. Apply only after approval

---

## 5. Completion Workflow

For every completed task:

1. Analyze completed work
2. Verify implementation
3. Verify types
4. Check documentation impact
5. Propose PLAN.md updates
6. Propose STATE.md updates
7. Propose HANDOFF.md updates
8. Generate completion report

Do not silently modify project documentation.

---

## 6. Modular System Sub-Rules

### Database Operations

Refer to:

`SKILL.md#Prisma-SOP`

### Endpoint Operations

Refer to:

`SKILL.md#Create-API-SOP`

### AI Route Operations

Refer to:

`SKILL.md#SOP-003-AI-Prompt-Route`

---

## 7. Git Restrictions

The agent must NEVER:

* create branches
* switch branches
* commit changes
* amend commits
* rebase branches
* merge branches
* push to remote
* create pull requests
* close pull requests
* create tags
* modify git history

The agent may only:

* inspect git status
* inspect git diff
* inspect git log

All Git operations require explicit human execution.

### Pre-Commit & Merge Protocol

Before ANY commit or merge, the agent MUST:

1. **Show changes**: Run `git status` and `git diff` and present the full list of changes to the user
2. **Request approval**: Ask the user for explicit permission to proceed
3. **Wait for confirmation**: Do NOT commit, merge, or push until the user responds with approval

Violating this protocol (committing, merging, or pushing without approval) is strictly forbidden.