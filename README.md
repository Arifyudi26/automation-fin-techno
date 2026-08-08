# Automation Fin-Techno

Automated test suite untuk halaman login aplikasi [Fin-Techno](https://fin-techno.vercel.app) menggunakan **Playwright** + **TypeScript**.

## Tech Stack

| Tool | Fungsi |
|------|--------|
| [Playwright](https://playwright.dev/) | Browser automation & testing framework |
| TypeScript | Bahasa pemrograman |
| [imap-simple](https://www.npmjs.com/package/imap-simple) | Koneksi ke Gmail via IMAP untuk mengambil OTP |
| [mailparser](https://www.npmjs.com/package/mailparser) | Parsing isi email (extract body text/HTML) |

## Cara Ambil OTP dari Email

Test ini mengambil kode OTP secara otomatis dari inbox Gmail menggunakan **IMAP (Internet Message Access Protocol)**. Alurnya:

1. Setelah login berhasil, aplikasi mengirim email OTP ke alamat email user
2. Test konek ke Gmail via IMAP menggunakan **App Password** (bukan password utama)
3. Mencari email terbaru dengan subject **"Kode OTP Login - Fin-Techno"** yang belum dibaca (UNSEEN)
4. Parsing body email dan extract kode 6 digit menggunakan regex `/\b(\d{6})\b/`
5. Kode OTP di-input ke form dan diverifikasi

### Library yang Digunakan

- **`imap-simple`** — wrapper sederhana di atas library `imap` Node.js untuk konek ke mail server via IMAP protocol (port 993, TLS)
- **`mailparser`** — parsing raw email menjadi object terstruktur (subject, text, html, attachments)

### Prasyarat Gmail

Untuk menggunakan IMAP dengan Gmail, kamu perlu:

1. **Aktifkan 2-Step Verification** di Google Account
2. **Buat App Password** di https://myaccount.google.com/apppasswords
3. Gunakan App Password 16 karakter tersebut di konfigurasi (bukan password Gmail utama)

## Struktur Project

```
automation-fin-techno/
├── playwright.config.ts              # Konfigurasi Playwright
├── tests/
│   ├── login-full-flow.spec.ts       # Semua test dalam 1 file (full flow + negative + UI)
│   └── helpers/
│       └── email-otp.ts              # Helper IMAP untuk ambil OTP dari Gmail
├── screenshots/
│   ├── full-flow/                    # Screenshot full flow test
│   ├── negative/                     # Screenshot negative test
│   └── ui/                           # Screenshot UI test (toggle password, theme)
├── package.json
└── README.md
```

## Instalasi

```bash
npm install
npx playwright install chromium
```

## Menjalankan Test

```bash
# Jalankan semua test
npx playwright test

# Jalankan full flow + negative test
npx playwright test tests/login-full-flow.spec.ts
```

## Konfigurasi

Browser berjalan dalam mode **headed** (visible) dengan `slowMo: 500ms` agar proses terlihat. Untuk mode headless (CI/CD), ubah di `playwright.config.ts`:

```ts
use: {
  headless: true,
  // hapus launchOptions.slowMo
}
```

## Test Cases

### Positive Test (Full Flow)
| # | Scenario | Expected |
|---|----------|----------|
| 1 | Login → Input OTP dari email → Verifikasi | Redirect ke Dashboard Keuangan |

### Negative Test
| # | Scenario | Expected |
|---|----------|----------|
| 1 | Email kosong + password valid | Tombol Sign in disabled |
| 2 | Email tidak valid + password valid | Tetap di halaman login |
| 3 | Email valid + password kosong | Tombol Sign in disabled |
| 4 | Email & password kosong | Tombol Sign in disabled |
| 5 | Password salah | Tetap di halaman login |
| 6 | Email belum terdaftar | Tetap di halaman login |

### UI Test
| # | Scenario | Expected |
|---|----------|----------|
| 1 | Toggle show/hide password | Input type berubah password ↔ text |
| 2 | Theme toggle dark/light | Class `dark` ditambah/dihapus dari `<html>` |

## Screenshots

Setiap test menghasilkan screenshot pada checkpoint penting (sebelum input, setelah input, setelah submit, hasil akhir). Screenshot disimpan di folder `screenshots/`.
