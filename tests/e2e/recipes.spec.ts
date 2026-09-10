import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';

test.describe('Recipe Management E2E', () => {
  test.describe.configure({ mode: 'serial' });

  test('GET /api/recipes - fetches public recipe list', async ({ request }) => {
    const res = await request.get('/api/recipes');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data).toBeDefined();
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.meta).toBeDefined();
  });

  test('POST /api/recipes - returns 401 when unauthorized', async ({ request }) => {
    const res = await request.post('/api/recipes', {
      data: {
        recipeName: 'Test Recipe',
        ingredients: [{ name: 'Pork', quantity: '200', unit: 'g' }],
      },
    });
    expect(res.status()).toBe(401);
  });

  test('POST /api/recipes - creates new recipe and verifies in list', async ({ page }) => {
    const timestamp = Date.now();
    const testEmail = 'e2e_recipe_' + timestamp + '@test.com';
    const testPassword = 'StrongPassword1!';
    const testUsername = 'recuser' + String(timestamp).slice(-6);
    const recipeTitle = 'E2E Special Dish ' + timestamp;

    // 1. Signup
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

    // 2. Login
    const loginPage = new LoginPage(page);
    await loginPage.login(testEmail, testPassword);
    await expect(page).toHaveURL(/.*\/home/, { timeout: 15000 });

    // 3. Create Recipe via API
    const createRes = await page.request.post('/api/recipes', {
      data: {
        recipeName: recipeTitle,
        description: 'Delicious E2E testing dish',
        instructions: '1. Prepare ingredients\n2. Cook with love',
        visibility: 'public',
        ingredients: [
          { name: 'Pork Belly', quantity: 300, unit: 'g' },
          { name: 'Garlic', quantity: 3, unit: 'cloves' },
        ],
      },
    });

    expect(createRes.status()).toBe(201);
    const createBody = await createRes.json();
    expect(createBody.data).toBeDefined();
    expect(createBody.data.id).toBeTruthy();
    expect(createBody.data.recipeName).toBe(recipeTitle);
    const createdRecipeId = createBody.data.id;

    // 4. Fetch Single Recipe Details
    const detailRes = await page.request.get('/api/recipes/' + createdRecipeId);
    expect(detailRes.status()).toBe(200);
    const detailBody = await detailRes.json();
    expect(detailBody.data.recipeName).toBe(recipeTitle);

    // 5. Delete Recipe (Owner Only)
    const deleteRes = await page.request.delete('/api/recipes/' + createdRecipeId);
    expect(deleteRes.status()).toBe(200);

    // 6. Verify Recipe Deleted
    const getDeletedRes = await page.request.get('/api/recipes/' + createdRecipeId);
    expect(getDeletedRes.status()).toBe(404);
  });
});
