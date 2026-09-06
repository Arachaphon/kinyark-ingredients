# SRS - Search System

## 1. Introduction

### 1.1 Purpose
This document specifies the Software Requirements Specification for the Search System of the Kinyrak Ingredients application. The search system enables users to find recipes, ingredients, and store posts through a flexible search mechanism with bigram matching for Thai text.

### 1.2 Scope
The search system covers:
- Searching recipes by name, ingredient, and keywords
- Bigram overlap matching for Thai text (no word separators)
- Searching by specific ingredients (strict filter)
- Searching orphaned Store Posts
- Visibility-based access control in search results
- Fallback mechanisms when exact matches fail
- Search history tracking

### 1.3 References
- Prisma ORM with PostgreSQL
- Next.js App Router API routes
- Thai text processing (bigram matching)

## 2. System Overview

### 2.1 Architecture
The search system is implemented as a single API endpoint (`/api/search`) that handles all search logic server-side. It uses a multi-tier approach: strict matching first, then bigram overlap matching as fallback. The system queries recipes, ingredients, and store posts, combining results into a unified response.

### 2.2 Actors
- **Authenticated User**: Can search with visibility-aware filters
- **Anonymous User**: Can search public content only
- **STORE User**: Can search their own private/protected content

## 3. Functional Requirements

### 3.1 Search Recipes by Keyword

**ID**: SEARCH-KEYWORD-001  
**Priority**: High

**Description**: The system shall allow searching recipes by keywords in recipe name or ingredients.

**Query Parameters**:
- `q` or `query`: Search query string
- `ingredients`: Comma-separated ingredient names for strict filtering

**Flow**:
1. System parses query parameters
2. If `ingredients` parameter provided:
   - Split by comma, trim each
   - Find recipes containing ALL specified ingredients (strict match)
   - Return matching recipes with full details
   - Max 50 results
3. If query string provided:
   - Split by spaces or commas into keywords
   - Match against recipe name (case-insensitive `contains`)
   - Match against exact ingredient names
   - Match against store post names
   - Return up to 50 results ordered by `createdAt` descending

**Visibility Control**:
- `draft`: Forbidden for everyone
- Non-STORE users: public, protected, own private
- STORE users: public, own protected, own private
- Non-owner cannot see `protected` recipes

### 3.2 Bigram Overlap Matching (Thai Fallback)

**ID**: SEARCH-BIGRAM-001  
**Priority**: High

**Description**: When strict query returns no results, the system shall fall back to bigram overlap matching for Thai text.

**Trigger Condition**:
- Strict query returns 0 results
- Query length >= 2 characters

**Flow**:
1. Generate bigrams from the query: sliding 2-character window over each character
   - Works for Thai (no spaces) and Latin alike
   - Example: "ข้าวผัด" → ["ข้", "้าว", "าผ", "ผัด"]
2. Get all recipe candidates (up to 300) with id and recipeName
3. Calculate overlap score: count of unique query bigrams appearing in recipe name bigrams
4. Filter candidates with score > 0
5. Sort by score descending, take top 20
6. Fetch full recipe details for matched IDs
7. Append to search results

**Example**:
- Query: "ข้าวผัดกระเพรา"
- Recipe name: "ข้าวกะเพราหมูสับ"
- Strict `contains` fails, but bigram overlap succeeds

### 3.3 Search Orphaned Store Posts

**ID**: SEARCH-STORE-001  
**Priority**: Medium

**Description**: The system shall search store posts not linked to any recipe.

**Flow**:
1. Fetch up to 200 store posts where `recipeId: null`
2. Apply visibility filter (same as recipes)
3. Filter in JavaScript:
   - Check if `storeName` contains query/keywords
   - Check if `setIngredients` (JSON array) contains matching ingredient names
4. Take top 50 matches
5. Transform into dummy recipe format for unified response

**Dummy Recipe Structure**:
```json
{
  "id": "orphan-{storePostId}",
  "recipeName": "",
  "description": "...",
  "rating": 0,
  "favoriteCount": 0,
  "storePosts": [{...storePost details}]
}
```

### 3.4 Combine Search Results

**ID**: SEARCH-COMBINE-001  
**Priority**: Medium

