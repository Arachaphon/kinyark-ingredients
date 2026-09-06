# SRS - AI Recipe Generation System

## 1. Introduction

### 1.1 Purpose
This document specifies the Software Requirements Specification for the AI Recipe Generation System of the Kinyrak Ingredients application. The AI system generates recipes from ingredients using large language models (Gemini, Groq, and DeepSeek).

### 1.2 Scope
The AI system covers:
- Recipe generation from user-provided ingredients
- Multi-provider AI support (Gemini, Groq, DeepSeek)
- Ingredient pair recipe generation
- Weekly recommendations (seasonal + trending)
- AI-generated recipe storage as actual Recipe records
- Response validation and schema enforcement
- Fallback handling when AI providers fail

### 1.3 References
- Google Generative AI (`@google/generative-ai`)
- OpenAI SDK (`openai`) - used for Groq and DeepSeek
- `ai` SDK (`@ai-sdk/google`)
- `@ai-sdk/google`
- Zod validation schemas

## 2. System Overview

### 2.1 Architecture
The AI system uses a multi-provider architecture with two primary AI services:
- **Gemini** (Google): Used for seasonal recipes and ingredient pair recipes
- **Groq** (OpenAI-compatible): Used for trending recipes
- **DeepSeek**: Available as an alternative provider via `/api/ai`

Each AI provider generates recipes from ingredient inputs, and the results are validated against predefined Zod schemas before being stored as actual `Recipe` records in the database.

### 2.2 Actors
- **End User**: Requests AI-generated recipes
- **System**: Manages AI provider connections, schema validation, and database storage
- **AI Providers**: Gemini, Groq, DeepSeek

## 3. Functional Requirements

### 3.1 Recipe Generation from Ingredients

**ID**: AI-GENERATE-001  
**Priority**: High

**Description**: The system shall generate recipes from user-provided ingredients using AI.

**Preconditions**:
- User provides at least 1 ingredient
- AI API keys are configured (`GEMINI_API_KEY`, `GROQ_API_KEY`)

**Flow** (via `/api/ai/generate-recipe`):
1. User sends POST request with `{ ingredients: string[] }`
2. System validates ingredients array is non-empty
3. System normalizes ingredient key (sorted, lowercase, unique)
4. System calls `ensureIngredientPairRecipes()`:
   - Checks if cached recipes exist for this ingredient pair in the current month
   - If cached: returns existing recipes (no AI call)
   - If not cached: calls both Gemini and Groq
5. Each AI provider generates 1 recipe per call
6. Response validated against `weeklyAiRecipeSchema`
7. Recipes are stored as actual `Recipe` records with:
   - `userId`: system user (`ai-system@kinyark.local`)
   - `aiProvider`: "gemini" or "groq"
   - `visibility`: "public"
   - Images generated via Pollinations.ai
8. `IngredientPairRecipe` records are created to track the cache
9. System returns `{ items: [...], generated: boolean, missingAiProviders: string[] }`

**Retry/Fallback**:
- If one AI provider fails, the other still works (`Promise.allSettled`)
- `missingProviders` array indicates which providers failed
- Empty results are returned if all providers fail (no 500 error)

### 3.2 Multi-Provider AI Support

**ID**: AI-PROVIDERS-001  
**Priority**: High

**Description**: The system shall support multiple AI providers for redundancy and diversity.

**Providers**:

| Provider | Model | Use Case | API Key |
|----------|-------|----------|---------|
| Gemini | `gemini-2.5-flash` / `gemini-3.6-flash` | Seasonal, Ingredient Pair | `GEMINI_API_KEY` |
| Groq | `openai/gpt-oss-120b` / `qwen/qwen3.8-27b` | Trending | `GROQ_API_KEY` |
| DeepSeek | `deepseek-chat` | Alternative | `DEEPSEEK_API_KEY` |

**Gemini Call** (`callGemini`):
```typescript
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });
const result = await model.generateContent(prompt);
return result.response.text();
```

**Groq Call** (`callGroq`):
```typescript
const groq = new OpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: process.env.GROQ_API_KEY,
});
const completion = await groq.chat.completions.create({
  messages: [{ role: "user", content: prompt }],
  model: "qwen/qwen3.8-27b",
  response_format: { type: "json_object" },
  max_tokens: 4096,
});
return completion.choices[0]?.message?.content ?? "";
```

