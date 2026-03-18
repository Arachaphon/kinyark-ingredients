import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('login page loads', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByPlaceholder('อีเมล')).toBeVisible()
    await expect(page.getByPlaceholder('รหัสผ่าน')).toBeVisible()
  })

  test('register page loads', async ({ page }) => {
    await page.goto('/register')
    await expect(page.getByPlaceholder('ชื่อผู้ใช้')).toBeVisible()
  })

  test('login with wrong credentials shows error', async ({ page }) => {
    await page.goto('/login')
    await page.getByPlaceholder('อีเมล').fill('wrong@email.com')
    await page.getByPlaceholder('รหัสผ่าน').fill('wrongpassword')
    await page.getByRole('button', { name: 'เข้าสู่ระบบ' }).click()
    await expect(page.locator('.text-red-500')).toBeVisible()
  })

  test('navigate from login to register', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('link', { name: 'สมัครสมาชิก' }).click()
    await expect(page).toHaveURL('/register')
  })
})