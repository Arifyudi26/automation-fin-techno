import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { getOTPFromEmail, clearOldOTPEmails } from '../helpers/email-otp';

// Helper to ensure screenshot directory exists
function ensureDir(dirPath: string) {
  const fullPath = path.resolve(dirPath);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
}

// Credentials dari .env
const VALID_EMAIL = process.env.TEST_EMAIL || '';
const VALID_PASSWORD = process.env.TEST_PASSWORD || '';
const LOGIN_URL = '/auth/login';
const SCREENSHOT_DIR = 'screenshots/login';

test.describe('Full Flow - Login sampai Dashboard', () => {
  test('Login → OTP → Berhasil masuk', async ({ page }) => {
    test.setTimeout(120000);
    ensureDir(SCREENSHOT_DIR);

    // Step 0: Bersihkan email OTP lama agar tidak tercampur
    await clearOldOTPEmails();

    // Step 1: Buka halaman login
    await page.goto(LOGIN_URL);
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/01-login-page.png`, fullPage: true });

    // Step 2: Isi email
    const emailInput = page.getByRole('textbox', { name: 'info@gmail.com' });
    await emailInput.fill(VALID_EMAIL);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/02-input-email.png`, fullPage: true });

    // Step 3: Isi password
    const passwordInput = page.getByRole('textbox', { name: 'Enter your password' });
    await passwordInput.fill(VALID_PASSWORD);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/03-input-password.png`, fullPage: true });

    // Step 4: Klik Sign in
    const signInButton = page.getByRole('button', { name: 'Sign in', exact: true });
    await expect(signInButton).toBeEnabled();
    await signInButton.click();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/04-click-login.png`, fullPage: true });

    // Step 5: Tunggu halaman OTP muncul
    await expect(page.getByRole('heading', { name: 'Verifikasi OTP' })).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: `${SCREENSHOT_DIR}/05-otp-page.png`, fullPage: true });

    // Step 6: Ambil OTP dari email
    console.log('Menunggu email OTP masuk...');
    const otpCode = await getOTPFromEmail();
    console.log(`OTP berhasil diambil: ${otpCode}`);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/06-before-otp-input.png`, fullPage: true });

    // Step 7: Input OTP ke 6 textbox
    const otpInputs = page.locator('input[type]');
    const inputCount = await otpInputs.count();

    for (let i = 0; i < 6 && i < inputCount; i++) {
      await otpInputs.nth(i).fill(otpCode[i]);
    }
    await page.screenshot({ path: `${SCREENSHOT_DIR}/07-otp-filled.png`, fullPage: true });

    // Step 8: Klik tombol Verifikasi OTP
    const verifyButton = page.getByRole('button', { name: 'Verifikasi OTP' });
    await expect(verifyButton).toBeEnabled({ timeout: 5000 });
    await verifyButton.click();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/08-click-verify.png`, fullPage: true });

    // Step 9: Tunggu navigasi ke dashboard
    await page.waitForURL((url) => !url.pathname.includes('/auth/login'), { timeout: 15000 });

    // Tunggu dashboard fully loaded - elemen kunci muncul
    await expect(page.getByRole('heading', { name: 'Tren Keuangan' })).toBeVisible({ timeout: 15000 });
    await page.screenshot({ path: `${SCREENSHOT_DIR}/09-after-verify.png`, fullPage: true });

    // Step 10: Verifikasi sudah di halaman dashboard
    const currentURL = page.url();
    console.log(`Current URL after OTP: ${currentURL}`);
    expect(currentURL).not.toContain('/auth/login');

    // Tunggu elemen dashboard lainnya muncul untuk memastikan fully loaded
    await expect(page.getByRole('heading', { name: 'Rekening & Dompet' })).toBeVisible();
    await expect(page.getByPlaceholder('Cari menu...')).toBeVisible();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/10-login-success-dashboard.png`, fullPage: true });

    const pageTitle = await page.title();
    console.log(`Page title: ${pageTitle}`);
  });
});

test.describe('Negative Test - Login Gagal', () => {
  test('01 - Email kosong + password valid', async ({ page }) => {
    ensureDir(SCREENSHOT_DIR);

    await page.goto(LOGIN_URL);
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/neg-01-empty-email-before.png`, fullPage: true });

    const passwordInput = page.getByRole('textbox', { name: 'Enter your password' });
    await passwordInput.fill(VALID_PASSWORD);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/neg-01-empty-email-input.png`, fullPage: true });

    const signInButton = page.getByRole('button', { name: 'Sign in', exact: true });
    await expect(signInButton).toBeDisabled();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/neg-01-empty-email.png`, fullPage: true });
  });

  test('02 - Email tidak valid + password valid', async ({ page }) => {
    ensureDir(SCREENSHOT_DIR);

    await page.goto(LOGIN_URL);
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/neg-02-invalid-email-before.png`, fullPage: true });

    const emailInput = page.getByRole('textbox', { name: 'info@gmail.com' });
    await emailInput.fill('invalid-email-format');
    await page.screenshot({ path: `${SCREENSHOT_DIR}/neg-02-invalid-email-input-email.png`, fullPage: true });

    const passwordInput = page.getByRole('textbox', { name: 'Enter your password' });
    await passwordInput.fill(VALID_PASSWORD);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/neg-02-invalid-email-input-password.png`, fullPage: true });

    const signInButton = page.getByRole('button', { name: 'Sign in', exact: true });
    await signInButton.click();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/neg-02-invalid-email-submit.png`, fullPage: true });

    await page.waitForTimeout(3000);
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Verifikasi OTP' })).not.toBeVisible();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/neg-02-invalid-email.png`, fullPage: true });
  });

  test('03 - Email valid + password kosong', async ({ page }) => {
    ensureDir(SCREENSHOT_DIR);

    await page.goto(LOGIN_URL);
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/neg-03-empty-password-before.png`, fullPage: true });

    const emailInput = page.getByRole('textbox', { name: 'info@gmail.com' });
    await emailInput.fill(VALID_EMAIL);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/neg-03-empty-password-input.png`, fullPage: true });

    const signInButton = page.getByRole('button', { name: 'Sign in', exact: true });
    await expect(signInButton).toBeDisabled();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/neg-03-empty-password.png`, fullPage: true });
  });

  test('04 - Email dan password kosong', async ({ page }) => {
    ensureDir(SCREENSHOT_DIR);

    await page.goto(LOGIN_URL);
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/neg-04-empty-both-before.png`, fullPage: true });

    const signInButton = page.getByRole('button', { name: 'Sign in', exact: true });
    await expect(signInButton).toBeDisabled();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/neg-04-empty-both.png`, fullPage: true });
  });

  test('05 - Password salah', async ({ page }) => {
    ensureDir(SCREENSHOT_DIR);

    await page.goto(LOGIN_URL);
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/neg-05-wrong-password-before.png`, fullPage: true });

    const emailInput = page.getByRole('textbox', { name: 'info@gmail.com' });
    await emailInput.fill(VALID_EMAIL);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/neg-05-wrong-password-input-email.png`, fullPage: true });

    const passwordInput = page.getByRole('textbox', { name: 'Enter your password' });
    await passwordInput.fill('wrongpassword123');
    await page.screenshot({ path: `${SCREENSHOT_DIR}/neg-05-wrong-password-input-password.png`, fullPage: true });

    const signInButton = page.getByRole('button', { name: 'Sign in', exact: true });
    await signInButton.click();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/neg-05-wrong-password-submit.png`, fullPage: true });

    await page.waitForTimeout(3000);
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Verifikasi OTP' })).not.toBeVisible();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/neg-05-wrong-password.png`, fullPage: true });
  });

  test('06 - Email yang belum terdaftar', async ({ page }) => {
    ensureDir(SCREENSHOT_DIR);

    await page.goto(LOGIN_URL);
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/neg-06-unregistered-before.png`, fullPage: true });

    const emailInput = page.getByRole('textbox', { name: 'info@gmail.com' });
    await emailInput.fill('unregistered.user.test@gmail.com');
    await page.screenshot({ path: `${SCREENSHOT_DIR}/neg-06-unregistered-input-email.png`, fullPage: true });

    const passwordInput = page.getByRole('textbox', { name: 'Enter your password' });
    await passwordInput.fill(VALID_PASSWORD);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/neg-06-unregistered-input-password.png`, fullPage: true });

    const signInButton = page.getByRole('button', { name: 'Sign in', exact: true });
    await signInButton.click();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/neg-06-unregistered-submit.png`, fullPage: true });

    await page.waitForTimeout(3000);
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Verifikasi OTP' })).not.toBeVisible();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/neg-06-unregistered.png`, fullPage: true });
  });
});

