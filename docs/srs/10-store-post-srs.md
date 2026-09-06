# SRS - Store Post System

## 1. Introduction

### 1.1 Purpose
This document specifies the Software Requirements Specification for the Store Post System of the Kinyrak Ingredients application. The store post system allows users (particularly STORE role users) to create and manage store listings associated with recipes, including product information, pricing, and media.

### 1.2 Scope
The store post system covers:
- Creating store posts linked to recipes or standalone
- Managing store information (name, price, description, location, contact)
- Store media management (images, videos)
- Setting ingredients for store posts
- Store post deletion with media cleanup
- Store post visibility management
- Search integration for orphaned store posts

### 1.3 References
- Prisma ORM with PostgreSQL
- Supabase Storage for media files
- Next.js App Router API routes
- Zod validation

## 2. System Overview

### 2.1 Architecture
The store post system creates `StorePost` records that can optionally link to a `Recipe`. Store posts can exist independently ("orphaned") or be associated with an AI-generated recipe. Store posts support images and videos stored in Supabase Storage. The search system includes orphaned store posts in search results by converting them to "dummy recipes".

### 2.2 Actors
- **Authenticated User (USER)**: Can create store posts linked to their recipes
- **Authenticated User (STORE)**: Can create store posts, manage own posts
- **Admin**: Full access

## 3. Functional Requirements

### 3.1 Create Store Post

**ID**: STORE-CREATE-001  
**Priority**: High

**Description**: The system shall allow users to create a store post.

**Preconditions**:
- User is authenticated
- For linked posts: recipe must exist

**Flow** (when creating via recipe creation form):
1. User creates recipe with `store` data
2. If `systemRecipeId` and `store` are provided:
   - Verify `systemRecipeId` exists
   - Create `StorePost` linked to the existing recipe
   - Store post data:
     - `storeName`, `sellingPrice`, `storeDescription`, `storeLocation`, `contactInfo`
     - `setIngredients` (JSON array)
     - `visibility`
     - Images and videos from Supabase Storage
   - Return the linked recipe (not a new one)
3. If no `systemRecipeId` but `store` is provided:
   - Create new recipe + `StorePost` linked to it
   - `StorePost.userId` = current user
   - `StorePost.recipeId` = new recipe ID

**Store Data Structure**:
```typescript
{
  storeName: string (required, max 120),
  sellingPrice: number (min 0, max 100,000,000),
  storeDescription?: string (max 1000),
  storeLocation?: string (max 255),
  contactInfo?: string (max 255),
  storeImages?: string[],
  storeVideos?: string[],
  setIngredients?: IngredientItem[],
  recipeId?: string,
  visibility?: enum ["public", "protected", "private", "draft"]
}
```

### 3.2 Delete Store Post

**ID**: STORE-DELETE-001  
**Priority**: High

**Description**: The system shall allow store post owners to delete their store posts.

**Preconditions**:
- User is authenticated
- User owns the store post

**Flow** (via `DELETE /api/store-posts/[id]`):
1. Validate store post ID (UUID)
2. Find store post and verify ownership
3. Return 404 if not found, 403 if not owner
4. In transaction:
   - Delete all `StorePostImage` records
   - Delete all `StorePostVideo` records
   - Delete the `StorePost` record
5. Delete associated files from Supabase Storage
   - Iterate image URLs and call `deleteFileByUrl`
   - Iterate video URLs and call `deleteFileByUrl`
6. Return success response

**Cascade Behavior**:
- `StorePostImage` and `StorePostVideo` have `onDelete: Cascade`
- Deleting `StorePost` triggers cascade deletion of images/videos
- Storage cleanup is manual after DB deletion

### 3.3 Store Post Visibility

**ID**: STORE-VISIBILITY-001  
**Priority**: Medium

**Description**: The system shall manage store post visibility.

**Visibility Levels**: Same as recipes: `public`, `protected`, `private`, `draft`

**Search Access Rules**:
- `draft`: Forbidden for everyone in search
- Non-STORE: public, protected, own private
- STORE: public, own protected, own private

### 3.4 Store Post Search Integration

**ID**: STORE-SEARCH-001  
**Priority**: Medium

**Description**: The system shall include orphaned store posts in search results.

**Flow**:
1. When listing/searching recipes, also fetch `StorePost` records where `recipeId: null`
2. Apply visibility filter
3. Filter in JavaScript:
   - Match `storeName` against query keywords
   - Match `setIngredients` JSON array against ingredient names
4. Convert matching store posts to "dummy recipes" for unified response
5. Include in `recipes:list` API response

