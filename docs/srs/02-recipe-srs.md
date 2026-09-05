# SRS - Recipe System

## 1. Introduction

### 1.1 Purpose
This document specifies the Software Requirements Specification for the Recipe System of the Kinyrak Ingredients application. The recipe system manages the creation, retrieval, updating, and deletion of recipes, including ingredients, equipment, images, and videos.

### 1.2 Scope
The recipe system covers:
- Create new recipes (with ingredients, equipment, media)
- Read/List recipes (public feed, mine, filtering by author type, AI provider)
- Update existing recipes
- Delete recipes
- Recipe detail view with ratings, reviews, favorites
- Recipe visibility management (public, protected, private, draft)
- Reference recipe functionality (copy/remix)
- AI-generated recipe integration
- Store post integration with recipes

### 1.3 References
- Prisma ORM with PostgreSQL
- Next.js App Router API routes
- Zod for validation
- Supabase Storage for media

## 2. System Overview

### 2.1 Architecture
The recipe system is built as a RESTful API layer in Next.js App Router. Recipes are stored in PostgreSQL via Prisma ORM. Each recipe belongs to a user and can have multiple ingredients, images, videos, equipment items, reviews, and favorites. The system supports both user-created and AI-generated recipes.

### 2.2 Actors
- **Unauthenticated User**: Can view public recipes, search recipes
- **Authenticated User (USER)**: Can create, update, delete own recipes, view own recipes
- **Authenticated User (STORE)**: Can create store-linked recipes, view protected recipes
- **AI System**: Generates recipes automatically (via Gemini/Groq)

## 3. Functional Requirements

### 3.1 Create Recipe

**ID**: RECIPE-CREATE-001  
**Priority**: High

**Description**: The system shall allow authenticated users to create a new recipe.

**Preconditions**:
- User is authenticated
- User provides valid recipe data

**Flow**:
1. User submits recipe creation form with:
   - `recipeName` (required, max 150 chars)
   - `description` (optional, max 1000 chars)
   - `instructions` (optional, max 20,000 chars)
   - `ingredients[]` (required, each with name, quantity, unit, optional category)
   - `equipmentItems[]` (optional, each with name)
   - `store` (optional, for store-linked recipes)
   - `images[]` (optional, image URLs)
   - `videos[]` (optional, video URLs)
   - `bgColor` (optional)
   - `aiProvider` (optional)
   - `visibility` (default: "public")
   - `referenceRecipeId` (optional, for copying a recipe)
   - `systemRecipeId` (optional, for AI-generated recipes)
2. System validates input using `createRecipeSchema` (Zod)
3. System upserts ingredients (creates new or finds existing)
4. System creates `RecipeIngredient` associations
5. System creates equipment items, images, videos
6. If `store` is provided and `systemRecipeId` exists, creates `StorePost` linked to the recipe
7. System creates the recipe record with `userId`
8. System invalidates recipe list caches
9. System returns the created recipe with status 201

**Postconditions**:
- New recipe is created in the database
- All associated ingredients, equipment, media are created
- Cache is invalidated

**Special Cases**:
- If `systemRecipeId` and `store` are provided, creates a StorePost instead of a new recipe
- If `referenceRecipeId` is provided, the recipe references another recipe

### 3.2 List Recipes

**ID**: RECIPE-LIST-001  
**Priority**: High

**Description**: The system shall allow listing recipes with pagination and filtering.

