# Performance Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce recipe query response times from 6.0s+ to under 200ms by optimizing queries, limiting in-memory shuffling, and adding database indexes.

**Architecture:** 
1. Add pagination/limit checks on orphaned StorePost queries in `GET /api/recipes`.
2. Limit the database query size in `GET /api/recipes/featured` to a maximum pool of 50 recipes before shuffling.
3. Define index constraints in `schema.prisma` on critical foreign keys and query fields (`userId`, `recipeId`, `visibility`, `createdAt`).

**Tech Stack:** Next.js 15+, Prisma ORM, PostgreSQL

---

### Task 1: Paginate Orphaned Store Posts in `GET /api/recipes`

**Files:**
- Modify: `src/app/api/recipes/route.ts`

- [ ] **Step 1: Write verification test/check or review the logic**
  Confirm the query for `orphanedStorePosts` uses pagination params.
  
- [ ] **Step 2: Modify the Prisma query**
  Update the `orphanedStorePosts` query to use `take` and `skip` calculated from the request parameters (`limit` and `page`).
  ```typescript
  const orphanedStorePosts = await prisma.storePost.findMany({
    where: storePostVisibilityConditions,
    include: {
      user: { select: { id: true, username: true, avatarUrl: true } },
      images: { orderBy: { createdAt: "asc" } },
      videos: { orderBy: { createdAt: "asc" } },
    },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * limit,
    take: limit,
  })
  ```

- [ ] **Step 3: Run ESLint and TypeScript checks**
  Run: `npx eslint src/app/api/recipes/route.ts` and `npx tsc --noEmit` to verify type-safety.

---

### Task 2: Limit Query Size in `GET /api/recipes/featured`

**Files:**
- Modify: `src/app/api/recipes/featured/route.ts`

- [ ] **Step 1: Modify recipe query to limit fetched rows**
  Add a `take: 50` limit (or similar threshold) to the Prisma query fetching recipes to shuffle in-memory.
  ```typescript
  const recipes = await prisma.recipe.findMany({
    where: visibilityFilter,
    select: recipeListItemSelect(),
    orderBy: [{ rating: "desc" }, { favoriteCount: "desc" }, { createdAt: "desc" }],
    take: 50, // Limit pool size for in-memory shuffle to prevent database exhaustion
  })
  ```

- [ ] **Step 2: Run verification**
  Verify the featured recipes function returns successfully with the limited set.
  Run: `npx tsc --noEmit` and verify there are no compilation errors.

---

### Task 3: Add Database Indexes in `schema.prisma`

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add index declarations to the Prisma models**
  Add `@@index` annotations to fields used frequently in lookups and sorts.
  
  In `Recipe`:
  ```prisma
  @@index([userId])
  @@index([visibility])
  @@index([createdAt])
  ```

  In `StorePost`:
  ```prisma
  @@index([userId])
  @@index([recipeId])
  @@index([createdAt])
  ```

  In `SearchHistory`:
  ```prisma
  @@index([userId])
  @@index([createdAt])
  ```

  In `Review`:
  ```prisma
  @@index([recipeId])
  @@index([userId])
  ```

- [ ] **Step 2: Propose index migrations and await developer execution**
  Show the updated schema to the user so they can generate and apply the database migrations using `npx prisma migrate dev`.
