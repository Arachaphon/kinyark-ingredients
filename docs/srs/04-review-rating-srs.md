# SRS - Review & Rating System

## 1. Introduction

### 1.1 Purpose
This document specifies the Software Requirements Specification for the Review and Rating System of the Kinyrak Ingredients application. The review system allows users to rate and comment on recipes, with automatic average rating calculation.

### 1.2 Scope
The review system covers:
- Creating reviews with ratings (1-5 stars) and optional comments
- Anonymous reviews (option to hide username)
- Automatic average rating calculation per recipe
- Review count tracking per recipe
- Review like/dislike functionality
- Prevention of duplicate reviews (one review per user per recipe)
- Review listing with pagination
- Review ID-based detail retrieval

### 1.3 References
- Prisma ORM with PostgreSQL
- Zod validation
- Next.js App Router API routes

## 2. System Overview

### 2.1 Architecture
The review system uses PostgreSQL with Prisma ORM. Reviews are linked to both a Recipe and a User. When a review is created, the system automatically updates the recipe's `rating` (average) and `reviewCount`. The system uses database transactions to ensure atomicity.

### 2.2 Actors
- **Authenticated User**: Can create reviews, like/unlike reviews
- **Recipe Owner**: Can view reviews on their recipes
- **All Users**: Can view public reviews

## 3. Functional Requirements

### 3.1 Create Review

**ID**: REVIEW-CREATE-001  
**Priority**: High

**Description**: The system shall allow authenticated users to create a review for a recipe.

**Preconditions**:
- User is authenticated
- Recipe exists
- User has not already reviewed this recipe

**Flow**:
1. User submits review data (recipeId, rating, comment, isAnonymous)
2. System validates input using `createReviewSchema` (Zod)
3. System verifies recipe exists (returns 404 if not)
4. System checks for duplicate review (returns 409 if already reviewed)
5. System creates review in a transaction:
   - Creates `Review` record with `recipeId`, `userId`, `rating`, `comment`, `isAnonymous`
   - Increments `reviewCount` on the recipe
   - Calculates new average rating: `Math.round((avg_rating * 10) / 10)`
   - Updates `rating` on the recipe
6. System invalidates `recipe:{recipeId}` cache
7. Returns created review with user details (status 201)

**Validation Rules**:
- `rating`: Integer, 1-5
- `comment`: String, optional
- `isAnonymous`: Boolean, default false

### 3.2 Like/Unlike Review

**ID**: REVIEW-LIKE-001  
**Priority**: Medium

**Description**: The system shall allow users to like or unlike reviews.

**Flow**:
1. User sends like/unlike request for a review
2. System checks if `ReviewLike` record exists for `(reviewId, userId)`
3. If exists, deletes it (unlike)
4. If not exists, creates it (like)
5. Uses unique constraint `(reviewId, userId)` for race-safe operation

**Data Model**:
```prisma
model ReviewLike {
  id         String   @id @default(dbgenerated("gen_random_uuid()"))
  reviewId   String   @db.Uuid
  userId     String   @db.Uuid
  createdAt  DateTime @default(now())
  review Review @relation(fields: [reviewId], references: [id], onDelete: Cascade)
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([reviewId, userId])
}
```

### 3.3 List Reviews for Recipe

**ID**: REVIEW-LIST-001  
**Priority**: High

**Description**: The system shall allow listing reviews for a specific recipe.

**Flow**:
1. System fetches reviews by `recipeId`
2. Each review includes:
   - User details (id, username, avatarUrl)
   - Rating, comment, isAnonymous
   - Like count for the review
   - Whether current user liked the review
3. Results are ordered by `createdAt` descending
4. Pagination supported

**API Endpoint**: `GET /api/reviews/[id]` (recipe-specific reviews)

### 3.4 Get Review by ID

**ID**: REVIEW-DETAIL-001  
**Priority**: Medium

**Description**: The system shall return a specific review by ID.

**API Endpoint**: `GET /api/reviews/[id]`

**Flow**:
1. System validates review ID (UUID)
2. Returns review with user details and like count

### 3.5 Duplicate Review Prevention

**ID**: REVIEW-DUPLICATE-001  
**Priority**: High

**Description**: The system shall prevent a user from creating multiple reviews for the same recipe.

