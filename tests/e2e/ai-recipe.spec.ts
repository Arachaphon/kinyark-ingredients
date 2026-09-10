import { test, expect, type APIRequestContext } from '@playwright/test';

async function postGenerateRecipe(
  request: APIRequestContext,
  userId: string,
  ingredients: string[]
) {
  return request.post('/api/ai/generate-recipe', {
    headers: { 'x-user-id': userId },
    data: { ingredients },
  });
}

test.describe('AI Recipe Generation E2E', () => {
  test('POST /api/ai/generate-recipe - returns 400 when ingredients array is empty', async ({ request }) => {
    const res = await postGenerateRecipe(request, 'e2e-ai-empty', []);
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('วัตถุดิบ');
  });

  test('POST /api/ai/generate-recipe - generates recipes for given ingredients', async ({ request }) => {
    test.setTimeout(60000);
    let res = await postGenerateRecipe(request, 'e2e-ai-generate', ['ไข่ไก่', 'หมูสับ']);

    if (res.status() === 429) {
      const body = await res.json();
      const waitMs =
        typeof body?.retryAfterMs === 'number'
          ? body.retryAfterMs
          : Number(res.headers()['retry-after'] ?? 5) * 1000;
      await new Promise((resolve) => setTimeout(resolve, waitMs + 500));
      res = await postGenerateRecipe(request, 'e2e-ai-generate', ['ไข่ไก่', 'หมูสับ']);
    }

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.items).toBeDefined();
    expect(Array.isArray(body.items)).toBe(true);
  });
});
