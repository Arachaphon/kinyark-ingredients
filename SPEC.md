# SPEC.md - Business Target & Acceptance Criteria
## 1. Project Vision
- [cite_start]**Name**: KINYARK INGREDIENTS (กินยาก อินกรีเดียนส์) [cite: 34, 35]
- [cite_start]**Target**: Assist university students in discovering viable cooking recipes leveraging their currently available pantry ingredients to drastically curb localized food waste[cite: 34].

## 2. Target Users
- [cite_start]**Students**: Seeking recipes matching available ingredients.
- [cite_start]**Grocery Owners**: Managing core component listings.

## 3. Technical Feature Scope
### Authentication Layout
- [cite_start]Secure user registration, active session login, and profile password resets using Supabase Auth.
### Recipe Management
- [cite_start]Full CRUD execution pipelines (Create, Read, Update, Delete) for custom student recipes.
### AI Integration Core
- [cite_start]Automated ingredient matrix matching and predictive personalized taste suggestions powered by Gemini and Vercel AI SDK.

## 4. Definition of Done (DoD)
- [ ] [cite_start]Code compiles perfectly with zero active TypeScript compiler flags or runtime errors[cite: 26].
- [ ] [cite_start]Inputs are fully evaluated against production-grade Zod rule sheets[cite: 36].
- [ ] [cite_start]Records map successfully to the Supabase PostgreSQL database using Prisma migrations[cite: 26, 35].
- [ ] [cite_start]Verified endpoints register consistent standard HTTP output codes (e.g., 200 OK, 201 Created)[cite: 26].