**DeepSeek Call** (via `/api/ai` route):
```typescript
const openai = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: process.env.DEEPSEEK_API_KEY,
});
const completion = await openai.chat.completions.create({
  messages: [{ role: "user", content: prompt }],
  model: "deepseek-chat",
});
```

### 3.3 Prompt Engineering

**ID**: AI-PROMPT-001  
**Priority**: High

**Description**: The system shall use structured prompts to guide AI recipe generation.

**Prompt Structure** (for Ingredient Pair):
- Role: Thai expert chef
- Input: Selected ingredient pair
- Rules:
  - Create 1 reasonable recipe, budget-friendly, 1 meal
  - Use basic kitchen equipment (pot, pan, microwave)
  - Must include at least 1 main ingredient from selection
  - No duplicate recipe names from existing system
  - JSON response only, no extra text
  - Quantity must be numeric (not fractions)
- Output format: `{ "recipes": [{ "recipeName", "description", "instructions", "ingredients" }] }`

**Ingredient Prompt** (`buildIngredientPrompt`):
- Used for single recipe generation from ingredients
- Includes user context and selected ingredients

### 3.4 Response Validation

**ID**: AI-VALIDATE-001  
**Priority**: High

**Description**: The system shall validate all AI responses against Zod schemas before processing.

**Schemas**:
- `generateMenuResponseSchema`: For single recipe generation
- `weeklyAiRecipeSchema`: For weekly recommendation and ingredient pair recipes

**Flow**:
1. AI returns raw text (JSON string)
2. System strips markdown code blocks (`\`\`\`json`, `\`\`\``)
3. Parse as JSON
4. Validate against schema
5. If invalid, throw error (caught gracefully)
6. If valid, proceed to storage

### 3.5 Image Generation

**ID**: AI-IMAGE-001  
**Priority**: Medium

**Description**: The system shall generate recipe images automatically.

**Implementation**:
- Uses Pollinations.ai API
- Prompt: `close-up food photography, top-down view of {recipeName} served on a plate, clean background, no people`
- Negative prompt: `people, person, hands, face, crowd, human, text, watermark, logo`
- Seed-based URL generation for consistency
- Image pre-warming: All images are fetched after generation for cache warming

### 3.6 AI Recipe Storage

**ID**: AI-STORE-001  
**Priority**: High

**Description**: The system shall store AI-generated recipes as actual database records.

**Flow**:
1. System creates `Recipe` record with:
   - `userId`: System user ID (from `getSystemUserId()`)
   - `recipeName`, `description`, `instructions` from AI
   - `aiProvider`: Provider name ("gemini" or "groq")
   - `visibility`: "public"
   - `recipeIngredients`: Created from AI ingredient list (upserted)
   - `images`: First generated image URL
2. For ingredient pair recipes: creates `IngredientPairRecipe` record
3. For weekly recommendations: creates `WeeklyRecommendation` record
4. All storage operations are in a database transaction

**System User**:
- Special user `ai-system@kinyark.local` is created/upserted as owner of AI recipes
- Ensures every recipe has a valid owner (Prisma requires `userId`)

### 3.7 Fallback Handling

**ID**: AI-FALLBACK-001  
**Priority**: High

**Description**: The system shall gracefully handle AI provider failures.

**Strategies**:
1. `Promise.allSettled` instead of `Promise.all` - one failure doesn't block others
2. Missing providers are reported in response (`missingProviders` array)
3. If all providers fail, return empty results (not 500 error)
4. If no real ingredients found in DB, use fallback generic ingredients
5. Transaction timeout: 30s (30,000ms) with maxWait 15s

### 3.8 Weekly Recommendation Generation

**ID**: AI-WEEKLY-001  
**Priority**: High

**Description**: The system shall generate weekly recipe recommendations.

**Flow** (see also `Weekly Recommendation System` SRS):
1. System determines current ISO week key (`YYYY-WNN`)
2. If recommendations already exist for this week → return from DB
3. Otherwise:
   - Get seasonal ingredients based on current month
   - Get trending ingredients based on most-used ingredients in DB
   - Call Gemini for seasonal recipes (4 recipes)
   - Call Groq for trending recipes (4 recipes)
   - Store all 8 recipes as `Recipe` + `WeeklyRecommendation` records
4. Images are pre-warmed for better UX

### 3.9 Alternative AI Route (`/api/ai`)

**ID**: AI-ALTERNATIVE-001  
**Priority**: Medium

**Description**: The system provides a generic AI chat endpoint for flexibility.

