# SRS - Weekly Recommendation System

## 1. Introduction

### 1.1 Purpose
This document specifies the Software Requirements Specification for the Weekly Recommendation System of the Kinyrak Ingredients application. The system generates personalized recipe recommendations based on seasonal ingredients and trending popularity.

### 1.2 Scope
The weekly recommendation system covers:
- Generating seasonal recipe recommendations (based on current month)
- Generating trending recipe recommendations (based on most-used ingredients)
- Weekly caching to avoid repeated AI calls
- Storing recommendations as actual Recipe and WeeklyRecommendation records
- Image pre-warming for better user experience
- Multi-provider AI support (Gemini for seasonal, Groq for trending)
- Fallback handling when AI providers fail

### 1.3 References
- ISO week number calculation
- Seasonal ingredient mapping per Thai month
- Prisma ORM
- AI Provider APIs (Gemini, Groq)

## 2. System Overview

### 2.1 Architecture
The weekly recommendation system uses a cache-first approach with a unique week key (`YYYY-WNN`). Each week generates exactly 8 recipes: 4 seasonal + 4 trending. The system uses `Promise.allSettled` to ensure partial failures don't block the entire recommendation set.

### 2.2 Actors
- **End User**: Views weekly recommendations
- **System**: Generates and caches weekly recommendations
- **AI Providers**: Gemini (seasonal), Groq (trending)

## 3. Functional Requirements

### 3.1 Week Key Calculation

**ID**: WEEKLY-WEEK-KEY-001  
**Priority**: High

**Description**: The system shall calculate the current ISO week key to identify recommendation periods.

**Algorithm**:
```typescript
export function getWeekKey(date = new Date()): string {
  // Move to Thursday of current week
  const dayNum = (target.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNum + 3);
  // Calculate ISO week number
  const firstThursday = new Date(target.getFullYear(), 0, 4);
  const firstDay = (firstThursday.getDay() + 6) % 7;
  firstThursday.setDate(firstThursday.getDate() - firstDay + 3);
  const weekNo = 1 + Math.round((target.getTime() - firstThursday.getTime()) / (7 * 24 * 60 * 60 * 1000));
  return `${year}-W${String(weekNo).padStart(2, "0")}`;
}
```

**Output Format**: `"2026-W35"` (Year-WeekNumber, zero-padded to 2 digits)

### 3.2 Seasonal Recipe Generation

**ID**: WEEKLY-SEASONAL-001  
**Priority**: High

**Description**: The system shall generate seasonal recipe recommendations based on the current month.

**Seasonal Ingredient Mapping**:

| Month | Seasonal Ingredients |
|-------|---------------------|
| March (03) | มะม่วง, สับปะรด, มะปราง, มะยงชิด, แตงโม |
| April (04) | มะม่วง, สับปะรด, มะปราง, มะยงชิด, ทุเรียน |
| May (05) | มะละกอ, ฟักทอง, ข้าวโพด, ผักบุ้ง, ถั่วฝักยาว |
| June (06) | มะละกอ, ฟักทอง, ข้าวโพด, ผักบุ้ง, เห็ด |
| July (07) | เห็ด, ข้าวโพด, ฟักทอง, ผักบุ้ง, กะหล่ำปลี |
| August (08) | เห็ด, ข้าวโพด, ฟักทอง, ผักบุ้ง, สับปะรด |
| September (09) | กล้วย, แก้วมังกร, ลำไย, กะหล่ำปลี, ฟักทอง |
| October (10) | กล้วย, แก้วมังกร, ลำไย, เงาะ, ฟักทอง |
| November (11) | แอปเปิ้ล, องุ่น, ส้ม, กะหล่ำปลี, แครอท |
| December (12) | แอปเปิ้ล, องุ่น, ส้ม, แครอท, มันฝรั่ง |
| January (01) | แอปเปิ้ล, องุ่น, ส้ม, แครอท, มันฝรั่ง |
| February (02) | แอปเปิ้ล, องุ่น, ส้ม, แครอท, มันฝรั่ง |

**Flow**:
1. Determine current month key (e.g., "08")
2. Filter seasonal ingredient candidates to only those existing in the DB
3. Sample 8 ingredients (4 per type × 2) from the real DB ingredients
4. If no real ingredients found, use fallback: ["ผัก", "ไก่", "ไข่"]
5. Build seasonal prompt for Gemini
6. Call Gemini to generate 4 recipes
7. Store as Recipe records with `aiProvider: "gemini"` and type: "seasonal"

### 3.3 Trending Recipe Generation

**ID**: WEEKLY-TRENDING-001  
**Priority**: High

**Description**: The system shall generate trending recipe recommendations based on most-used ingredients.

**Algorithm**:
1. Query `recipeIngredient` table grouped by `ingredientId`, count occurrences
2. Sort by count descending
3. Take top 30 ingredient IDs
4. Fetch actual ingredient names from DB
5. Sample 8 trending ingredients (4 per type × 2)
6. If no trending data, use fallback: ["ไก่", "หมู", "ไข่"]
7. Build trending prompt for Groq
8. Call Groq to generate 4 recipes
9. Store as Recipe records with `aiProvider: "groq"` and type: "trending"

**Data Source**: Real usage data from `recipe_ingredients` table (not mock data)

### 3.4 Weekly Recommendation Storage

**ID**: WEEKLY-STORAGE-001  
**Priority**: High

