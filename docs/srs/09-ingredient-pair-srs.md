# SRS - Ingredient Pair Recipe System

## 1. Introduction

### 1.1 Purpose
This document specifies the Software Requirements Specification for the Ingredient Pair Recipe System of the Kinyrak Ingredients application. The system generates recipes based on pairs of ingredients selected by the user, with caching per ingredient combination and month.

### 1.2 Scope
The ingredient pair recipe system covers:
- Generating recipes from user-selected ingredient pairs
- Deduplication of ingredient sets (order-insensitive, case-insensitive)
- Monthly cache management for ingredient pairs
- Multi-provider AI generation (Gemini + Groq per ingredient pair)
- Duplicate prevention (AI instructed not to repeat existing recipe names)
- Storage of generated recipes as real database records
- IngredientPairRecipe cache tracking
- Image pre-warming for generated recipes

### 1.3 References
- Prisma ORM with PostgreSQL
- Google Generative AI (Gemini)
- OpenAI SDK (Groq)
- Zod validation schemas

## 2. System Overview

### 2.1 Architecture
The ingredient pair recipe system normalizes ingredient sets into sorted, lowercase keys to ensure deduplication. Each unique ingredient combination generates 2 recipes (one from Gemini, one from Groq). Cache is managed per month, and the system uses `Promise.allSettled` for fault tolerance.

### 2.2 Actors
- **End User**: Selects ingredients and requests recipe generation
- **System**: Normalizes keys, manages cache, calls AI, stores results
- **AI Providers**: Gemini and Groq

## 3. Functional Requirements

### 3.1 Ingredient Key Normalization

**ID**: PAIR-NORMALIZE-001  
**Priority**: High

**Description**: The system shall normalize ingredient sets into consistent keys for deduplication and caching.

**Algorithm**:
```typescript
export function normalizeIngredientKey(ingredients: string[]): string {
  return Array.from(
    new Set(
      ingredients
        .map((i) => i.trim())
        .filter(Boolean)
        .map((i) => i.toLowerCase())
    )
  )
    .sort()
    .join(",");
}
```

**Behavior**:
- Trims whitespace
- Filters empty strings
- Converts to lowercase (case-insensitive)
- Removes duplicates (Set)
- Sorts alphabetically
- Joins with commas
- Example: `["ไก่", "ไข่"]` and `["ไข่", "ไก่"]` → `"ไก่,ไข่"`

### 3.2 Month Key Generation

**ID**: PAIR-MONTH-001  
**Priority**: High

**Description**: The system shall generate a month key for cache management.

**Format**: `"YYYY-MM"` (e.g., `"2026-08"`)

**Purpose**: Cache expires monthly. Different months with the same ingredients generate new recipes.

### 3.3 Ingredient Pair Recipe Generation

**ID**: PAIR-GENERATE-001  
**Priority**: High

**Description**: The system shall generate recipes from user-selected ingredients.

**Preconditions**:
- At least 1 ingredient provided
- All ingredients are trimmed and non-empty

**Flow** (via `ensureIngredientPairRecipes`):
1. Normalize ingredient key
2. Get current month key
3. Delete expired records (`monthKey !== currentMonth`) from `IngredientPairRecipe`
4. Check for existing cached recipes in current month for each provider
5. If both providers cached → return cached recipes (no AI call)
6. Otherwise, call missing providers:
   - Gemini: generates 1 recipe
   - Groq: generates 1 recipe
7. Uses `Promise.allSettled` for parallel execution with graceful failure
8. For each successful result:
   - Deduplicate ingredients within the recipe
   - Upsert ingredients into DB
   - Create Recipe record with system user as owner
   - Create IngredientPairRecipe record linking ingredient key, month, provider, and recipe
   - Generate image via Pollinations.ai
9. Combine cached + newly generated recipes
10. Return `{ recipes: RecipeDto[], generated: boolean, missingProviders: string[] }`

### 3.4 Duplicate Prevention

**ID**: PAIR-DUPLICATE-001  
**Priority**: High

**Description**: The system shall prevent AI from generating duplicate recipe names.

**Implementation**:
- Fetch existing recipe names from DB (up to 200 non-draft recipes)
- Pass existing names to AI prompt
- AI is instructed: "ห้ามตั้งชื่อเมนูซ้ำกับเมนูที่มีอยู่แล้วในระบบเด็ดขาด"
- AI is given the full list of existing names for reference

**Prompt Constraint**:
```
- ห้ามตั้งชื่อเมนูซ้ำกับเมนูที่มีอยู่แล้วในระบบเด็ดขาด (ต้องไม่เหมือนหรือใกล้เคียงจนสับสน)
- รายชื่อเมนูที่มีอยู่ในระบบแล้ว (ห้ามซ้ำ): {existingNames}
```

### 3.5 Prompt Construction

**ID**: PAIR-PROMPT-001  
**Priority**: High

**Description**: The system shall construct structured prompts for AI recipe generation.

**Prompt Structure**:
1. Role: Thai expert chef (`${provider} เชฟผู้เชี่ยวชาญด้านการออกแบบเมนูอาหารไทย`)
2. Input: Selected ingredient pair
3. Rules:
   - 1 recipe only, reasonable, 1 meal, budget-friendly
   - Basic kitchen equipment (pot, pan, microwave)
   - At least 1 main ingredient from selection
   - No duplicate recipe names
   - JSON response only
