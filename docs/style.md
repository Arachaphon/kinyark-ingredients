# style.md — Naming Convention Guidelines

All new code must follow these conventions. Existing code that violates them should be updated when touched.

## Directory & File Naming

| Category | Convention | Examples |
|---|---|---|
| Route directories | `kebab-case` | `create-recipe/`, `my-recipe/`, `forgot-password/`, `reset-password/`, `check-email/` |
| Component files | `PascalCase` | `Navbar.tsx`, `SettingModal.tsx`, `CookieConsent.tsx`, `Footer.tsx` |
| Lib/utility files | `kebab-case` | `prisma.ts`, `utils.ts`, `proxy.ts` |
| Validation schemas | `kebab-case.schema.ts` | `auth.schema.ts`, `recipe.schema.ts`, `ingredient.schema.ts` |
| Type definition files | `index.ts` (in `src/types/`) | `src/types/index.ts` |
| API route files | `route.ts` (Next.js convention) | `src/app/api/recipes/route.ts` |
| Test files | `*.spec.ts` / `*.test.ts` | `auth.spec.ts`, `services.test.ts` |

## Code Naming

| Category | Convention | Examples |
|---|---|---|
| React components (function) | `PascalCase` | `function Navbar()`, `function SettingModal()` |
| React components (export) | `PascalCase` | `export default function Footer()` |
| Hooks | `camelCase` prefixed `use` | `useAuth()`, `useRecipes()` |
| Zod schemas (exported) | `camelCase` | `registerSchema`, `loginSchema`, `createRecipeSchema` |
| Types/Interfaces (exported) | `PascalCase` | `RegisterInput`, `RecipeInput`, `User`, `Review` |
| Functions/variables | `camelCase` | `getRecipeById()`, `toggleFavorite()`, `userId` |
| Constants (global) | `UPPER_SNAKE_CASE` | `MAX_FILE_SIZE`, `DEFAULT_PAGE_LIMIT` |

## Database Naming

| Layer | Convention | Examples |
|---|---|---|
| Prisma model fields | `camelCase` | `recipeName`, `userId`, `avatarUrl`, `searchQuery` |
| SQL columns (via `@map`/`@@map`) | `snake_case` | `recipe_name`, `user_id`, `avatar_url`, `search_query` |
| Table names (via `@@map`) | `snake_case` | `recipe_ingredients`, `search_histories`, `review_likes` |

## CSS & Styling

- Use Tailwind utility classes only
- No custom CSS class names, CSS modules, or BEM
- Color tokens via Tailwind theme (`bg-[#...]` or theme variables in `globals.css`)

## File Structure Conventions

- One component per file
- Group route files by feature under `src/app/`
- Place shared logic in `src/lib/`
- Place reusable components in `src/components/`
- Place types in `src/types/index.ts`