**Description**: The system shall store generated recommendations in the database.

**Data Model**:
```prisma
model WeeklyRecommendation {
  id        String   @id @default(dbgenerated("gen_random_uuid()"))
  weekKey   String
  type      String    // "seasonal" or "trending"
  recipeId  String   @db.Uuid
  recipe    Recipe   @relation(fields: [recipeId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  @@index([weekKey])
}
```

**Storage Flow**:
1. Create `Recipe` records (4 seasonal + 4 trending = 8 total)
2. Create `WeeklyRecommendation` records linking weekKey, type, and recipeId
3. All in a single Prisma transaction (timeout: 120s, maxWait: 15s)
4. Each recipe gets:
   - `userId`: System user
   - `aiProvider`: "gemini" or "groq"
   - `visibility`: "public"
   - Images from Pollinations.ai
   - Ingredients upserted into DB

### 3.5 Cache Management

**ID**: WEEKLY-CACHE-001  
**Priority**: High

**Description**: The system shall cache weekly recommendations and only regenerate once per week.

**Flow**:
1. Check if `WeeklyRecommendation` records exist for current `weekKey`
2. If 8+ records exist → return from DB (no AI call)
3. If fewer than 8 records exist → generate missing ones
4. If `force=true` → delete existing records and regenerate
5. Week key ensures no duplicate generation within the same week

**Force Regeneration**:
```typescript
if (options?.force) {
  await prisma.weeklyRecommendation.deleteMany({ where: { weekKey } });
}
```

### 3.6 Image Pre-Warming

**ID**: WEEKLY-IMAGE-WARM-001  
**Priority**: Medium

**Description**: The system shall pre-generate and fetch all recipe images for faster page loads.

**Flow**:
1. After generating all 8 recipes, collect all image URLs
2. `Promise.allSettled` fetch all image URLs in parallel
3. Each fetch has 90s timeout
4. Image failures are silently ignored
5. Ensures images are cached by Pollinations.ai before user requests them

**Why**: First-time image generation takes 30-60s per image; pre-warming makes subsequent loads instant.

### 3.7 Response Structure

**ID**: WEEKLY-RESPONSE-001  
**Priority**: High

**Description**: The system shall return structured weekly recommendation data.

**Response**:
```json
{
  "success": true,
  "weekKey": "2026-W35",
  "generated": true,
  "missingProviders": [],
  "recipes": [
    { "id", "type", "recipeName", "rating", "favoriteCount", "createdAt", "bgColor", "visibility", "imageUrl" }
  ]
}
```

### 3.8 API Endpoint

**ID**: WEEKLY-API-001  
**Priority**: High

**Description**: The weekly recommendations endpoint.

**Endpoint**: `GET /api/weekly-recommendations`

**Query Parameters**:
- `force`: If "true", forces regeneration of all recommendations

**Flow**:
1. Parse `force` query parameter
2. Call `ensureWeeklyRecommendations({ force })`
3. Map results to response format
4. Return JSON response

## 4. Non-Functional Requirements

### 4.1 Performance
- 8 recipes generated per week (4 seasonal + 4 trending)
- AI calls are parallelized
- Image pre-warming happens after generation
- Database transaction timeout: 120s

### 4.2 Reliability
- `Promise.allSettled` ensures partial failures don't block everything
- Empty results returned if all providers fail (not 500 error)
- `missingProviders` array reports which providers failed
- Database transaction ensures consistency

### 4.3 Data Integrity
- All recipes have valid owners (system user)
- WeeklyRecommendation records link to real Recipe records
- `onDelete: Cascade` ensures cleanup when recipes are deleted

### 4.4 Scalability
- Week key prevents redundant generation
- Cache is automatically invalidated per week
- Seasonal ingredients are filtered to real DB entries only

## 5. API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/weekly-recommendations` | GET | Get weekly recipe recommendations |

## 6. Data Models

### 6.1 WeeklyRecommendation Model
```prisma
model WeeklyRecommendation {
  id        String   @id @default(dbgenerated("gen_random_uuid()"))
  weekKey   String
  type      String    // "seasonal" | "trending"
  recipeId  String   @db.Uuid
  recipe    Recipe   @relation(fields: [recipeId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  @@index([weekKey])
}
```

### 6.2 SEASONAL_INGREDIENTS Map
Hard-coded in `weekly-recommendation.ts`, mapping Thai month numbers to seasonal ingredient names. Only real DB ingredient names are used (filtered).

## 7. Files Structure

```
src/app/api/weekly-recommendations/route.ts
src/lib/ai/
  ├── weekly-recommendation.ts   (Main logic)
  └── weekly-prompts.ts          (Prompt builders)
src/lib/validations/weekly.schema.ts
```

## 8. Dependencies
- `@google/generative-ai` - Gemini for seasonal
- `openai` - Groq for trending
- `@prisma/client` - Database ORM
- `src/lib/ai/system-user.ts` - System user management

## 9. Assumptions and Constraints
- Exactly 8 recipes per week (4 seasonal + 4 trending)
- Each AI provider generates exactly 4 recipes
- Seasonal ingredients vary by Thai month
- Trending ingredients are based on real DB usage data
- System user (`ai-system@kinyark.local`) must exist
- Week key uses ISO week format
- Missing providers are reported but don't cause errors

---
*Document Version: 1.0*  
*Date: 2026-09-05*  
*Project: Kinyrak Ingredients*
