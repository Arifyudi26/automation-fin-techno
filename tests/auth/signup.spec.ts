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
const SIGNUP_URL = '/signup';
const SCREENSHOT_DIR = 'screenshots/signup';

// Data untuk test signup
const SIGNUP_NAME = 'Test User Automation';
const SIGNUP_EMAIL = VALID_EMAIL; // gunakan email yang sama untuk OTP
const SIGNUP_PASSWORD = 'Password123';

test.describe('Full Flow - Sign Up sampai Verifikasi OTP', () => {
  test('Sign Up → OTP → Berhasil registrasi', async ({ page }) => {
    test.setTimeout(120000);
    ensureDir(SCREENSHOT_DIR);

    // Step 0: Bersihkan email OTP lama
    await clearOldOTPEmails();

    // Step 1: Buka halaman Sign Up
    await page.goto(SIGNUP_URL);
    await expect(page.getByRole('heading', { name: 'Sign Up' })).toBeVisible();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/pos-01-signup-page.png`, fullPage: true });

    // Step 2: Isi nama
    const nameInput = page.getByPlaceholder('Masukkan nama lengkap');
    await nameInput.fill(SIGNUP_NAME);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/pos-02-input-name.png`, fullPage: true });

    // Step 3: Isi email
    const emailInput = page.getByPlaceholder('Enter your email');
    await emailInput.fill(SIGNUP_EMAIL);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/pos-03-input-email.png`, fullPage: true });

    // Step 4: Isi password
    const passwordInput = page.getByPlaceholder('Min. 8 karakter');
    await passwordInput.fill(SIGNUP_PASSWORD);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/pos-04-input-password.png`, fullPage: true });

    // Step 5: Centang checkbox Terms & Conditions
    const checkbox = page.locator('input[type="checkbox"]');
    await checkbox.check();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/pos-05-check-terms.png`, fullPage: true });

    // Step 6: Klik tombol Sign Up
    const signUpButton = page.getByRole('button', { name: 'Sign Up', exact: true });
    await expect(signUpButton).toBeEnabled();
    await signUpButton.click();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/pos-06-click-signup.png`, fullPage: true });

    // Step 7: Tunggu halaman OTP muncul
    await expect(page.getByRole('heading', { name: 'Verifikasi OTP' })).toBeVisible({ timeout: 15000 });
    await page.screenshot({ path: `${SCREENSHOT_DIR}/pos-07-otp-page.png`, fullPage: true });

    // Step 8: Ambil OTP dari email (subject: 'Kode OTP' untuk register)
    console.log('Menunggu email OTP masuk...');
    const otpCode = await getOTPFromEmail(15, 3000, 'Kode OTP');
    console.log(`OTP berhasil diambil: ${otpCode}`);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/pos-08-before-otp-input.png`, fullPage: true });

    // Step 9: Input OTP ke 6 textbox
    const otpInputs = page.locator('input[type="text"][inputmode="numeric"]');
    const inputCount = await otpInputs.count();

    for (let i = 0; i < 6 && i < inputCount; i++) {
      await otpInputs.nth(i).fill(otpCode[i]);
    }
    await page.screenshot({ path: `${SCREENSHOT_DIR}/pos-09-otp-filled.png`, fullPage: true });

    // Step 10: Klik tombol Verifikasi OTP
    const verifyButton = page.getByRole('button', { name: 'Verifikasi OTP' });
    await expect(verifyButton).toBeEnabled({ timeout: 5000 });
    await verifyButton.click();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/pos-10-click-verify.png`, fullPage: true });

    // Step 11: Tunggu navigasi setelah berhasil registrasi (redirect ke homepage/dashboard)
    await page.waitForURL((url) => !url.pathname.includes('/signup'), { timeout: 15000 });
    await page.screenshot({ path: `${SCREENSHOT_DIR}/pos-11-signup-success.png`, fullPage: true });

    // Verifikasi tidak lagi di halaman signup
    const currentURL = page.url();
    console.log(`Current URL after signup: ${currentURL}`);
    expect(currentURL).not.toContain('/signup');
  });
});