**Query Parameters**:
- `page` (default: 1)
- `limit` (default: 10, max: 50)
- `mine` (boolean, owner's recipes)
- `publicOnly` (boolean, public recipes only)
- `aiProvider` (string, filter by AI provider)
- `authorType` ("all", "user", "ai")

**Flow**:
1. System parses and validates query parameters using `recipeListQuerySchema`
2. If `mine=true`, filters by `userId` (requires authentication)
3. Otherwise applies visibility filter based on user role:
   - Non-authenticated: public only
   - STORE role: public + own protected
   - Regular USER: public + protected + own private
4. Applies `authorType` filter (user = no aiProvider, ai = has aiProvider)
5. Applies `aiProvider` filter
6. Includes orphaned Store Posts (not linked to a recipe)
7. Returns paginated results with metadata (total, totalPages)
8. Results are cached (`TTL_RECIPES_LIST`)

**Response Structure**:
```json
{
  "data": [...recipes, ...dummyStorePosts],
  "meta": { "page", "limit", "total", "totalPages" }
}
```

### 3.3 Get Recipe Detail

**ID**: RECIPE-DETAIL-001  
**Priority**: High

**Description**: The system shall return detailed information about a specific recipe.

**Preconditions**:
- Recipe ID is provided in URL (`/api/recipes/[id]`)
- Recipe ID must be a valid UUID

**Flow**:
1. System validates recipe ID
2. System fetches recipe with all relations:
   - User (author)
   - RecipeIngredients (with Ingredient details)
   - Images, Videos
   - Equipment
   - StorePosts (if any)
3. Checks visibility permissions
4. Returns recipe detail

### 3.4 Update Recipe

**ID**: RECIPE-UPDATE-001  
**Priority**: High

**Description**: The system shall allow recipe owners to update their recipes.

**Preconditions**:
- User is authenticated
- User owns the recipe (or has appropriate permissions)

**Flow**:
1. User submits update data
2. System validates using `updateRecipeSchema`
3. System updates the recipe record
4. System updates associated ingredients, equipment, media
5. System invalidates relevant caches
6. Returns updated recipe

### 3.5 Delete Recipe

**ID**: RECIPE-DELETE-001  
**Priority**: High

**Description**: The system shall allow recipe owners to delete their recipes.

**Preconditions**:
- User is authenticated
- User owns the recipe

**Flow**:
1. System verifies ownership
2. System cascade-deletes related data (reviews, favorites, recipe_ingredients, etc.)
3. System deletes the recipe
4. System invalidates relevant caches

### 3.6 Recipe Visibility

**ID**: RECIPE-VISIBILITY-001  
**Priority**: Medium

**Description**: The system shall enforce visibility rules for recipes.

**Visibility Levels**:
- `public`: Visible to everyone
- `protected`: Visible to authenticated users
- `private`: Visible only to the owner
- `draft`: Not visible to anyone (even owner, in search)

**Access Rules**:
| Role | public | protected | private | draft |
|------|--------|-----------|---------|-------|
| Anonymous | ✓ | ✗ | ✗ | ✗ |
| USER | ✓ | ✓ | Own | ✗ |
| STORE | ✓ | ✓ (own) | Own | ✗ |

### 3.7 Recipe Reference (Copy/Remix)

**ID**: RECIPE-REFERENCE-001  
**Priority**: Medium

**Description**: The system shall allow users to create a recipe that references another recipe.

**Flow**:
1. User can specify `referenceRecipeId` when creating a recipe
2. `Recipe.referenceRecipeId` links to the source recipe
3. `Recipe.referencedBy` contains recipes that reference this one
4. OnDelete is set to `SetNull` (deleting original doesn't delete references)

### 3.8 Recipe Search in List

**ID**: RECIPE-SEARCH-001  
**Priority**: Medium

**Description**: The recipe list API shall support searching by ingredients.

**Flow**:
1. When `ingredients` query parameter is provided (comma-separated)
2. System finds recipes that contain ALL specified ingredients
3. Returns matching recipes with full details

## 4. Non-Functional Requirements

### 4.1 Performance
- Recipe list responses are cached (`TTL_RECIPES_LIST`, `TTL_RECIPES_MINE`)
- Pagination limits results to max 50 per page
- `recipeListItemSelect` optimizes query performance by selecting only needed fields

### 4.2 Data Integrity
- Referential integrity enforced via Prisma relations
- Cascade delete for dependent records
- Unique constraint on `(userId, recipeId)` for favorites
- Unique constraint on `(recipeId, ingredientId)` for recipe ingredients

### 4.3 Scalability
- Database indexing on `userId`, `visibility`, `createdAt`, `favoriteCount`
- Cache layer reduces database load for list views

## 5. API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/recipes` | GET | List recipes with pagination and filters |
| `/api/recipes` | POST | Create a new recipe |
| `/api/recipes/[id]` | GET | Get recipe detail |
| `/api/recipes/[id]/ratings` | GET | Get recipe ratings |
| `/api/recipes/[id]/recommended` | GET | Get recommended recipes |
| `/api/recipes/featured` | GET | Get featured recipes |
| `/api/recipes/upload` | POST | Upload recipe media |
| `/api/recipes/create-recipe/action` | POST | Create recipe action |

## 6. Data Models

### 6.1 Recipe Model
```prisma
model Recipe {
  id             String   @id @default(dbgenerated("gen_random_uuid()"))
  userId         String   @db.Uuid
  recipeName     String
  description    String?
  instructions   String?
  rating         Float    @default(0)
  reviewCount    Int      @default(0)
  favoriteCount  Int      @default(0)
  bgColor        String?
  aiProvider     String?
  visibility     String   @default("public")
  createdAt      DateTime @default(now())
  referenceRecipeId String? @db.Uuid
  user           User     @relation(fields: [userId], references: [id])
  referenceRecipe Recipe?  @relation("RecipeReference")
  referencedBy   Recipe[] @relation("RecipeReference")
  recipeIngredients RecipeIngredient[]
  equipmentItems RecipeEquipment[]
  reviews        Review[]
  favorites      Favorite[]
  images         RecipeImage[]
  videos         RecipeVideo[]
  weeklyRecommendations WeeklyRecommendation[]
  ingredientPairRecipes IngredientPairRecipe[]
  storePosts     StorePost[]
}
```

### 6.2 RecipeIngredient Model
```prisma
model RecipeIngredient {
  id            String  @id @default(dbgenerated("gen_random_uuid()"))
  recipeId     String  @db.Uuid
  ingredientId Int
  quantity      Float
  unit          String
  recipe     Recipe     @relation(fields: [recipeId], references: [id])
  ingredient Ingredient @relation(fields: [ingredientId], references: [id])
  @@unique([recipeId, ingredientId])
}
```

### 6.3 RecipeImage Model
```prisma
model RecipeImage {
  id String @id @default(dbgenerated("gen_random_uuid()"))
  recipeId String @db.Uuid
  imageUrl String
  createdAt DateTime @default(now())
  recipe Recipe @relation(fields: [recipeId], references: [id])
}
```

### 6.4 RecipeEquipment Model
```prisma
model RecipeEquipment {
  id String @id @default(dbgenerated("gen_random_uuid()"))
  recipeId String @db.Uuid
  name String
  createdAt DateTime @default(now())
  recipe Recipe @relation(fields: [recipeId], references: [id])
}
```

## 7. Files Structure

```
src/app/api/recipes/
  ├── route.ts           (GET list, POST create)
  ├── [id]/
  │   ├── route.ts       (GET detail)
  │   ├── ratings/route.ts
  │   └── recommended/route.ts
  ├── featured/route.ts
  ├── upload/route.ts
  └── create-recipe/
      └── action.ts
src/lib/
  ├── recipes.ts         (recipeListItemSelect, recipeCoverImage)
  ├── validations/recipe.schema.ts
  └── ingredients.ts     (upsertRecipeIngredients)
src/app/(main)/create-recipe/page.tsx
src/app/(main)/my-recipe/page.tsx
src/app/(main)/my-recipe/edit/[id]/page.tsx
src/app/(main)/recipe/[id]/page.tsx
```

## 8. Validation Schemas

### 8.1 Create Recipe Schema (`createRecipeSchema`)
- `recipeName`: string, 1-150 chars, required
- `description`: string, max 1000 chars, optional
- `instructions`: string, max 20,000 chars, optional
- `ingredients`: array of `{ name, quantity, unit, category? }`, min 1
- `equipmentItems`: array of `{ name }`, optional
- `store`: object with store details, optional
- `images`: array of URLs, optional
- `videos`: array of URLs, optional
- `bgColor`: string, max 30 chars, optional
- `aiProvider`: string, max 50 chars, optional
- `visibility`: enum ["public", "protected", "private", "draft"], default "public"
- `referenceRecipeId`: UUID, optional
- `systemRecipeId`: UUID, optional

### 8.2 Recipe List Query Schema (`recipeListQuerySchema`)
- `page`: integer, min 1, default 1
- `limit`: integer, min 1, max 50, default 10
- `mine`: boolean, optional
- `publicOnly`: boolean, optional
- `aiProvider`: string, optional
- `authorType`: enum ["all", "user", "ai"], default "all"

## 9. Cache Strategy
- Recipe list cache: `recipes:list:{page}:{limit}:{aiProvider}:{authorType}`
- Mine cache: `recipes:mine:{userId}:{page}:{limit}`
- Cache TTLs: `TTL_RECIPES_LIST` and `TTL_RECIPES_MINE`
- Cache invalidation on create/update/delete operations

## 10. Dependencies
- `@prisma/client` - Database ORM
- `prisma` - Database
- `zod` - Validation
- `next` - Framework
- `@supabase/storage` - Media storage

## 11. Assumptions and Constraints
- All recipes must have an owner (userId)
- AI-generated recipes use the system user (ai-system@kinyark.local) as owner
- Recipe images and videos are stored in Supabase Storage
- The `ingredients` array must contain at least one ingredient
- Recipe names must be unique enough to avoid confusion (enforced by AI)
- Draft recipes are excluded from all search results

---
*Document Version: 1.0*  
*Date: 2026-09-05*  
*Project: Kinyrak Ingredients*