test.describe('UI Test - Toggle Show/Hide Password', () => {
  test('Klik toggle menampilkan password (type berubah dari password ke text)', async ({ page }) => {
    ensureDir(SCREENSHOT_DIR);

    await page.goto(LOGIN_URL);
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();

    const passwordInput = page.getByPlaceholder('Enter your password');
    await passwordInput.fill('TestPassword123');
    await page.screenshot({ path: `${SCREENSHOT_DIR}/ui-01-password-hidden.png`, fullPage: true });

    await expect(passwordInput).toHaveAttribute('type', 'password');

    const toggleButton = page.locator('input[placeholder="Enter your password"]')
      .locator('..').locator('..').locator('span');
    await toggleButton.click();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/ui-02-password-visible.png`, fullPage: true });

    await expect(passwordInput).toHaveAttribute('type', 'text');

    await toggleButton.click();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/ui-03-password-hidden-again.png`, fullPage: true });

    await expect(passwordInput).toHaveAttribute('type', 'password');
  });
});

test.describe('UI Test - Theme Toggle (Dark/Light Mode)', () => {
  test('Klik theme toggle mengubah tema dari light ke dark dan sebaliknya', async ({ page }) => {
    ensureDir(SCREENSHOT_DIR);

    await page.goto(LOGIN_URL);
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();

    const htmlElement = page.locator('html');
    await expect(htmlElement).not.toHaveClass(/dark/);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/ui-04-theme-light.png`, fullPage: true });

    const themeToggle = page.locator('button').filter({ hasText: /^$/ });
    await themeToggle.click();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/ui-05-theme-dark.png`, fullPage: true });

    await expect(htmlElement).toHaveClass(/dark/);

    await themeToggle.click();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/ui-06-theme-light-again.png`, fullPage: true });

    await expect(htmlElement).not.toHaveClass(/dark/);
  });
});

test.describe('UI Test - Logo Link', () => {
  test('Logo Fin-Techno memiliki link ke halaman utama dan bisa diklik', async ({ page }) => {
    ensureDir(SCREENSHOT_DIR);

    await page.goto(LOGIN_URL);
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/ui-07-logo-before-click.png`, fullPage: true });

    // Verifikasi logo link memiliki href="/"
    const logoLink = page.locator('a[href="/"]');
    await expect(logoLink).toBeVisible();
    await expect(logoLink).toHaveAttribute('href', '/');

    // Klik logo - karena user belum login, akan redirect kembali ke halaman login
    await logoLink.click();
    await page.waitForURL(/\/(auth\/login)?$/);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/ui-08-logo-after-click.png`, fullPage: true });

    // Verifikasi: tetap di halaman login (redirect karena belum auth)
    expect(page.url()).toContain('/auth/login');
  });
});
