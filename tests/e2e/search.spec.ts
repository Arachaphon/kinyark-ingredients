import { test, expect } from '@playwright/test';

test.describe('Search & Filter E2E', () => {
  test('GET /api/search - returns search results by query keyword', async ({ request }) => {
    const res = await request.get('/api/search?q=Pork');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('GET /api/search - returns search results by ingredients filter', async ({ request }) => {
    const res = await request.get('/api/search?ingredients=Garlic');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });
});