**Implementation**:
- Before creating, system queries for existing review with `(recipeId, userId)`
- Returns HTTP 409 Conflict if found
- This check is done within the same transaction for consistency

### 3.6 Automatic Rating Calculation

**ID**: REVIEW-RATING-001  
**Priority**: High

**Description**: The system shall automatically recalculate the average rating when a review is added.

**Flow**:
1. After creating a review, system runs `review.aggregate({ where: { recipeId }, _avg: { rating: true } })`
2. Calculates: `newRating = Math.round((avg_rating ?? 0) * 10) / 10`
3. Updates `Recipe.rating` with the new average
4. Done atomically within the transaction

### 3.7 Anonymous Reviews

**ID**: REVIEW-ANONYMOUS-001  
**Priority**: Medium

**Description**: The system shall support anonymous reviews.

**Implementation**:
- `Review.isAnonymous` boolean field (default: false)
- When true, the review is associated with a user but the username may be hidden in the UI
- User still needs to be authenticated to post

## 4. Non-Functional Requirements

### 4.1 Performance
- Rating calculations use database aggregation
- Cache invalidation on review creation
- Reviews are indexed by `recipeId` for efficient queries

### 4.2 Data Integrity
- Atomic transaction ensures review creation and rating update happen together
- `ReviewLike` unique constraint prevents double-liking
- Cascade delete: deleting a recipe deletes all its reviews

### 4.3 Consistency
- Transactional operations ensure data consistency
- Rating average is always accurate relative to existing reviews

## 5. API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/reviews` | POST | Create a review |
| `/api/reviews` | GET | List reviews (with filters) |
| `/api/reviews/[id]` | GET | Get review detail |
| `/api/reviews/[id]/like` | POST | Like/unlike a review |
| `/api/reviews/[id]` | PUT | Update a review |
| `/api/reviews/[id]` | DELETE | Delete a review |

## 6. Data Models

### 6.1 Review Model
```prisma
model Review {
  id           String   @id @default(dbgenerated("gen_random_uuid()"))
  recipeId    String   @db.Uuid
  userId      String   @db.Uuid
  rating       Int
  comment      String?
  isAnonymous Boolean  @default(false)
  createdAt   DateTime @default(now())
  recipe Recipe @relation(fields: [recipeId], references: [id], onDelete: Cascade)
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  reviewLikes ReviewLike[]
  @@index([recipeId])
  @@index([userId])
}
```

### 6.2 ReviewLike Model
```prisma
model ReviewLike {
  id         String   @id @default(dbgenerated("gen_random_uuid()"))
  reviewId  String   @db.Uuid
  userId    String   @db.Uuid
  createdAt DateTime @default(now())
  review Review @relation(fields: [reviewId], references: [id], onDelete: Cascade)
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([reviewId, userId])
}
```

## 7. Files Structure

```
src/app/api/reviews/
  ├── route.ts           (POST create, GET list)
  ├── [id]/
  │   ├── route.ts       (GET detail, PUT, DELETE)
  │   └── like/route.ts  (POST like/unlike)
src/lib/validations/review.schema.ts
tests/
  ├── integration/review-rating.test.ts
  ├── api/reviews/reviews.route.test.ts
  └── api/reviews/reviews-id.route.test.ts
```

## 8. Validation Schemas

### 8.1 Create Review Schema (`createReviewSchema`)
```typescript
{
  recipeId: string (UUID, required),
  rating: integer (1-5),
  comment: string, optional,
  isAnonymous: boolean, default false
}
```

## 9. Cache Strategy
- Recipe detail cache: `recipe:{recipeId}`
- Invalidated when review is created, updated, or deleted
- Review list and detail views may also be cached

## 10. Dependencies
- `@prisma/client` - Database ORM
- `zod` - Validation
- `next` - Framework

## 11. Assumptions and Constraints
- Users must be authenticated to create reviews
- One review per user per recipe
- Rating is integer from 1 to 5
- Anonymous reviews still require authentication
- Reviews are cascade-deleted when a recipe is deleted
- Average rating is rounded to 1 decimal place

---
*Document Version: 1.0*  
*Date: 2026-09-05*  
*Project: Kinyrak Ingredients*
