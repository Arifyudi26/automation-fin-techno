# Automation Fin-Techno

Automated test suite untuk aplikasi [Fin-Techno](https://fin-techno.vercel.app) menggunakan **Playwright** + **TypeScript**. Mencakup test login, forgot password, dan UI component.

## Tech Stack

| Tool | Fungsi |
|------|--------|
| [Playwright](https://playwright.dev/) | Browser automation & testing framework |
| TypeScript | Bahasa pemrograman |
| [imap-simple](https://www.npmjs.com/package/imap-simple) | Koneksi ke Gmail via IMAP untuk mengambil OTP |
| [mailparser](https://www.npmjs.com/package/mailparser) | Parsing isi email (extract body text/HTML) |
| [Inquirer](https://www.npmjs.com/package/@inquirer/prompts) | Interactive CLI untuk memilih test |

## Struktur Project

```
automation-fin-techno/
├── playwright.config.ts          # Konfigurasi Playwright
├── global-setup.ts               # Global setup (load .env)
├── cli.mjs                       # Interactive CLI runner
├── tests/
│   ├── auth/
│   │   ├── login.spec.ts         # Test login (full flow + negative + UI)
│   │   └── forgot-password.spec.ts  # Test forgot/change password
│   └── helpers/
│       └── email-otp.ts          # Helper IMAP untuk ambil OTP dari Gmail
├── screenshots/                  # Output screenshot dari test (auto-generated)
│   ├── login/
│   └── forgot-password/
├── .env                          # Environment variables (tidak di-commit)
├── .env.example                  # Template env variables
├── package.json
└── README.md
```

## Instalasi

```bash
npm install
npx playwright install chromium
```

## Konfigurasi Environment

Copy `.env.example` ke `.env` dan isi dengan credentials:

```bash
cp .env.example .env
```

```env
# Credentials untuk testing
TEST_EMAIL=your-email@gmail.com
TEST_PASSWORD=your-password

# Gmail IMAP untuk ambil OTP
IMAP_USER=your-email@gmail.com
IMAP_PASSWORD=your-app-password
IMAP_HOST=imap.gmail.com
IMAP_PORT=993
```

### Prasyarat Gmail (untuk OTP)

1. **Aktifkan 2-Step Verification** di Google Account
2. **Buat App Password** di https://myaccount.google.com/apppasswords
3. Gunakan App Password 16 karakter tersebut sebagai `IMAP_PASSWORD` (bukan password Gmail utama)

## Menjalankan Test

### Interactive CLI (Rekomendasi)

```bash
npm start
```

CLI akan menampilkan menu interaktif untuk memilih test mana yang ingin dijalankan (per folder atau per file).

### Command Langsung

```bash
# Jalankan semua test
npx playwright test

# Jalankan test login saja
npx playwright test tests/auth/login.spec.ts
```

## Cara Kerja OTP

Test mengambil kode OTP secara otomatis dari inbox Gmail menggunakan IMAP:

1. Setelah action (login/ganti password), aplikasi mengirim email OTP
2. Test konek ke Gmail via IMAP menggunakan App Password
3. Mencari email terbaru dengan subject yang sesuai (UNSEEN)
4. Parsing body email dan extract kode 6 digit menggunakan regex
5. Kode OTP di-input ke form dan diverifikasi

## Test Cases

### Login - Positive Test (Full Flow)

| # | Scenario | Expected |
|---|----------|----------|
| 1 | Login → Input OTP dari email → Verifikasi | Redirect ke Dashboard Keuangan |

### Login - Negative Test

| # | Scenario | Expected |
|---|----------|----------|
| 1 | Email kosong + password valid | Tombol Sign in disabled |
| 2 | Email tidak valid + password valid | Tetap di halaman login |
| 3 | Email valid + password kosong | Tombol Sign in disabled |
| 4 | Email & password kosong | Tombol Sign in disabled |
| 5 | Password salah | Tetap di halaman login |
| 6 | Email belum terdaftar | Tetap di halaman login |

### Login - UI Test

| # | Scenario | Expected |
|---|----------|----------|
| 1 | Toggle show/hide password | Input type berubah password ↔ text |
| 2 | Theme toggle dark/light | Class `dark` ditambah/dihapus dari `<html>` |
| 3 | Logo link ke halaman utama | Redirect ke `/auth/login` (karena belum auth) |

### Forgot Password - Navigasi

| # | Scenario | Expected |
|---|----------|----------|
| 1 | Klik "Lupa password?" di halaman login | Navigasi ke halaman Ganti Password |

### Forgot Password - Positive Test

| # | Scenario | Expected |
|---|----------|----------|
| 1 | Isi form valid → OTP → Verifikasi | Redirect ke halaman login (berhasil ganti password) |

### Forgot Password - Negative Test

| # | Scenario | Expected |
|---|----------|----------|
| 1 | Form kosong | Tidak bisa submit (browser validation) |
| 2 | Password tidak cocok | Pesan error "Password tidak cocok" |
| 3 | Password < 8 karakter | Pesan error "Password terlalu pendek" |
| 4 | Email tidak terdaftar | Pesan error "Email tidak ditemukan" |
| 5 | Email format tidak valid | Tidak bisa submit (browser validation) |

## Konfigurasi Playwright

Browser berjalan dalam mode **headed** (visible) dengan `slowMo: 500ms` agar proses terlihat. Untuk mode headless (CI/CD), ubah di `playwright.config.ts`:

```ts
use: {
  headless: true,
  // hapus launchOptions.slowMo
}
```

## Screenshots

Setiap test menghasilkan screenshot pada checkpoint penting. Screenshot disimpan di folder `screenshots/` dan di-generate ulang otomatis setiap kali test dijalankan (folder lama dihapus via `pretest` script).
