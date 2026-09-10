import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';

test.describe('Search History E2E', () => {
  test.describe.configure({ mode: 'serial' });

  test('GET /api/search-history - returns 401 when unauthorized', async ({ request }) => {
    const res = await request.get('/api/search-history');
    expect(res.status()).toBe(401);
  });

  test('POST, GET, and DELETE /api/search-history - manages search history', async ({ page }) => {
    const timestamp = Date.now();
    const testEmail = 'e2e_sh_' + timestamp + '@test.com';
    const testPassword = 'StrongPassword1!';
    const testUsername = 'shuser' + String(timestamp).slice(-6);

    const signupPage = new SignupPage(page);
    await signupPage.goto();
    await signupPage.fillForm({
      username: testUsername,
      email: testEmail,
      password: testPassword,
      confirmPassword: testPassword,
      role: 'user',
    });
    await signupPage.submit();
    await expect(page).toHaveURL(/.*\/login/, { timeout: 10000 });

    const loginPage = new LoginPage(page);
    await loginPage.login(testEmail, testPassword);
    await expect(page).toHaveURL(/.*\/home/, { timeout: 15000 });

    const postRes = await page.request.post('/api/search-history', {
      data: { searchQuery: 'Spicy Soup' },
    });
    expect(postRes.status()).toBe(201);

    const getRes = await page.request.get('/api/search-history');
    expect(getRes.status()).toBe(200);
    const getBody = await getRes.json();
    expect(getBody.data.some((h: { searchQuery: string }) => h.searchQuery === 'Spicy Soup')).toBe(true);

    const deleteRes = await page.request.delete('/api/search-history');
    expect(deleteRes.status()).toBe(200);

    const getAfterDelete = await page.request.get('/api/search-history');
    expect(getAfterDelete.status()).toBe(200);
    const afterBody = await getAfterDelete.json();
    expect(afterBody.data.length).toBe(0);
  });
});