**Flow** (via `/api/ai`):
1. POST request with `{ prompt, provider }`
2. Provider can be "gemini", "deepseek", or others
3. Returns `{ success: boolean, text: string }`
4. Generic endpoint for experimentation

## 4. Non-Functional Requirements

### 4.1 Performance
- AI calls are parallelized (`Promise.allSettled`)
- Image pre-warming for faster page loads
- Caching by ingredient key + month to avoid repeated AI calls
- Transaction timeout of 30 seconds max

### 4.2 Reliability
- Multi-provider architecture ensures redundancy
- Graceful degradation when providers fail
- Circuit breaker pattern via `Promise.allSettled`
- Fallback ingredients when DB has no real data

### 4.3 Security
- API keys stored in environment variables
- AI system user is isolated from regular users
- Input validation before sending to AI providers

### 4.4 Scalability
- Recipe caching by ingredient pair prevents redundant AI calls
- Monthly cache keys allow seasonal rotation
- DB indexes support efficient querying

## 5. API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/ai/generate-recipe` | POST | Generate recipes from ingredients |
| `/api/ai` | POST | Generic AI chat endpoint |
| `/api/ai/ingredient-pair` | POST | Generate recipes from ingredient pairs |

## 6. Data Models

### 6.1 AI Recipe Flow
```
User ingredients → normalizeIngredientKey() → check cache (IngredientPairRecipe)
→ if cache miss: call Gemini + Groq → validate schema → store Recipe → store IngredientPairRecipe
→ return RecipeDto[]
```

### 6.2 Weekly Recommendation Flow
```
Week key → check cache (WeeklyRecommendation)
→ if cache miss: get seasonal/trending ingredients → call Gemini + Groq → store Recipe → store WeeklyRecommendation
→ return recipe[]
```

### 6.3 System User
- `ai-system@kinyark.local` is a special system account
- Created/upserted via `getSystemUserId()`
- Owns all AI-generated recipes

## 7. Files Structure

```
src/app/api/ai/
  ├── route.ts              (Generic AI chat)
  └── generate-recipe/route.ts (Generate recipes from ingredients)
src/lib/ai/
  ├── generate-recipe.ts    (Single recipe generation)
  ├── ingredient-pair-recipe.ts (Ingredient pair recipe generation)
  ├── weekly-recommendation.ts (Weekly recommendation generation)
  ├── system-user.ts        (AI system user management)
  ├── prompts.ts            (Prompt building for ingredient generation)
  ├── weekly-prompts.ts     (Prompt building for weekly recommendations)
  └── ai-author.ts          (AI author utilities)
src/lib/validations/
  ├── ai.schema.ts          (Single recipe validation)
  └── weekly.schema.ts      (Weekly recipe validation)
src/app/(main)/create-recipe/
  └── page.tsx              (AI creation UI)
```

## 8. Validation Schemas

### 8.1 GenerateMenuRequest (`ai.schema.ts`)
```typescript
{
  ingredients: IngredientItem[],
  userContext: object,
  provider: "gemini" | "groq"
}
```

### 8.2 WeeklyAiRecipe (`weekly.schema.ts`)
```typescript
{
  recipeName: string,
  description: string,
  instructions: string,
  ingredients: [{ name, quantity, unit }]
}
```

### 8.3 GenerateMenuResponse (`ai.schema.ts`)
```typescript
{
  recipeName: string,
  description: string,
  instructions: string,
  ingredients: [{ name, quantity, unit }]
}
```

## 9. Dependencies
- `@google/generative-ai` - Google Gemini AI
- `openai` - OpenAI SDK (used for Groq and DeepSeek)
- `@ai-sdk/google` - AI SDK integration
- `ai` - AI SDK
- `zod` - Validation
- `@prisma/client` - Database ORM

## 10. Environment Variables
- `GEMINI_API_KEY` - Google Gemini API key
- `GROQ_API_KEY` - Groq API key
- `DEEPSEEK_API_KEY` - DeepSeek API key

## 11. Assumptions and Constraints
- AI providers require valid API keys
- All AI-generated recipes are stored as real database records
- The system user (`ai-system@kinyark.local`) must exist in the database
- AI responses must be valid JSON
- Recipe names must be unique (AI is instructed to avoid duplicates)
- Images are generated from recipe names via Pollinations.ai
- Monthly cache keys ensure seasonal rotation

---
*Document Version: 1.0*  
*Date: 2026-09-05*  
*Project: Kinyrak Ingredients*
