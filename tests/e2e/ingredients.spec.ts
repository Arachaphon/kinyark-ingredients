import { test, expect } from '@playwright/test';

test.describe('Ingredients E2E', () => {
  test('GET /api/ingredients - fetches ingredient list', async ({ request }) => {
    const res = await request.get('/api/ingredients');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data).toBeDefined();
    expect(Array.isArray(body.data)).toBe(true);
  });
});
