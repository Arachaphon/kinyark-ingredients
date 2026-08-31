import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';

test.describe('Favorites & Interactions E2E', () => {
  test.describe.configure({ mode: 'serial' });

  test('GET /api/favorites - returns 401 when unauthorized', async ({ request }) => {
    const res = await request.get('/api/favorites');
    expect(res.status()).toBe(401);
  });

  test('POST /api/favorites - toggles recipe favorite status', async ({ page }) => {
    const timestamp = Date.now();
    const testEmail = 'e2e_fav_' + timestamp + '@test.com';
    const testPassword = 'StrongPassword1!';
    const testUsername = 'favuser' + String(timestamp).slice(-6);

    // 1. Signup & Login
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

    // 2. Create Recipe to Favorite
    const createRes = await page.request.post('/api/recipes', {
      data: {
        recipeName: 'Fav Recipe ' + timestamp,
        ingredients: [{ name: 'Egg', quantity: 2, unit: 'pcs' }],
      },
    });
    expect(createRes.status()).toBe(201);
    const recipeId = (await createRes.json()).data.id;

    // 3. Toggle Favorite ON
    const favOnRes = await page.request.post('/api/favorites', {
      data: { recipeId },
    });
    expect(favOnRes.status()).toBe(201);
    const favOnBody = await favOnRes.json();
    expect(favOnBody.data.favorited).toBe(true);

    // 4. Fetch User Favorites List
    const getFavsRes = await page.request.get('/api/favorites');
    expect(getFavsRes.status()).toBe(200);
    const getFavsBody = await getFavsRes.json();
    expect(getFavsBody.data.some((f: any) => f.recipeId === recipeId)).toBe(true);

    // 5. Toggle Favorite OFF
    const favOffRes = await page.request.post('/api/favorites', {
      data: { recipeId },
    });
    expect(favOffRes.status()).toBe(200);
    const favOffBody = await favOffRes.json();
    expect(favOffBody.data.favorited).toBe(false);
  });
});
