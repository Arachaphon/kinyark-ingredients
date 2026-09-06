# SRS - Search History System

## 1. Introduction

### 1.1 Purpose
This document specifies the Software Requirements Specification for the Search History System of the Kinyrak Ingredients application. The search history system tracks user searches and enables personalized recommendations based on search behavior.

### 1.2 Scope
The search history system covers:
- Recording user searches
- Tracking search queries per user
- Managing featured cursor for search results
- Cache invalidation when favorites change
- Integration with recommendation system
- Search history listing and retrieval

### 1.3 References
- Prisma ORM with PostgreSQL
- Next.js App Router API routes
- Cache management (`src/lib/cache.ts`)

## 2. System Overview

### 2.1 Architecture
The search history system stores each user's search query in the database. Search history records are linked to users via `userId`. The system uses the `REC_CACHE_PREFIX` to identify recommendation-related search history entries, which are invalidated when a user's favorites change (ensuring recommendations re-pick with updated signals).

### 2.2 Actors
- **Authenticated User**: Search queries are recorded per user
- **System**: Uses search history for recommendations and cache invalidation

## 3. Functional Requirements

### 3.1 Record Search History

**ID**: SEARCHHISTORY-RECORD-001  
**Priority**: High

**Description**: The system shall record user search queries.

**Data Model**:
```prisma
model SearchHistory {
  id            String   @id @default(dbgenerated("gen_random_uuid()"))
  userId       String   @db.Uuid
  searchQuery  String
  featuredCursor Int?
  createdAt    DateTime @default(now())
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

**Flow**:
1. When a user performs a search, create a `SearchHistory` record
2. Record includes: `userId`, `searchQuery`, optional `featuredCursor`
3. `createdAt` is automatically set to current time
4. Indexed by `userId` and `createdAt` for efficient querying

### 3.2 List User Search History

**ID**: SEARCHHISTORY-LIST-001  
**Priority**: Medium

**Description**: The system shall allow listing a user's search history.

**Flow**:
1. Query `SearchHistory` by `userId`
2. Order by `createdAt` descending
3. Return list of search queries with timestamps

### 3.3 Featured Cursor Tracking

**ID**: SEARCHHISTORY-CURSOR-001  
**Priority**: Medium

**Description**: The system shall track featured cursor position for search results.

**Implementation**:
- `featuredCursor` field stores pagination/cursor position
- Used for maintaining search result state across requests
- Indexed by `createdAt` for chronological ordering

### 3.4 Cache Invalidation on Favorite Change

**ID**: SEARCHHISTORY-INVALIDATE-001  
**Priority**: High

**Description**: The system shall invalidate search history cache when favorites change.

**Trigger**: When a user toggles a favorite (adds or removes)

**Flow**:
1. After successful favorite toggle:
   ```typescript
   await prisma.searchHistory.deleteMany({
     where: { userId, searchQuery: { startsWith: REC_CACHE_PREFIX } }
   }).catch(() => {})
   ```
2. `REC_CACHE_PREFIX` identifies recommendation-related searches
3. Deletion is graceful (`.catch(() => {})` ignores errors)
4. Ensures sticky recommendations are re-picked with new favorite signal
5. Search history is stored in cache for recommendations; clearing it forces recalculation

**Why**: Favorite changes change the recommendation signal. The cached recommendation search results become stale and need to be regenerated.

### 3.5 Cascade Delete

**ID**: SEARCHHISTORY-CASCADE-001  
**Priority**: Medium

**Description**: Search history is cascade-deleted when a user is deleted.

**Implementation**:
- `SearchHistory.user` relation has `onDelete: Cascade`
- When `User` is deleted, all associated `SearchHistory` records are automatically removed
- Ensures no orphaned search history records

## 4. Non-Functional Requirements

### 4.1 Performance
- Search history queries are indexed by `userId`
- Cache invalidation uses `startsWith` query (efficient with proper indexing)
- Individual record creation is fast

### 4.2 Data Integrity
- Cascade delete ensures no orphaned records
- `userId` foreign key constraint enforces referential integrity

### 4.3 Privacy
- Search history is per-user
- Search queries are stored in the database
- No search history shown to other users

## 5. API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/search-history` | GET/POST | Manage search history |
| `/api/search-history/[id]` | GET/DELETE | Individual search history item |

## 6. Data Models

### 6.1 SearchHistory Model
```prisma
model SearchHistory {
  id            String   @id @default(dbgenerated("gen_random_uuid()"))
  userId       String   @db.Uuid
  searchQuery  String
  featuredCursor Int?
  createdAt    DateTime @default(now())
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@index([userId])
  @@index([createdAt])
}
```

## 7. Files Structure

```
src/app/api/search-history/
  ├── route.ts          (GET list, POST create)
  └── [id]/route.ts     (GET detail, DELETE)
src/lib/services/
  └── searchHistoryService.ts
src/lib/cache.ts        (REC_CACHE_PREFIX)
```

## 8. Key Constants

### 8.1 REC_CACHE_PREFIX
Defined in `src/lib/cache.ts`:
- Used to identify recommendation-related search history entries
- When favorites change, entries starting with this prefix are deleted
- Forces recommendation recalculation

## 9. Dependencies
- `@prisma/client` - Database ORM
- `src/lib/cache.ts` - Cache management
- `next` - Framework

## 10. Assumptions and Constraints
- Each search creates a new history record
- Featured cursor is optional (used for pagination)
- Cache invalidation on favorite change is best-effort (errors ignored)
- Search history is user-specific and not shared
- Search history is cascade-deleted with user account

---
*Document Version: 1.0*  
*Date: 2026-09-05*  
*Project: Kinyrak Ingredients*
