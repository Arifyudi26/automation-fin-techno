import { expect } from '@playwright/test';
import { getOTPFromEmail, clearOldOTPEmails } from './email-otp';

const LOGIN_URL = '/auth/login';

/**
 * Login sampai masuk dashboard.
 */
export async function loginToDashboard(page: import('@playwright/test').Page) {
  const VALID_EMAIL = process.env.TEST_EMAIL || '';
  const VALID_PASSWORD = process.env.TEST_PASSWORD || '';

  // Guard: pastikan env vars tidak kosong
  if (!VALID_EMAIL || !VALID_PASSWORD) {
    throw new Error('TEST_EMAIL atau TEST_PASSWORD kosong di .env! Pastikan dotenv ter-load.');
  }

  // Bersihkan email OTP lama
  await clearOldOTPEmails();

  // Buka halaman login
  await page.goto(LOGIN_URL);
  await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();

  // Isi email — klik dulu lalu fill untuk pastikan focus
  const emailInput = page.getByRole('textbox', { name: 'info@gmail.com' });
  await emailInput.click();
  await emailInput.fill(VALID_EMAIL);

  // Isi password — klik dulu lalu fill untuk pastikan focus
  const passwordInput = page.getByRole('textbox', { name: 'Enter your password' });
  await passwordInput.click();
  await passwordInput.fill(VALID_PASSWORD);

  // Klik Sign in (tunggu enabled dulu — ini konfirmasi bahwa fill berhasil)
  const signInButton = page.getByRole('button', { name: 'Sign in', exact: true });
  await expect(signInButton).toBeEnabled({ timeout: 5000 });
  await signInButton.click();

  // Tunggu halaman OTP muncul
  await expect(page.getByRole('heading', { name: 'Verifikasi OTP' })).toBeVisible({ timeout: 15000 });

  // Ambil OTP dari email
  console.log('Menunggu email OTP masuk...');
  const otpCode = await getOTPFromEmail();
  console.log(`OTP berhasil diambil: ${otpCode}`);

  // Input OTP ke 6 textbox
  const otpInputs = page.locator('input[type]');
  const inputCount = await otpInputs.count();
  for (let i = 0; i < 6 && i < inputCount; i++) {
    await otpInputs.nth(i).fill(otpCode[i]);
  }

  // Klik Verifikasi OTP
  const verifyButton = page.getByRole('button', { name: 'Verifikasi OTP' });
  await expect(verifyButton).toBeEnabled({ timeout: 5000 });
  await verifyButton.click();

  // Tunggu navigasi ke dashboard
  await page.waitForURL((url) => !url.pathname.includes('/auth/login'), { timeout: 15000 });

  // Tunggu dashboard fully loaded
  await expect(page.getByRole('heading', { name: 'Tren Keuangan' })).toBeVisible({ timeout: 15000 });
}
