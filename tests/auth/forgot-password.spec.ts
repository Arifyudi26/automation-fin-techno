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

const VALID_EMAIL = process.env.TEST_EMAIL || '';
const LOGIN_URL = '/auth/login';
const CHANGE_PASSWORD_URL = '/auth/change-password';
const SCREENSHOT_DIR = 'screenshots/forgot-password';

test.describe('Lupa Password - Navigasi dari Login', () => {
  test('Klik link "Lupa password?" mengarahkan ke halaman Ganti Password', async ({ page }) => {
    ensureDir(SCREENSHOT_DIR);

    // Buka halaman login
    await page.goto(LOGIN_URL);
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/01-login-page.png`, fullPage: true });

    // Klik link "Lupa password?"
    const lupaPasswordLink = page.getByRole('link', { name: 'Lupa password?' });
    await expect(lupaPasswordLink).toBeVisible();
    await lupaPasswordLink.click();

    // Verifikasi navigasi ke halaman Ganti Password
    await expect(page.getByRole('heading', { name: 'Ganti Password' })).toBeVisible();
    expect(page.url()).toContain('/auth/change-password');
    await page.screenshot({ path: `${SCREENSHOT_DIR}/02-change-password-page.png`, fullPage: true });

    // Verifikasi elemen halaman Ganti Password
    await expect(page.getByPlaceholder('Email terdaftar')).toBeVisible();
    await expect(page.getByPlaceholder('Min. 8 karakter')).toBeVisible();
    await expect(page.getByPlaceholder('Ulangi password baru')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Kirim OTP' })).toBeVisible();
  });
});

test.describe('Lupa Password - Positive Test', () => {
  test('Ganti password dengan data valid → halaman OTP muncul → verifikasi berhasil', async ({ page }) => {
    test.setTimeout(120000);
    ensureDir(SCREENSHOT_DIR);

    // Bersihkan email OTP lama
    await clearOldOTPEmails();

    // Buka halaman ganti password
    await page.goto(CHANGE_PASSWORD_URL);
    await expect(page.getByRole('heading', { name: 'Ganti Password' })).toBeVisible();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/pos-01-change-password-page.png`, fullPage: true });

    // Isi email
    await page.getByPlaceholder('Email terdaftar').fill(VALID_EMAIL);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/pos-02-input-email.png`, fullPage: true });

    // Isi password baru (gunakan password yang sama agar tidak benar-benar mengubah)
    await page.getByPlaceholder('Min. 8 karakter').fill('password');
    await page.screenshot({ path: `${SCREENSHOT_DIR}/pos-03-input-password.png`, fullPage: true });

    // Isi konfirmasi password
    await page.getByPlaceholder('Ulangi password baru').fill('password');
    await page.screenshot({ path: `${SCREENSHOT_DIR}/pos-04-input-confirm-password.png`, fullPage: true });

    // Klik Kirim OTP
    await page.getByRole('button', { name: 'Kirim OTP' }).click();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/pos-05-click-kirim-otp.png`, fullPage: true });

    // Verifikasi halaman OTP muncul
    await expect(page.getByRole('heading', { name: 'Verifikasi OTP' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Masukkan kode OTP yang dikirim ke email kamu')).toBeVisible();
    await expect(page.getByText('Kode OTP telah dikirim ke')).toBeVisible();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/pos-06-otp-page.png`, fullPage: true });

    // Ambil OTP dari email (subject berbeda untuk ganti password)
    console.log('Menunggu email OTP masuk...');
    const otpCode = await getOTPFromEmail(15, 3000, 'Kode OTP Ganti Password');
    console.log(`OTP berhasil diambil: ${otpCode}`);

    // Input OTP ke 6 textbox
    const otpInputs = page.locator('input[type]');
    for (let i = 0; i < 6; i++) {
      await otpInputs.nth(i).fill(otpCode[i]);
    }
    await page.screenshot({ path: `${SCREENSHOT_DIR}/pos-07-otp-filled.png`, fullPage: true });

    // Klik Verifikasi OTP
    const verifyButton = page.getByRole('button', { name: 'Verifikasi OTP' });
    await expect(verifyButton).toBeEnabled({ timeout: 5000 });
    await verifyButton.click();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/pos-08-click-verify.png`, fullPage: true });

    // Tunggu hasil verifikasi - redirect ke halaman login
    await page.waitForURL('**/auth/login', { timeout: 15000 });
    await page.screenshot({ path: `${SCREENSHOT_DIR}/pos-09-result.png`, fullPage: true });

    // Verifikasi: berhasil ganti password → redirect ke halaman login
    expect(page.url()).toContain('/auth/login');
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/pos-10-success.png`, fullPage: true });
    console.log('Ganti password berhasil, redirect ke halaman login.');
  });
});

test.describe('Lupa Password - Negative Test', () => {
  test('01 - Form kosong → tidak bisa submit (browser validation)', async ({ page }) => {
    ensureDir(SCREENSHOT_DIR);

    await page.goto(CHANGE_PASSWORD_URL);
    await expect(page.getByRole('heading', { name: 'Ganti Password' })).toBeVisible();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/neg-01-empty-form-before.png`, fullPage: true });

    // Klik Kirim OTP tanpa isi apapun
    await page.getByRole('button', { name: 'Kirim OTP' }).click();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/neg-01-empty-form-after.png`, fullPage: true });

    // Verifikasi: tetap di halaman yang sama, heading masih terlihat
    await expect(page.getByRole('heading', { name: 'Ganti Password' })).toBeVisible();
    // Tidak muncul halaman OTP
    await expect(page.getByRole('heading', { name: 'Verifikasi OTP' })).not.toBeVisible();
  });

  test('02 - Password tidak cocok → pesan error muncul', async ({ page }) => {
    ensureDir(SCREENSHOT_DIR);

    await page.goto(CHANGE_PASSWORD_URL);
    await expect(page.getByRole('heading', { name: 'Ganti Password' })).toBeVisible();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/neg-02-mismatch-before.png`, fullPage: true });

    // Isi form dengan password yang tidak cocok
    await page.getByPlaceholder('Email terdaftar').fill(VALID_EMAIL);
    await page.getByPlaceholder('Min. 8 karakter').fill('password123');
    await page.getByPlaceholder('Ulangi password baru').fill('differentpassword');
    await page.screenshot({ path: `${SCREENSHOT_DIR}/neg-02-mismatch-input.png`, fullPage: true });

    // Klik Kirim OTP
    await page.getByRole('button', { name: 'Kirim OTP' }).click();

    // Verifikasi: pesan error "Password tidak cocok" muncul
    await expect(page.getByRole('heading', { name: 'Password tidak cocok' })).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Konfirmasi password tidak sesuai')).toBeVisible();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/neg-02-mismatch-error.png`, fullPage: true });

    // Tetap di halaman yang sama
    await expect(page.getByRole('heading', { name: 'Ganti Password' })).toBeVisible();
  });

  test('03 - Password terlalu pendek (< 8 karakter) → pesan error muncul', async ({ page }) => {
    ensureDir(SCREENSHOT_DIR);

    await page.goto(CHANGE_PASSWORD_URL);
    await expect(page.getByRole('heading', { name: 'Ganti Password' })).toBeVisible();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/neg-03-short-password-before.png`, fullPage: true });

    // Isi form dengan password pendek
    await page.getByPlaceholder('Email terdaftar').fill(VALID_EMAIL);
    await page.getByPlaceholder('Min. 8 karakter').fill('short');
    await page.getByPlaceholder('Ulangi password baru').fill('short');
    await page.screenshot({ path: `${SCREENSHOT_DIR}/neg-03-short-password-input.png`, fullPage: true });

    // Klik Kirim OTP
    await page.getByRole('button', { name: 'Kirim OTP' }).click();

    // Verifikasi: pesan error "Password terlalu pendek" muncul
    await expect(page.getByRole('heading', { name: 'Password terlalu pendek' })).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Password minimal 8 karakter')).toBeVisible();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/neg-03-short-password-error.png`, fullPage: true });

    // Tetap di halaman yang sama
    await expect(page.getByRole('heading', { name: 'Ganti Password' })).toBeVisible();
  });

  test('04 - Email tidak terdaftar → pesan error muncul', async ({ page }) => {
    ensureDir(SCREENSHOT_DIR);

    await page.goto(CHANGE_PASSWORD_URL);
    await expect(page.getByRole('heading', { name: 'Ganti Password' })).toBeVisible();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/neg-04-unregistered-before.png`, fullPage: true });

    // Isi form dengan email yang tidak terdaftar
    await page.getByPlaceholder('Email terdaftar').fill('tidakterdaftar.test@gmail.com');
    await page.getByPlaceholder('Min. 8 karakter').fill('password123');
    await page.getByPlaceholder('Ulangi password baru').fill('password123');
    await page.screenshot({ path: `${SCREENSHOT_DIR}/neg-04-unregistered-input.png`, fullPage: true });

    // Klik Kirim OTP
    await page.getByRole('button', { name: 'Kirim OTP' }).click();

    // Verifikasi: pesan error "Gagal!" dan "Email tidak ditemukan" muncul
    await expect(page.getByRole('heading', { name: 'Gagal!' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Email tidak ditemukan')).toBeVisible();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/neg-04-unregistered-error.png`, fullPage: true });

    // Tombol "Coba Lagi" tersedia
    await expect(page.getByRole('button', { name: 'Coba Lagi' })).toBeVisible();
  });

  test('05 - Email format tidak valid → tidak bisa submit (browser validation)', async ({ page }) => {
    ensureDir(SCREENSHOT_DIR);

    await page.goto(CHANGE_PASSWORD_URL);
    await expect(page.getByRole('heading', { name: 'Ganti Password' })).toBeVisible();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/neg-05-invalid-email-before.png`, fullPage: true });

    // Isi form dengan email format tidak valid
    await page.getByPlaceholder('Email terdaftar').fill('bukan-email');
    await page.getByPlaceholder('Min. 8 karakter').fill('password123');
    await page.getByPlaceholder('Ulangi password baru').fill('password123');
    await page.screenshot({ path: `${SCREENSHOT_DIR}/neg-05-invalid-email-input.png`, fullPage: true });

    // Klik Kirim OTP
    await page.getByRole('button', { name: 'Kirim OTP' }).click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/neg-05-invalid-email-after.png`, fullPage: true });

    // Verifikasi: tetap di halaman yang sama (browser validation mencegah submit)
    await expect(page.getByRole('heading', { name: 'Ganti Password' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Verifikasi OTP' })).not.toBeVisible();
  });
});
