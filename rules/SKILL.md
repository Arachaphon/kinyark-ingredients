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