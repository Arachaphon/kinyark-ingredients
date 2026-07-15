import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  baseURL: 'http://localhost:3000',
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
})
