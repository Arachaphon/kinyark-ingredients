import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';

test.describe('Reviews & Ratings E2E', () => {
  test.describe.configure({ mode: 'serial' });

  test('POST /api/reviews - returns 401 when unauthorized', async ({ request }) => {
    const res = await request.post('/api/reviews', {
      data: { recipeId: '00000000-0000-0000-0000-000000000000', rating: 5 },
    });
    expect(res.status()).toBe(401);
  });

  test('POST /api/reviews - creates review and prevents duplicate review', async ({ page }) => {
    const timestamp = Date.now();
    const testEmail = 'e2e_rev_' + timestamp + '@test.com';
    const testPassword = 'StrongPassword1!';
    const testUsername = 'revuser' + String(timestamp).slice(-6);

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

    const createRes = await page.request.post('/api/recipes', {
      data: {
        recipeName: 'Reviewable Recipe ' + timestamp,
        ingredients: [{ name: 'Pork', quantity: 100, unit: 'g' }],
      },
    });
    expect(createRes.status()).toBe(201);
    const recipeId = (await createRes.json()).data.id;

    const rev1Res = await page.request.post('/api/reviews', {
      data: {
        recipeId,
        rating: 5,
        comment: 'Great recipe!',
        isAnonymous: false,
      },
    });
    expect(rev1Res.status()).toBe(201);
    const rev1Body = await rev1Res.json();
    expect(rev1Body.data.rating).toBe(5);

    const rev2Res = await page.request.post('/api/reviews', {
      data: {
        recipeId,
        rating: 4,
        comment: 'Duplicate review test',
      },
    });
    expect(rev2Res.status()).toBe(409);
  });
});
