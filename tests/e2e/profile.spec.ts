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
});
