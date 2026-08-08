import { defineConfig } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  globalSetup: './global-setup.ts',
  testDir: './tests',
  timeout: 30000,
  expect: {
    timeout: 10000,
  },
  fullyParallel: false,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'https://fin-techno.vercel.app',
    screenshot: 'off',
    trace: 'off',
    headless: false,
    launchOptions: {
      slowMo: 500,
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
});
