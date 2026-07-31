import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts',
  reporter: 'html',
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: process.env.CI ? 'npx next build && npm run start' : 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
})
