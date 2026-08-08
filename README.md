# Automation Fin-Techno

Automated test suite untuk aplikasi [Fin-Techno](https://fin-techno.vercel.app) menggunakan **Playwright** + **TypeScript** + **LLM (Groq)**. Mencakup test autentikasi, dashboard, dan AI-powered analysis.

## Tech Stack

| Tool | Fungsi |
|------|--------|
| [Playwright](https://playwright.dev/) | Browser automation & testing framework |
| TypeScript | Bahasa pemrograman |
| [Groq SDK](https://console.groq.com/) | LLM API (Llama 3) untuk analisis halaman |
| [imap-simple](https://www.npmjs.com/package/imap-simple) | Koneksi ke Gmail via IMAP untuk mengambil OTP |
| [mailparser](https://www.npmjs.com/package/mailparser) | Parsing isi email (extract body text/HTML) |
| [Inquirer](https://www.npmjs.com/package/@inquirer/prompts) | Interactive CLI untuk memilih test |

## Struktur Project

```
automation-fin-techno/
├── playwright.config.ts          # Konfigurasi Playwright
├── global-setup.ts               # Global setup (clear screenshots)
├── cli.mjs                       # Interactive CLI runner
├── tests/
│   ├── auth/
│   │   ├── login.spec.ts         # Test login (full flow + negative + UI)
│   │   ├── signup.spec.ts        # Test sign up (full flow + negative + UI)
│   │   ├── forgot-password.spec.ts  # Test forgot/change password
│   │   └── README.md             # Dokumentasi test auth
│   ├── dashboard/
│   │   ├── dashboard.spec.ts     # Test dashboard (section + interaksi + LLM)
│   │   └── README.md             # Dokumentasi test dashboard + LLM
│   └── helpers/
│       ├── email-otp.ts          # Helper IMAP untuk ambil OTP dari Gmail
│       ├── login.ts              # Shared helper login (reusable)
│       └── llm.ts                # Helper Groq LLM untuk analisis halaman
├── screenshots/                  # Output screenshot (auto-generated)
│   ├── login/
│   ├── signup/
│   ├── forgot-password/
│   └── dashboard/
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

# Groq AI (untuk LLM test) - gratis di console.groq.com
GROQ_API_KEY=your-groq-api-key

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

### Prasyarat Groq (untuk LLM test)

1. Daftar gratis di https://console.groq.com
2. Buat API Key
3. Isi di `.env` sebagai `GROQ_API_KEY`

## Menjalankan Test

### Interactive CLI (Rekomendasi)

```bash
npm start
```

### Command Langsung

```bash
# Jalankan semua test
npx playwright test

# Per folder
npx playwright test tests/auth/
npx playwright test tests/dashboard/

# Per file
npx playwright test tests/auth/login.spec.ts
npx playwright test tests/auth/signup.spec.ts
npx playwright test tests/auth/forgot-password.spec.ts
npx playwright test tests/dashboard/dashboard.spec.ts

# Per scenario (grep)
npx playwright test --grep "Login"
npx playwright test --grep "Negative"
npx playwright test --grep "Groq"
```

## Cara Kerja OTP

Test mengambil kode OTP secara otomatis dari inbox Gmail menggunakan IMAP:

1. Setelah action (login/signup/ganti password), aplikasi mengirim email OTP
2. Test konek ke Gmail via IMAP menggunakan App Password
3. Mencari email terbaru dengan subject yang sesuai (UNSEEN)
4. Parsing body email dan extract kode 6 digit menggunakan regex
5. Kode OTP di-input ke form dan diverifikasi

## LLM Integration (Groq)

Test dashboard menggunakan **Groq API** untuk analisis otomatis:
- Ambil text content + struktur halaman (headings, charts, buttons)
- Kirim ke Llama 3 via Groq
- LLM memberikan UX score dan suggestions

Groq free tier: **30 req/menit, 14.400 req/hari** — sangat cukup untuk testing.

> **Note:** Groq saat ini hanya support text model. Untuk vision/screenshot analysis, lihat alternatif di [README Dashboard](tests/dashboard/README.md#alternatif-untuk-vision-image-analysis).

## Test Coverage

### Auth (3 files, 20+ test cases)

| Module | Positive | Negative | UI |
|--------|----------|----------|----|
| Login | 1 (full flow + OTP) | 6 | 3 |
| Sign Up | 1 (full flow + OTP) | 7 | 3 |
| Forgot Password | 1 (full flow + OTP) | 5 | 1 (navigasi) |

Detail: lihat [`tests/auth/README.md`](tests/auth/README.md)

### Dashboard (1 file, 8 test cases)

| Module | Test Cases |
|--------|-----------|
| Verifikasi Elemen | Login → semua section dashboard visible |
| Finance Metrics | 5 metric cards loaded |
| Rekening & Dompet | Filter Semua/Bank/Dompet |
| Transaksi Terbaru | Filter Semua/Masuk/Keluar |
| Spending By Category | Toggle Expense/Income + Donut/Bar |
| AI Insights | Klik Analisis Sekarang |
| Navigasi | Lihat Semua → halaman transaksi |
| LLM Analysis | Groq analisis UX + suggestions |

Detail: lihat [`tests/dashboard/README.md`](tests/dashboard/README.md)

## Konfigurasi Playwright

Browser berjalan dalam mode **headed** (visible) dengan `slowMo: 500ms` agar proses terlihat. Untuk mode headless (CI/CD), ubah di `playwright.config.ts`:

```ts
use: {
  headless: true,
  // hapus launchOptions.slowMo
}
```

## Screenshots

Setiap test menghasilkan screenshot pada checkpoint penting. Screenshot disimpan di folder `screenshots/` dan di-generate ulang otomatis setiap kali test dijalankan (folder lama dihapus via `global-setup.ts`).
