# SRS - Ingredient System

## 1. Introduction

### 1.1 Purpose
This document specifies the Software Requirements Specification for the Ingredient System of the Kinyrak Ingredients application. The ingredient system manages the categorization, creation, retrieval, and searching of food ingredients.

### 1.2 Scope
The ingredient system covers:
- CRUD operations for ingredients
- Ingredient categorization (Category model)
- Ingredient search and filtering
- Upserting recipe ingredients (linking recipes to ingredients)
- Ingredient autocomplete and suggestions for search
- Category management

### 1.3 References
- Prisma ORM with PostgreSQL
- Zod validation
- Next.js App Router API routes

## 2. System Overview

### 2.1 Architecture
The ingredient system maintains a master list of ingredients, each belonging to a category. Ingredients are referenced by recipes through the `RecipeIngredient` join table. The system supports case-insensitive searches and automatic category creation.

### 2.2 Actors
- **Admin/System**: Can create and manage ingredients and categories
- **All Users**: Can search and browse ingredients
- **Recipe Creator**: Ingredients are automatically upserted when creating recipes

## 3. Functional Requirements

### 3.1 Create Ingredient

**ID**: INGREDIENT-CREATE-001  
**Priority**: High

**Description**: The system shall allow creating new ingredients.

**Flow**:
1. User submits ingredient data (name, optional category, optional categoryId)
2. System validates input using `createIngredientSchema`
3. System resolves category ID:
   - If `categoryId` provided, use it directly
   - If `category` name provided, find existing category or create new one
4. System checks if ingredient with same name already exists
5. If exists with different category, returns error
6. If exists with same category, returns existing ingredient
7. Otherwise, creates new ingredient record
8. System invalidates ingredient cache

### 3.2 List Ingredients

**ID**: INGREDIENT-LIST-001  
**Priority**: High

**Description**: The system shall allow listing and filtering ingredients.

**Query Parameters**:
- `id`: Filter by ingredient ID
- `categoryId`: Filter by category ID
- `category`: Filter by category name (case-insensitive)
- `search`: Search by ingredient name (case-insensitive, contains)

**Flow**:
1. System validates query parameters
2. Applies filters based on provided parameters
3. Results are ordered by name ascending
4. Results include category details
5. Results are cached (`TTL_INGREDIENTS`)

### 3.3 Upsert Recipe Ingredients

**ID**: INGREDIENT-UPSERT-001  
**Priority**: High

**Description**: The system shall automatically upsert ingredients when creating recipes.

**Flow**:
1. When a recipe is created, the `upsertRecipeIngredients` function is called
2. System loads all categories once into a case-insensitive map
3. For each ingredient in the recipe:
   - If ingredient name exists, use existing record
   - If not, create new ingredient (with optional category)
4. Returns array of ingredient IDs
5. Creates `RecipeIngredient` associations with quantity and unit

**Optimization**:
- All category lookups are done in a single query
- Each ingredient upsert is done in parallel using `Promise.all`

### 3.4 Category Management

**ID**: INGREDIENT-CATEGORY-001  
**Priority**: Medium

**Description**: The system shall manage ingredient categories.

**Data Model**:
```prisma
model Category {
  id   Int    @id @default(autoincrement())
  name String @unique
  ingredients Ingredient[]
}
```

**Flow**:
- Categories are automatically created when an ingredient is added with a new category name
- Category names are unique
- Categories are used to organize ingredients

### 3.5 Ingredient Search

**ID**: INGREDIENT-SEARCH-001  
**Priority**: Medium

**Description**: The system shall support searching ingredients within recipes.

**Flow**:
1. Search queries can match ingredient names in recipes
2. The search system (`/api/search`) can filter recipes by ingredient name
3. Exact match on ingredient name is supported
4. Bigram overlap matching is used as fallback for Thai text

## 4. Non-Functional Requirements

### 4.1 Performance
- Ingredient list caching (`TTL_INGREDIENTS`)
- Category loading done once per upsert operation
- Parallel upsert operations for efficiency

### 4.2 Data Integrity
- Ingredient names are unique (case-sensitive in DB)
- Category names are unique
- Referential integrity between ingredients, categories, and recipes

## 5. API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/ingredients` | GET | List/filter ingredients |
| `/api/ingredients` | POST | Create new ingredient |
| `/api/ingredients/[id]` | GET | Get ingredient detail |
| `/api/ingredients/[id]` | PUT | Update ingredient |

## 6. Data Models

### 6.1 Category Model
```prisma
model Category {
  id   Int    @id @default(autoincrement())
  name String @unique
  ingredients Ingredient[]
}
```

### 6.2 Ingredient Model
```prisma
model Ingredient {
  id         Int    @id @default(autoincrement())
  name       String @unique
  categoryId Int?
  category          Category?          @relation(fields: [categoryId], references: [id])
  recipeIngredients RecipeIngredient[]
}
```

### 6.3 RecipeIngredient Model
```prisma
model RecipeIngredient {
  id            String  @id @default(dbgenerated("gen_random_uuid()"))
  recipeId     String  @db.Uuid
  ingredientId Int
  quantity      Float
  unit          String
  recipe     Recipe     @relation(fields: [recipeId], references: [id], onDelete: Cascade)
  ingredient Ingredient @relation(fields: [ingredientId], references: [id])
  @@unique([recipeId, ingredientId])
}
```

## 7. Files Structure

```
src/app/api/ingredients/
  ├── route.ts           (GET list, POST create)
  └── [id]/
      └── route.ts       (GET detail, PUT update)
src/lib/ingredients.ts   (upsertRecipeIngredients)
src/lib/validations/ingredient.schema.ts
src/app/(main)/search/
  ├── page.tsx
  └── results/page.tsx
```

## 8. Validation Schemas

### 8.1 Ingredient Item Schema
```typescript
{
  name: string, min 1, max 120
  quantity: number, positive, max 1,000,000
  unit: string, min 1, max 30
  category: string, optional, max 120
}
```

## 9. Cache Strategy
- Ingredient cache: `ingredient:{id}:{categoryId}:{category}:{search}`
- Cache TTL: `TTL_INGREDIENTS`
- Cache invalidation on create

## 10. Dependencies
- `@prisma/client` - Database ORM
- `zod` - Validation
- `next` - Framework

## 11. Assumptions and Constraints
- Ingredient names are unique across the system
- Categories are created on-demand when an ingredient with a new category is added
- Ingredient search is case-insensitive
- The system supports Thai ingredient names

---
*Document Version: 1.0*  
*Date: 2026-09-05*  
*Project: Kinyrak Ingredients*
