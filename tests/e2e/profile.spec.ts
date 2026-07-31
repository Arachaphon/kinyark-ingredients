import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';

test.describe('Profile E2E', () => {
  // ให้รันเรียงลำดับ ป้องกันปัญหา Parallel Session ชนกัน
  test.describe.configure({ mode: 'serial' });

  test('shows user profile in SettingModal after login', async ({ page }) => {
    const timestamp = `${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const testEmail = `e2e_profile_${timestamp}@test.com`;
    const testPassword = 'StrongPassword1!';
    const testUsername = `prof${timestamp.slice(-8)}`;

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
    await expect(page).toHaveURL(/.*\/home/);

    await page.locator('div[class*="3AC9B5"]').click();

    // รอจนกว่า fallback "User" (ตอนยังโหลด profile ไม่เสร็จ) หายไป ก่อน assert ข้อมูลจริง
    await expect(page.getByRole('heading', { name: 'User' })).toHaveCount(0, { timeout: 15000 });
    await expect(page.getByText(testUsername)).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(testEmail)).toBeVisible();

    const logoutButton = page.getByRole('button', { name: /ออกจากระบบ|Logout/i });
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
      await expect(page).toHaveURL(/.*\/login/);
    }
  });

  test('returns 401 when accessing profile API without session', async ({ page }) => {
    const res = await page.request.get('/api/auth/me');
    expect(res.status()).toBe(401);

    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  test('returns user data when calling profile API with session', async ({ page }) => {
    const timestamp = `${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const testEmail = `e2e_api_${timestamp}@test.com`;
    const testPassword = 'StrongPassword1!';
    const testUsername = `api${timestamp.slice(-8)}`;

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
    await expect(page).toHaveURL(/.*\/home/);

    const res = await page.request.get('/api/auth/me');
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.user).toBeDefined();
    expect(body.user.id).toBeTruthy();
    expect(body.user.username).toBe(testUsername);
    expect(body.user.email).toBe(testEmail);
  });

  test('PATCH /api/users/me - updates username', async ({ page }) => {
    const timestamp = `${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const testEmail = `e2e_patch_u_${timestamp}@test.com`;
    const testPassword = 'StrongPassword1!';
    const testUsername = `patchu${timestamp.slice(-8)}`;
    const newUsername = `upd${timestamp.slice(-8)}`;

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
    await expect(page).toHaveURL(/.*\/home/);

    const patchRes = await page.request.patch('/api/users/me', {
      data: { username: newUsername },
    });
    expect(patchRes.status()).toBe(200);
    const patchBody = await patchRes.json();
    expect(patchBody.data.user.username).toBe(newUsername);

    const getRes = await page.request.get('/api/users/me');
    const getBody = await getRes.json();
    expect(getBody.user.username).toBe(newUsername);
  });

  test('PATCH /api/users/me - requests email update', async ({ page }) => {
    const timestamp = `${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const testEmail = `e2e_em_${timestamp}@example.com`;
    const testPassword = 'StrongPassword1!';
    const testUsername = `emuser${timestamp.slice(-8)}`;
    const newEmail = `e2e_em_new_${timestamp}@example.com`;

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
    await expect(page).toHaveURL(/.*\/home/);

    const patchRes = await page.request.patch('/api/users/me', {
      data: { 
        email: newEmail,
        currentPassword: testPassword,
      },
    });

    expect(patchRes.status()).toBe(200);
    const patchBody = await patchRes.json();
    expect(patchBody.data.emailChangePending).toBe(true);

    const getRes = await page.request.get('/api/users/me');
    const getBody = await getRes.json();
    expect(getBody.user.email).toBe(testEmail);
  });

  test('PATCH /api/users/me - updates password', async ({ page }) => {
    const timestamp = `${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const testEmail = `e2e_pass_${timestamp}@test.com`;
    const testPassword = 'StrongPassword1!';
    const newPassword = 'NewStrongPass1!';
    const testUsername = `puser${timestamp.slice(-8)}`;

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
    await expect(page).toHaveURL(/.*\/home/);

    const patchRes = await page.request.patch('/api/users/me', {
      data: {
        newPassword,
        currentPassword: testPassword,
      },
    });
    expect(patchRes.status()).toBe(200);
    const patchBody = await patchRes.json();
    expect(patchBody.data.passwordUpdated).toBe(true);

    // Logout & Clear cookies
    await page.request.post('/api/auth/logout');
    await page.context().clearCookies();
    await page.goto('/login', { timeout: 10000 });

    // Old password should fail
    await loginPage.login(testEmail, testPassword);
    const oldError = await loginPage.getErrorMessage();
    expect(oldError).toBeTruthy();

    // Login with new password
    await page.context().clearCookies();
    await page.goto('/login', { timeout: 10000 });
    await loginPage.login(testEmail, newPassword);
    await expect(page).toHaveURL(/.*\/home/, { timeout: 15000 });
  });

  test('PATCH /api/users/me - returns 401 without session', async ({ request }) => {
    const res = await request.patch('/api/users/me', {
      data: { username: 'newname' },
    });
    expect(res.status()).toBe(401);

    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });
});