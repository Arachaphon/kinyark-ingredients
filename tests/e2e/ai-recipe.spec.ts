import { test, expect } from '@playwright/test';

test.describe('AI Recipe Generation E2E', () => {
  test('POST /api/ai/generate-recipe - returns 400 when ingredients array is empty', async ({ request }) => {
    const res = await request.post('/api/ai/generate-recipe', {
      data: { ingredients: [] },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('วัตถุดิบ');
  });

  test('POST /api/ai/generate-recipe - generates recipes for given ingredients', async ({ request }) => {
    test.setTimeout(60000);
    const res = await request.post('/api/ai/generate-recipe', {
      data: { ingredients: ['ไข่ไก่', 'หมูสับ'] },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.items).toBeDefined();
    expect(Array.isArray(body.items)).toBe(true);
  });
});