**Dummy Recipe Structure**:
```json
{
  "id": "orphan-{storePostId}",
  "recipeName": sp.storeName,
  "description": sp.storeDescription,
  "rating": 0,
  "favoriteCount": 0,
  "images": sp.images,
  "storePosts": [{ ...full storePost details }]
}
```

**List Page Integration**:
- In `GET /api/recipes` (non-mine mode), orphaned store posts are included
- Pagination accounts for orphaned posts (`totalWithOrphans = total + totalOrphanedStorePosts`)

### 3.5 My Recipe Page Integration

**ID**: STORE-MY-RECIPES-001  
**Priority**: Medium

**Description**: The system shall include store posts in the user's "My Recipes" page.

**Flow**:
1. When `mine=true`, also fetch `StorePost` records with `recipeId: null`
2. Create dummy recipes for orphaned store posts
3. Combine with actual recipes
4. Include in `recipes:mine` cache

## 4. Non-Functional Requirements

### 4.1 Performance
- Store post queries are paginated
- Orphaned store post search limited to 200 records before filtering
- Media deletion is synchronous (could be slow for many files)

### 4.2 Data Integrity
- Ownership verification before deletion
- Cascade deletion of images/videos from DB
- Supabase Storage cleanup after DB deletion
- `onDelete: Cascade` for dependent records

### 4.3 Consistency
- DB records deleted before storage cleanup
- If storage cleanup fails, DB records are already deleted (potential orphan files)

## 5. API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/store-posts/[id]` | DELETE | Delete a store post |
| `/api/recipes` | GET | List recipes (includes orphaned store posts) |

Store posts are primarily created through the recipe creation flow (`POST /api/recipes`).

## 6. Data Models

### 6.1 StorePost Model
```prisma
model StorePost {
  id               String   @id @default(dbgenerated("gen_random_uuid()"))
  userId           String   @db.Uuid
  recipeId         String?  @db.Uuid
  storeName        String
  sellingPrice     Float
  storeDescription String?
  storeLocation    String?
  contactInfo      String?
  visibility       String   @default("public")
  setIngredients   Json?
  createdAt        DateTime @default(now())
  user             User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  recipe           Recipe?   @relation(fields: [recipeId], references: [id], onDelete: SetNull)
  images           StorePostImage[]
  videos           StorePostVideo[]
  @@index([userId])
  @@index([recipeId])
  @@index([createdAt])
}
```

### 6.2 StorePostImage Model
```prisma
model StorePostImage {
  id          String    @id @default(dbgenerated("gen_random_uuid()"))
  storePostId String    @db.Uuid
  imageUrl    String
  createdAt   DateTime  @default(now())
  storePost   StorePost @relation(fields: [storePostId], references: [id], onDelete: Cascade)
}
```

### 6.3 StorePostVideo Model
```prisma
model StorePostVideo {
  id          String    @id @default(dbgenerated("gen_random_uuid()"))
  storePostId String    @db.Uuid
  videoUrl    String
  createdAt   DateTime  @default(now())
  storePost   StorePost @relation(fields: [storePostId], references: [id], onDelete: Cascade)
}
```

## 7. Files Structure

```
src/app/api/store-posts/
  └── [id]/route.ts       (DELETE store post)
src/app/(main)/my-recipe/page.tsx
src/app/api/recipes/route.ts (includes store post creation)
src/lib/storage.ts        (Supabase storage helpers)
tests/e2e/               (Store post related tests)
```

## 8. Validation Schemas

### 8.1 Store Schema (`storeSchema` in recipe.schema.ts)
```typescript
{
  storeName: string, min 1, max 120,
  sellingPrice: number, min 0, max 100,000,000,
  storeDescription?: string, max 1000,
  storeLocation?: string, max 255,
  contactInfo?: string, max 255,
  storeImages?: string[],
  storeVideos?: string[],
  setIngredients?: IngredientItem[],
  recipeId?: string (UUID),
  visibility?: enum ["public", "protected", "private", "draft"]
}
```

## 9. Dependencies
- `@prisma/client` - Database ORM
- `@supabase/storage` - Supabase Storage
- `zod` - Validation
- `next` - Framework
- `src/lib/storage.ts` - Storage utilities

## 10. Assumptions and Constraints
- Store posts require authentication
- Owners can only delete their own store posts
- Orphaned store posts are included in search and listing
- SetIngredients is stored as JSON (array of `{ name, amount }`)
- Supabase Storage files are deleted after DB records
- Potential file orphan if storage cleanup fails

---
*Document Version: 1.0*  
*Date: 2026-09-05*  
*Project: Kinyrak Ingredients*