**Description**: The system shall combine all search results into a single response.

**Flow**:
1. Combine recipe results + orphaned store post results
2. Return as a single JSON array
3. Recipe results come first, then dummy recipes for orphans
4. Response: `Response.json([...searchResults, ...dummyRecipesForOrphans])`

### 3.5 Visibility-Based Access Control

**ID**: SEARCH-ACCESS-001  
**Priority**: High

**Description**: The system shall enforce visibility rules when returning search results.

**Rules by Role**:

| Role | public | protected | private | draft |
|------|--------|-----------|---------|-------|
| Anonymous | ✓ | ✗ | ✗ | ✗ |
| USER | ✓ | ✓ | Own | ✗ |
| STORE | ✓ | Own | Own | ✗ |

**Implementation**:
- `recipeVisibility` filter is built dynamically based on user role
- `isStore` flag determines which visibility clauses to apply
- Role is determined from `x-user-role` header or fetched from DB

### 3.6 Search History Tracking

**ID**: SEARCH-HISTORY-001  
**Priority**: Medium

**Description**: The system shall track user search history.

**Data Model**:
```prisma
model SearchHistory {
  id            String   @id @default(dbgenerated("gen_random_uuid()"))
  userId       String   @db.Uuid
  searchQuery  String
  featuredCursor Int?
  createdAt    DateTime @default(now())
}
```

**Flow**:
1. User searches
2. System creates `SearchHistory` record for the user
3. Search history is used for personalized recommendations
4. Search history with `REC_CACHE_PREFIX` is invalidated when favorites change

## 4. Non-Functional Requirements

### 4.1 Performance
- Maximum 50 results per query (recipes), 200 (store posts pool), 50 (orphans)
- Bigram matching is O(n) for candidates, limited to 300
- Results are ordered by `createdAt` descending (most recent first)
- Query execution should be optimized with proper indexes

### 4.2 Correctness
- Bigram matching correctly handles Thai text without word separators
- Strict ingredient matching uses `some` (every ingredient must be present)
- Visibility filters correctly restrict results per role

### 4.3 Scalability
- Bigram matching limited to 300 candidates before scoring
- Store post search limited to 200 records before JS filtering
- Indexes on `recipeName`, `ingredient.name`, `storePost.storeName`

## 5. API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/search?q=...` | GET | Search recipes and store posts |
| `/api/search?ingredients=...` | GET | Search by ingredients |
| `/api/search-history` | GET/POST | Manage search history |
| `/api/search-history/[id]` | GET/DELETE | Individual history item |
| `/api/search-image` | POST | Search images (AI-based) |

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
src/app/api/search/route.ts
src/app/api/search-image/route.ts
src/app/api/search-history/
  ├── route.ts
  └── [id]/route.ts
src/app/(main)/search/
  ├── page.tsx
  └── results/page.tsx
src/lib/services/searchHistoryService.ts
src/app/(main)/home/page.tsx
```

## 8. Key Algorithms

### 8.1 Bigram Generation
```typescript
function bigrams(input: string): string[] {
  const chars = [...input.toLowerCase()].filter((c) => c.trim() !== "");
  const grams: string[] = [];
  for (let i = 0; i < chars.length - 1; i++) {
    grams.push(chars[i] + chars[i + 1]);
  }
  return grams;
}
```

### 8.2 Overlap Score
```typescript
function overlapScore(queryGrams: string[], text: string): number {
  const querySet = new Set(queryGrams);
  const seen = new Set<string>();
  let score = 0;
  for (const g of bigrams(text)) {
    if (querySet.has(g) && !seen.has(g)) {
      seen.add(g);
      score++;
    }
  }
  return score;
}
```

## 9. Dependencies
- `@prisma/client` - Database ORM
- `next` - Framework

## 10. Assumptions and Constraints
- Thai text has no word separators, requiring bigram matching
- Search is limited to recipe names and ingredient names (not descriptions/instructions)
- Orphaned store posts are searched by name and JSON ingredient data
- Results are capped at 50 recipes + 50 orphan store posts
- Search history is per-user and tracked

---
*Document Version: 1.0*  
*Date: 2026-09-05*  
*Project: Kinyrak Ingredients*
