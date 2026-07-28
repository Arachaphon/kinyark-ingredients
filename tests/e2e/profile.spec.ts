import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';

test.describe('Profile E2E', () => {
  test('shows user profile in SettingModal after login', async ({ page }) => {
    const timestamp = Date.now();
    const testEmail = `e2e_profile_${timestamp}@test.com`;
    const testPassword = 'StrongPassword1!';
    const testUsername = `profileuser${timestamp}`;

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
    await expect(page).toHaveURL(/.*\/home/);

    // 3. Click avatar/profile circle to open SettingModal
    // avatar circle มี class border-[#3AC9B5], h1 heading มี text-[#3AC9B5]
    // ใช้ div[class*="3AC9B5"] เพื่อเลือกเฉพาะ div เท่านั้น
    await page.locator('div[class*="3AC9B5"]').click();

    // 4. Wait for SettingModal to appear and verify profile info
    await expect(page.getByText(testUsername)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(testEmail)).toBeVisible();

    // 5. Logout via modal button
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
    const timestamp = Date.now();
    const testEmail = `e2e_api_${timestamp}@test.com`;
    const testPassword = 'StrongPassword1!';
    const testUsername = `apiuser${timestamp}`;

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

    // 2. Login to get session cookies
    const loginPage = new LoginPage(page);
    await loginPage.login(testEmail, testPassword);
    await expect(page).toHaveURL(/.*\/home/);

    // 3. Call profile API with the session cookies
    const res = await page.request.get('/api/auth/me');
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.user).toBeDefined();
    expect(body.user.id).toBeTruthy();
    expect(body.user.username).toBe(testUsername);
    expect(body.user.email).toBe(testEmail);
    expect(body.user.avatarUrl).toBeDefined();
  });

  test('PATCH /api/users/me - updates username', async ({ page }) => {
    const timestamp = Date.now();
    const testEmail = `e2e_patch_username_${timestamp}@test.com`;
    const testPassword = 'StrongPassword1!';
    const testUsername = `patchuser${timestamp}`;
    const newUsername = `updated${timestamp}`;

    // Signup
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

    // Login
    const loginPage = new LoginPage(page);
    await loginPage.login(testEmail, testPassword);
    await expect(page).toHaveURL(/.*\/home/);

    // PATCH username
    const patchRes = await page.request.patch('/api/users/me', {
      data: { username: newUsername },
    });
    expect(patchRes.status()).toBe(200);
    const patchBody = await patchRes.json();
    expect(patchBody.data.user.username).toBe(newUsername);

    // GET verify
    const getRes = await page.request.get('/api/users/me');
    const getBody = await getRes.json();
    expect(getBody.user.username).toBe(newUsername);
  });

  test('PATCH /api/users/me - requests email update', async ({ page }) => {
    const timestamp = Date.now();
    const testEmail = `e2e_patch_email_${timestamp}@test.com`;
    const testPassword = 'StrongPassword1!';
    const testUsername = `emailuser${timestamp}`;
    const newEmail = `e2e_patch_email_new_${timestamp}@test.com`;

    // Signup
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

    // Login
    const loginPage = new LoginPage(page);
    await loginPage.login(testEmail, testPassword);
    await expect(page).toHaveURL(/.*\/home/);

    // PATCH email
    const patchRes = await page.request.patch('/api/users/me', {
      data: { email: newEmail },
    });
    expect(patchRes.status()).toBe(200);
    const patchBody = await patchRes.json();
    expect(patchBody.data.emailChangePending).toBe(true);

    // GET still shows old confirmed email
    const getRes = await page.request.get('/api/users/me');
    const getBody = await getRes.json();
    expect(getBody.user.email).toBe(testEmail);
  });

  test('PATCH /api/users/me - updates password', async ({ page }) => {
    const timestamp = Date.now();
    const testEmail = `e2e_patch_pass_${timestamp}@test.com`;
    const testPassword = 'StrongPassword1!';
    const newPassword = 'NewStrongPass1!';
    const testUsername = `passuser${timestamp}`;

    // Signup
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

    // Login
    const loginPage = new LoginPage(page);
    await loginPage.login(testEmail, testPassword);
    await expect(page).toHaveURL(/.*\/home/);

    // PATCH password
    const patchRes = await page.request.patch('/api/users/me', {
      data: {
        newPassword,
        currentPassword: testPassword,
      },
    });
    expect(patchRes.status()).toBe(200);
    const patchBody = await patchRes.json();
    expect(patchBody.data.passwordUpdated).toBe(true);

    // Logout
    await page.request.post('/api/auth/logout');
    await page.goto('/login', { timeout: 10000 });
    await expect(page).toHaveURL(/.*\/login/);

    // Old password should fail
    await loginPage.login(testEmail, testPassword);
    const oldError = await loginPage.getErrorMessage();
    expect(oldError).toBeTruthy();

    // Login with new password
    await page.goto('/login', { timeout: 10000 });
    await loginPage.login(testEmail, newPassword);
    await expect(page).toHaveURL(/.*\/home/, { timeout: 15000 });

    // Restore original password
    const restoreRes = await page.request.patch('/api/users/me', {
      data: {
        newPassword: testPassword,
        currentPassword: newPassword,
      },
    });
    expect(restoreRes.status()).toBe(200);
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
