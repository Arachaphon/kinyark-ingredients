# validation.md — Validation Guidelines

Every external input must be validated with Zod before reaching the service layer.

## Rule

- API Routes
- Server Actions
- External input

**must** be validated using Zod before reaching the service layer.

## Schema Location

- All Zod schemas go in `src/lib/validations/`
- File naming: `kebab-case.schema.ts` (e.g. `auth.schema.ts`, `recipe.schema.ts`)
- Export schema + inferred type per file

## Pattern

```
// src/lib/validations/example.schema.ts
import { z } from "zod"

export const exampleSchema = z.object({ ... })
export type ExampleInput = z.infer<typeof exampleSchema>
```

## Validation Flow

```
Client Request
  → Route Handler / Server Action
    → Zod schema.parse() / .safeParse()
      → if FAIL → return 400 with error message
      → if PASS → pass typed data to Service Layer
        → Prisma query
          → Response
```

## Error Response Format

```ts
{
  success: false,
  message: "ข้อความ error (ภาษาไทย)",
  errors: { fieldName: "specific error" }
}
```

## API Route Validation Example

```ts
import { exampleSchema } from "@/lib/validations/example.schema"

export async function POST(req: Request) {
  const body = await req.json()
  const parsed = exampleSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { success: false, message: "ข้อมูลไม่ถูกต้อง", errors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }
  // parsed.data is now fully typed
}
```

## Server Action Validation Example

```ts
"use server"
import { exampleSchema } from "@/lib/validations/example.schema"

export async function submitAction(formData: FormData) {
  const data = Object.fromEntries(formData)
  const parsed = exampleSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors }
  }
  // proceed with parsed.data
}
```

## What to Validate

- Request body (JSON / FormData)
- Query parameters
- URL params (route segments)
- File uploads (size, MIME type)
- Auth tokens / session claims
