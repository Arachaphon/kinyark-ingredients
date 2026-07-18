import { test, expect } from '@playwright/test'

test.describe('Authentication pages', () => {
  test('login page loads', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('heading', { name: 'เข้าสู่ระบบ' })).toBeVisible()
  })

  test('register page loads', async ({ page }) => {
    await page.goto('/register')
    await expect(page.getByRole('heading', { name: 'ลงทะเบียน' })).toBeVisible()
  })

  test('wrong credentials shows error', async ({ page }) => {
    await page.goto('/login')
    await page.getByPlaceholder('ชื่อผู้ใช้/อีเมล').fill('nonexistent@test.com')
    await page.getByPlaceholder('รหัสผ่าน').fill('wrongpass')
    await page.getByRole('button', { name: 'เข้าสู่ระบบ' }).click()
    await expect(page.locator('.text-red-500')).toBeVisible()
  })

  test('navigate login to register', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('button', { name: 'สมัครสมาชิก' }).first().click()
    await expect(page).toHaveURL(/\/register/)
    await expect(page.getByRole('heading', { name: 'ลงทะเบียน' })).toBeVisible()
  })
})