test.describe('Negative Test - Sign Up Gagal', () => {
  test('01 - Semua field kosong, tombol Sign Up disabled', async ({ page }) => {
    ensureDir(SCREENSHOT_DIR);

    await page.goto(SIGNUP_URL);
    await expect(page.getByRole('heading', { name: 'Sign Up' })).toBeVisible();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/neg-01-empty-all-before.png`, fullPage: true });

    // Tombol Sign Up harus disabled saat semua field kosong
    const signUpButton = page.getByRole('button', { name: 'Sign Up', exact: true });
    await expect(signUpButton).toBeDisabled();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/neg-01-empty-all.png`, fullPage: true });
  });

  test('02 - Nama kosong, tombol Sign Up disabled', async ({ page }) => {
    ensureDir(SCREENSHOT_DIR);

    await page.goto(SIGNUP_URL);
    await expect(page.getByRole('heading', { name: 'Sign Up' })).toBeVisible();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/neg-02-empty-name-before.png`, fullPage: true });

    // Isi email dan password, biarkan nama kosong
    await page.getByPlaceholder('Enter your email').fill(SIGNUP_EMAIL);
    await page.getByPlaceholder('Min. 8 karakter').fill(SIGNUP_PASSWORD);
    await page.locator('input[type="checkbox"]').check();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/neg-02-empty-name-input.png`, fullPage: true });

    // Tombol Sign Up harus disabled
    const signUpButton = page.getByRole('button', { name: 'Sign Up', exact: true });
    await expect(signUpButton).toBeDisabled();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/neg-02-empty-name.png`, fullPage: true });
  });

  test('03 - Email kosong, tombol Sign Up disabled', async ({ page }) => {
    ensureDir(SCREENSHOT_DIR);

    await page.goto(SIGNUP_URL);
    await expect(page.getByRole('heading', { name: 'Sign Up' })).toBeVisible();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/neg-03-empty-email-before.png`, fullPage: true });

    // Isi nama dan password, biarkan email kosong
    await page.getByPlaceholder('Masukkan nama lengkap').fill(SIGNUP_NAME);
    await page.getByPlaceholder('Min. 8 karakter').fill(SIGNUP_PASSWORD);
    await page.locator('input[type="checkbox"]').check();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/neg-03-empty-email-input.png`, fullPage: true });

    // Tombol Sign Up harus disabled
    const signUpButton = page.getByRole('button', { name: 'Sign Up', exact: true });
    await expect(signUpButton).toBeDisabled();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/neg-03-empty-email.png`, fullPage: true });
  });

  test('04 - Password kosong, tombol Sign Up disabled', async ({ page }) => {
    ensureDir(SCREENSHOT_DIR);

    await page.goto(SIGNUP_URL);
    await expect(page.getByRole('heading', { name: 'Sign Up' })).toBeVisible();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/neg-04-empty-password-before.png`, fullPage: true });

    // Isi nama dan email, biarkan password kosong
    await page.getByPlaceholder('Masukkan nama lengkap').fill(SIGNUP_NAME);
    await page.getByPlaceholder('Enter your email').fill(SIGNUP_EMAIL);
    await page.locator('input[type="checkbox"]').check();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/neg-04-empty-password-input.png`, fullPage: true });

    // Tombol Sign Up harus disabled
    const signUpButton = page.getByRole('button', { name: 'Sign Up', exact: true });
    await expect(signUpButton).toBeDisabled();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/neg-04-empty-password.png`, fullPage: true });
  });

  test('05 - Checkbox Terms tidak dicentang, tombol Sign Up disabled', async ({ page }) => {
    ensureDir(SCREENSHOT_DIR);

    await page.goto(SIGNUP_URL);
    await expect(page.getByRole('heading', { name: 'Sign Up' })).toBeVisible();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/neg-05-unchecked-terms-before.png`, fullPage: true });

    // Isi semua field tapi JANGAN centang checkbox
    await page.getByPlaceholder('Masukkan nama lengkap').fill(SIGNUP_NAME);
    await page.getByPlaceholder('Enter your email').fill(SIGNUP_EMAIL);
    await page.getByPlaceholder('Min. 8 karakter').fill(SIGNUP_PASSWORD);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/neg-05-unchecked-terms-input.png`, fullPage: true });

    // Tombol Sign Up harus disabled tanpa checkbox
    const signUpButton = page.getByRole('button', { name: 'Sign Up', exact: true });
    await expect(signUpButton).toBeDisabled();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/neg-05-unchecked-terms.png`, fullPage: true });
  });

  test('06 - Password kurang dari 8 karakter', async ({ page }) => {
    ensureDir(SCREENSHOT_DIR);

    await page.goto(SIGNUP_URL);
    await expect(page.getByRole('heading', { name: 'Sign Up' })).toBeVisible();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/neg-06-short-password-before.png`, fullPage: true });

    // Isi semua field dengan password pendek
    await page.getByPlaceholder('Masukkan nama lengkap').fill(SIGNUP_NAME);
    await page.getByPlaceholder('Enter your email').fill(SIGNUP_EMAIL);
    await page.getByPlaceholder('Min. 8 karakter').fill('short');
    await page.locator('input[type="checkbox"]').check();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/neg-06-short-password-input.png`, fullPage: true });

    // Klik Sign Up
    const signUpButton = page.getByRole('button', { name: 'Sign Up', exact: true });
    await signUpButton.click();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/neg-06-short-password-submit.png`, fullPage: true });

    // Harus tetap di halaman signup, muncul warning toast
    await page.waitForTimeout(2000);
    await expect(page.getByRole('heading', { name: 'Sign Up' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Verifikasi OTP' })).not.toBeVisible();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/neg-06-short-password-error.png`, fullPage: true });
  });

  test('07 - Email sudah terdaftar', async ({ page }) => {
    ensureDir(SCREENSHOT_DIR);

    await page.goto(SIGNUP_URL);
    await expect(page.getByRole('heading', { name: 'Sign Up' })).toBeVisible();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/neg-07-registered-email-before.png`, fullPage: true });

    // Isi semua field dengan email yang sudah terdaftar
    await page.getByPlaceholder('Masukkan nama lengkap').fill(SIGNUP_NAME);
    await page.getByPlaceholder('Enter your email').fill(VALID_EMAIL);
    await page.getByPlaceholder('Min. 8 karakter').fill(SIGNUP_PASSWORD);
    await page.locator('input[type="checkbox"]').check();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/neg-07-registered-email-input.png`, fullPage: true });

    // Klik Sign Up
    const signUpButton = page.getByRole('button', { name: 'Sign Up', exact: true });
    await signUpButton.click();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/neg-07-registered-email-submit.png`, fullPage: true });

    // Harus muncul error toast (email sudah terdaftar)
    await page.waitForTimeout(3000);
    await expect(page.getByRole('heading', { name: 'Sign Up' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Verifikasi OTP' })).not.toBeVisible();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/neg-07-registered-email-error.png`, fullPage: true });
  });
});

