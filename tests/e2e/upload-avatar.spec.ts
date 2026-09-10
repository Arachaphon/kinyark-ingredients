import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';

test.describe('Upload Avatar E2E', () => {
  test('uploads a valid JPEG avatar via API and confirms it persists', async ({ page }) => {
    const timestamp = Date.now();
    const testEmail = `e2e_avatar_jpeg_${timestamp}@test.com`;
    const testPassword = 'StrongPassword1!';
    const testUsername = `avataruser${timestamp}`;

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

    const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);

    const uploadRes = await page.request.post('/api/users/me/avatar', {
      multipart: {
        avatar: { name: 'avatar.jpg', mimeType: 'image/jpeg', buffer: jpegBuffer },
      },
    });
    expect(uploadRes.status()).toBe(200);
    const uploadBody = await uploadRes.json();
    expect(uploadBody.data.user.avatarUrl).toBeTruthy();
    expect(uploadBody.data.user.avatarUrl).toContain('avatars');

    const getRes = await page.request.get('/api/users/me');
    expect(getRes.status()).toBe(200);
    const getBody = await getRes.json();
    expect(getBody.user.avatarUrl).toBe(uploadBody.data.user.avatarUrl);
  });

  test('returns 401 for unauthenticated upload', async ({ request }) => {
    const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
    const res = await request.post('/api/users/me/avatar', {
      multipart: {
        avatar: { name: 'test.jpg', mimeType: 'image/jpeg', buffer: jpegBuffer },
      },
    });
    expect(res.status()).toBe(401);
  });

  test('returns 400 for missing file', async ({ page }) => {
    const timestamp = Date.now();
    const testEmail = `e2e_no_file_${timestamp}@test.com`;
    const testPassword = 'StrongPassword1!';
    const testUsername = `nofile${timestamp}`;

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
    await     expect(page).toHaveURL(/.*\/home/);

    const res = await page.request.post('/api/users/me/avatar', {
      multipart: {},
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('No file');
  });

  test('replaces existing avatar with new image', async ({ page }) => {
    const timestamp = Date.now();
    const testEmail = `e2e_replace_${timestamp}@test.com`;
    const testPassword = 'StrongPassword1!';
    const testUsername = `replace${timestamp}`;

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

    const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);

    const res1 = await page.request.post('/api/users/me/avatar', {
      multipart: {
        avatar: { name: 'first.jpg', mimeType: 'image/jpeg', buffer: jpegBuffer },
      },
    });
    expect(res1.status()).toBe(200);
    const firstUrl = (await res1.json()).data.user.avatarUrl;

    const res2 = await page.request.post('/api/users/me/avatar', {
      multipart: {
        avatar: { name: 'second.jpg', mimeType: 'image/jpeg', buffer: jpegBuffer },
      },
    });
    expect(res2.status()).toBe(200);
    const secondUrl = (await res2.json()).data.user.avatarUrl;

    expect(secondUrl).not.toBe(firstUrl);

    const getRes = await page.request.get('/api/users/me');
    const getBody = await getRes.json();
    expect(getBody.user.avatarUrl).toBe(secondUrl);
  });
});
