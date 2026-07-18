import { test, expect } from '@playwright/test'

test.describe('Authentication pages', () => {
  test('login page loads', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible()
  })

  test('register page loads', async ({ page }) => {
    await page.goto('/register')
    await expect(page.getByRole('heading', { name: 'Register' })).toBeVisible()
  })

  test('wrong credentials shows error', async ({ page }) => {
    await page.goto('/login')
    await page.getByPlaceholder('Email').fill('nonexistent@test.com')
    await page.getByPlaceholder('Password').fill('wrongpass')
    await page.getByRole('button', { name: 'Login' }).click()
    await expect(page.locator('.text-red-500')).toBeVisible()
  })

  test('navigate login to register', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('link', { name: 'Register' }).click()
    await expect(page).toHaveURL(/\/register/)
    await expect(page.getByRole('heading', { name: 'Register' })).toBeVisible()
  })
})