4. Output schema: `{ "recipes": [{ "recipeName", "description", "instructions", "ingredients" }] }`
5. Additional constraints: quantity must be numeric

### 3.6 Cache Management

**ID**: PAIR-CACHE-001  
**Priority**: High

**Description**: The system shall manage caching of ingredient pair recipes.

**Cache Logic**:
- Cache key: `(ingredientKey, provider, monthKey)`
- `IngredientPairRecipe` table stores the mapping
- Records with `monthKey !== currentMonth` are deleted
- If record exists and has a recipe → return cached
- If record exists but recipe is null → treat as no cache, generate new
- If both providers have cached entries → return without AI call

**Data Model**:
```prisma
model IngredientPairRecipe {
  id            String   @id @default(dbgenerated("gen_random_uuid()"))
  ingredientKey String
  monthKey      String
  provider      String
  recipeId      String?  @db.Uuid
  recipe        Recipe?  @relation(fields: [recipeId], references: [id], onDelete: SetNull)
  createdAt     DateTime @default(now())
  @@unique([ingredientKey, provider])
  @@index([monthKey])
}
```

### 3.7 Transaction and Storage

**ID**: PAIR-TRANSACTION-001  
**Priority**: High

**Description**: The system shall store generated recipes in a single database transaction.

**Transaction Flow**:
1. Upsert all ingredients (deduplicated)
2. Create `Recipe` record with:
   - `userId`: system user
   - `aiProvider`: provider name
   - `visibility`: "public"
   - `recipeIngredients`: created from upserted ingredients
   - `images`: generated image URL
3. Create `IngredientPairRecipe` record
4. Transaction timeout: 30s, maxWait: 15s

**Error Handling**:
- Transaction ensures all-or-nothing for each recipe
- Failed providers don't block others (`Promise.allSettled`)

### 3.8 Image Generation

**ID**: PAIR-IMAGE-001  
**Priority**: Medium

**Description**: The system shall generate images for AI-created recipes.

**Implementation**:
- Pollinations.ai URL generation
- Same pattern as weekly recommendation system
- Seed varies by ingredient count and provider
- Image pre-warming after generation (90s timeout per image)

### 3.9 Response Format

**ID**: PAIR-RESPONSE-001  
**Priority**: High

**Description**: The system shall return recipes in a format compatible with the search results page.

**Response Structure**:
```json
{
  "items": [
    {
      "id": "...",
      "recipeName": "...",
      "description": "...",
      "instructions": "...",
      "aiProvider": "Gemini",
      "isAi": true,
      "rating": 0,
      "reviewCount": 0,
      "likes": 0,
      "favoriteCount": 0,
      "images": [{ "imageUrl": "..." }],
      "recipeIngredients": [...],
      "tags": [...ingredients...],
      "generated": true
    }
  ],
  "missingAiProviders": []
}
```

## 4. Non-Functional Requirements

### 4.1 Performance
- Cache eliminates redundant AI calls for same ingredient pairs
- `Promise.allSettled` parallelizes provider calls
- Image pre-warming ensures fast loading
- Transaction timeout: 30s

### 4.2 Reliability
- Multi-provider redundancy (Gemini + Groq)
- Graceful handling of individual provider failures
- Expired cache cleanup ensures fresh recipes monthly

### 4.3 Data Integrity
- Unique constraint `(ingredientKey, provider)` prevents duplicates
- `onDelete: SetNull` allows recipe deletion without breaking cache
- Transaction ensures consistent storage

### 4.4 Scalability
- Monthly cache expiry prevents unbounded growth
- Ingredient key normalization ensures efficient deduplication
- DB indexes on `monthKey` and `ingredientKey`

## 5. API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/ai/generate-recipe` | POST | Generate recipes from ingredient pairs |

## 6. Data Models

### 6.1 IngredientPairRecipe Model
```prisma
model IngredientPairRecipe {
  id            String   @id @default(dbgenerated("gen_random_uuid()"))
  ingredientKey String
  monthKey      String
  provider      String
  recipeId      String?  @db.Uuid
  recipe        Recipe?  @relation(fields: [recipeId], references: [id], onDelete: SetNull)
  createdAt     DateTime @default(now())
  @@unique([ingredientKey, provider])
  @@index([monthKey])
}
```

## 7. Files Structure

```
src/app/api/ai/generate-recipe/route.ts
src/lib/ai/ingredient-pair-recipe.ts
src/lib/validations/weekly.schema.ts
```

## 8. Dependencies
- `@google/generative-ai` - Gemini
- `openai` - Groq
- `@prisma/client` - Database ORM
- `zod` - Validation

## 9. Assumptions and Constraints
- At least 1 ingredient required
- Ingredient key normalization handles all deduplication
- Cache expires monthly
- AI is instructed not to create duplicate recipe names
- System user must exist as recipe owner
- Both Gemini and Groq are called per ingredient pair
- Transaction timeout of 30s may be insufficient for very complex recipes
- Image pre-warming uses `Promise.allSettled` with 90s timeout

---
*Document Version: 1.0*  
*Date: 2026-09-05*  
*Project: Kinyrak Ingredients*
