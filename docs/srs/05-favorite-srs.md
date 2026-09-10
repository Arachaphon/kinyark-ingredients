# SRS - Favorite System

## 1. Introduction

### 1.1 Purpose
This document specifies the Software Requirements Specification for the Favorite System of the Kinyrak Ingredients application. The favorite system allows users to bookmark recipes and toggle their favorite status.

### 1.2 Scope
The favorite system covers:
- Adding/removing recipes from favorites (toggle)
- Listing user's favorite recipes
- Checking favorite status for a specific recipe
- Getting favorite count for a recipe
- Atomic favorite toggle operations
- Cache invalidation when favorites change
- Search history invalidation on favorite change

### 1.3 References
- Prisma ORM with PostgreSQL
- Zod validation
- Next.js App Router API routes

## 2. System Overview

### 2.1 Architecture
The favorite system implements a many-to-many relationship between users and recipes through the `Favorite` model. The toggle operation uses database-level unique constraint enforcement to ensure race safety. When a favorite is toggled, the recipe's `favoriteCount` is atomically updated, and relevant caches are invalidated.

### 2.2 Actors
- **Authenticated User**: Can add/remove favorites, view favorites list
- **All Users**: Can view favorite counts

## 3. Functional Requirements

### 3.1 Toggle Favorite

**ID**: FAVORITE-TOGGLE-001  
**Priority**: High

**Description**: The system shall allow users to toggle a recipe's favorite status (add or remove).

**Preconditions**:
- User is authenticated
- Recipe exists

**Flow**:
1. User sends POST request with `{ recipeId }`
2. System validates `recipeId` is a valid UUID
3. System verifies recipe exists (returns 404 if not)
4. System attempts to create a `Favorite` record:
   - Uses `(userId, recipeId)` unique constraint
   - If duplicate (P2002 error), deletes the favorite instead (unlike)
   - Increments or decrements `favoriteCount` on the recipe
5. All operations are wrapped in a transaction
6. After successful toggle, system invalidates:
   - `recipe:{recipeId}` cache
   - `recipes:list:*` cache
   - Search history cache with `REC_CACHE_PREFIX` prefix
7. Returns `{ favorited: boolean, favoriteCount: number }`

**Race Safety**:
- Uses Prisma unique constraint `P2002` as source of truth
- Concurrent toggle requests are handled safely via database constraint

### 3.2 List User Favorites

**ID**: FAVORITE-LIST-001  
**Priority**: High

**Description**: The system shall allow users to view their favorite recipes.

**Preconditions**:
- User is authenticated

**Flow**:
1. System fetches all `Favorite` records for the user
2. Joins with Recipe details including:
   - Core recipe fields (id, name, rating, favoriteCount, createdAt, bgColor, visibility, aiProvider)
   - Cover image (first image)
   - Author details (id, username, avatarUrl)
   - Ingredients list
3. Ordered by `createdAt` descending
4. No caching (per-user data that can change from any serverless instance)
5. Returns `{ data: favorites[] }`

### 3.3 Check Favorite Status

**ID**: FAVORITE-STATUS-001  
**Priority**: Medium

**Description**: The system shall allow checking if a specific recipe is favorited by the current user.

**Flow**:
1. User sends request with `recipeId` and `action=status`
2. System queries `Favorite` for `(userId, recipeId)`
3. Returns `{ isFavorite: boolean }`
4. Returns 401 if not authenticated

### 3.4 Get Favorite Count

**ID**: FAVORITE-COUNT-001  
**Priority**: Medium

**Description**: The system shall allow getting the favorite count for a recipe.

**Flow**:
1. User sends request with `recipeId` and `action=count`
2. System counts `Favorite` records for the recipe
3. Returns `{ recipeId, count }`

### 3.5 Search History Invalidation

**ID**: FAVORITE-SEARCH-INVALIDATE-001  
**Priority**: Medium

**Description**: When a favorite changes, the system shall invalidate sticky recommendation search history.

**Implementation**:
- `prisma.searchHistory.deleteMany({ where: { userId, searchQuery: { startsWith: REC_CACHE_PREFIX } } })`
- Ensures recommendations are re-picked with the new favorite signal
- Uses `.catch(() => {})` to ignore errors gracefully

## 4. Non-Functional Requirements

### 4.1 Performance
- Toggle operation is atomic (single transaction)
- Database unique constraint ensures correctness
- No caching on per-user favorite list (always fresh)

### 4.2 Data Integrity
- `Favorite` table has `@@unique([userId, recipeId])` constraint
- Cascade delete: deleting a user/recipe deletes related favorites
- `favoriteCount` is always in sync with actual favorite records

### 4.3 Consistency
- Transaction ensures both `Favorite` creation and `favoriteCount` update happen together
- Cache invalidation happens after successful write

## 5. API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/favorites` | POST | Toggle favorite |
| `/api/favorites` | GET | List user's favorites |
| `/api/favorites?recipeId=xxx&action=status` | GET | Check favorite status |
| `/api/favorites?recipeId=xxx&action=count` | GET | Get favorite count |

## 6. Data Models

### 6.1 Favorite Model
```prisma
model Favorite {
  id         String   @id @default(dbgenerated("gen_random_uuid()"))
  userId    String   @db.Uuid
  recipeId  String   @db.Uuid
  createdAt DateTime @default(now())
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  recipe Recipe @relation(fields: [recipeId], references: [id], onDelete: Cascade)
  @@unique([userId, recipeId])
  @@index([userId, createdAt(sort: Desc)])
}
```

## 7. Files Structure

```
src/app/api/favorites/route.ts
tests/api/favorites.route.test.ts
src/lib/cache.ts (REC_CACHE_PREFIX)
```

## 8. Validation Schemas

### 8.1 Favorite Schema
```typescript
{
  recipeId: string (UUID, required)
}
```

### 8.2 Action Query Schema
```typescript
{
  recipeId: string (UUID),
  action: enum ["status", "count"]
}
```

## 9. Cache Strategy
- Cache invalidation on every favorite change:
  - `recipe:{recipeId}` - deleted
  - `recipes:list:*` - prefix deleted
  - Search history with `REC_CACHE_PREFIX` - deleted
- No read caching for per-user favorite lists

## 10. Dependencies
- `@prisma/client` - Database ORM
- `zod` - Validation
- `next` - Framework
- `src/lib/cache.ts` - Cache management

## 11. Assumptions and Constraints
- User must be authenticated to favorite
- Favorite toggle is atomic (add or remove, not a separate action)
- `favoriteCount` is maintained automatically
- Concurrent favorites are handled safely via database constraints
- Search recommendations are refreshed when favorites change

---
*Document Version: 1.0*  
*Date: 2026-09-05*  
*Project: Kinyrak Ingredients*