test.describe('UI Test - Toggle Show/Hide Password', () => {
  test('Klik toggle menampilkan password (type berubah dari password ke text)', async ({ page }) => {
    ensureDir(SCREENSHOT_DIR);

    await page.goto(SIGNUP_URL);
    await expect(page.getByRole('heading', { name: 'Sign Up' })).toBeVisible();

    const passwordInput = page.getByPlaceholder('Min. 8 karakter');
    await passwordInput.fill('TestPassword123');
    await page.screenshot({ path: `${SCREENSHOT_DIR}/ui-01-password-hidden.png`, fullPage: true });

    // Verifikasi password field type = password
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // Klik toggle show password
    const toggleButton = page.locator('input[placeholder="Min. 8 karakter"]')
      .locator('..').locator('..').locator('span');
    await toggleButton.click();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/ui-02-password-visible.png`, fullPage: true });

    // Verifikasi password field type = text (terlihat)
    await expect(passwordInput).toHaveAttribute('type', 'text');

    // Klik lagi untuk hide
    await toggleButton.click();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/ui-03-password-hidden-again.png`, fullPage: true });

    // Verifikasi kembali ke type = password
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });
});

test.describe('UI Test - Navigasi ke Sign In', () => {
  test('Klik link "Sign In" mengarahkan ke halaman login', async ({ page }) => {
    ensureDir(SCREENSHOT_DIR);

    await page.goto(SIGNUP_URL);
    await expect(page.getByRole('heading', { name: 'Sign Up' })).toBeVisible();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/ui-04-signup-page.png`, fullPage: true });

    // Klik link Sign In
    const signInLink = page.getByRole('link', { name: 'Sign In' });
    await expect(signInLink).toBeVisible();
    await signInLink.click();

    // Verifikasi navigasi ke halaman login
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
    expect(page.url()).toContain('/auth/login');
    await page.screenshot({ path: `${SCREENSHOT_DIR}/ui-05-navigate-to-login.png`, fullPage: true });
  });
});

test.describe('UI Test - Theme Toggle (Dark/Light Mode)', () => {
  test('Klik theme toggle mengubah tema dari light ke dark dan sebaliknya', async ({ page }) => {
    ensureDir(SCREENSHOT_DIR);

    await page.goto(SIGNUP_URL);
    await expect(page.getByRole('heading', { name: 'Sign Up' })).toBeVisible();

    const htmlElement = page.locator('html');
    await expect(htmlElement).not.toHaveClass(/dark/);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/ui-06-theme-light.png`, fullPage: true });

    // Klik theme toggle
    const themeToggle = page.locator('button').filter({ hasText: /^$/ });
    await themeToggle.click();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/ui-07-theme-dark.png`, fullPage: true });

    await expect(htmlElement).toHaveClass(/dark/);

    // Klik lagi untuk kembali ke light
    await themeToggle.click();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/ui-08-theme-light-again.png`, fullPage: true });

    await expect(htmlElement).not.toHaveClass(/dark/);
  });
});
