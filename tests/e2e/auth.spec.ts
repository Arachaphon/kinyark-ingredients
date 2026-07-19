import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';

test.describe('Authentication E2E', () => {
  test('Successful signup, login, and access protected route', async ({ page }) => {
    const timestamp = Date.now();
    const testEmail = `e2e_user_${timestamp}@test.com`;
    const testPassword = 'StrongPassword1!';
    const testUsername = `e2euser${timestamp}`;

    // 1. Signup Flow
    const signupPage = new SignupPage(page);
    await signupPage.goto();
    
    await signupPage.fillForm({
      username: testUsername,
      email: testEmail,
      password: testPassword,
      confirmPassword: testPassword,
      role: 'user'
    });
    
    await signupPage.submit();
    await expect(page).toHaveURL(/.*login.*/, { timeout: 10000 });
    
    // Clear cookies to log out the newly registered user (if Supabase auto-logged them in)
    await page.context().clearCookies();
    
    // 2. Login Flow
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(testEmail, testPassword);
    
    await expect(page).toHaveURL(/.*\/home/);
    
    // 3. Logout Flow
    const logoutButton = page.getByRole('button', { name: /ออกจากระบบ|Logout/i });
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
      await expect(page).toHaveURL(/.*\/login/);
    }
  });

  test('Signup with duplicate email shows error', async ({ page }) => {
    const timestamp = Date.now();
    const testEmail = `e2e_dup_${timestamp}@test.com`;
    const testPassword = 'StrongPassword1!';

    // First signup
    const signupPage = new SignupPage(page);
    await signupPage.goto();
    await signupPage.fillForm({
      username: `first_${timestamp}`,
      email: testEmail,
      password: testPassword,
      confirmPassword: testPassword,
      role: 'user'
    });
    await signupPage.submit();
    await expect(page).toHaveURL(/.*login.*/, { timeout: 10000 });

    // Clear cookies to log out
    await page.context().clearCookies();

    // Attempt second signup with the same email
    await signupPage.goto();
    await signupPage.fillForm({
      username: `second_${timestamp}`,
      email: testEmail,
      password: testPassword,
      confirmPassword: testPassword,
      role: 'user'
    });
    await signupPage.submit();
    
    const errorMsg = await signupPage.getServerErrorMessage();
    expect(errorMsg).toBeTruthy();
  });

  test('Login with wrong password shows error', async ({ page }) => {
    const timestamp = Date.now();
    const testEmail = `e2e_wrongpw_${timestamp}@test.com`;
    const testPassword = 'StrongPassword1!';

    // First signup
    const signupPage = new SignupPage(page);
    await signupPage.goto();
    await signupPage.fillForm({
      username: `user_${timestamp}`,
      email: testEmail,
      password: testPassword,
      confirmPassword: testPassword,
      role: 'user'
    });
    await signupPage.submit();
    await expect(page).toHaveURL(/.*login.*/, { timeout: 10000 });

    // Clear cookies to log out
    await page.context().clearCookies();

    // Try login with wrong password
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(testEmail, 'WrongPassword123!');
    
    const errorMsg = await loginPage.getErrorMessage();
    expect(errorMsg).toBeTruthy();
  });
});
