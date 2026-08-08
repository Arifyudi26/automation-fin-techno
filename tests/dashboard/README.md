# Test Dashboard

Test suite untuk halaman **Dashboard** aplikasi Fin-Techno. Setiap test melakukan login terlebih dahulu menggunakan shared helper (`tests/helpers/login.ts`), kemudian memverifikasi komponen-komponen dashboard.

## File Test

| File | Deskripsi |
|------|-----------|
| `dashboard.spec.ts` | Test semua section, interaksi, dan LLM analysis di halaman dashboard |

## Menjalankan Test

```bash
# Semua test dashboard
npx playwright test tests/dashboard/

# Per scenario
npx playwright test tests/dashboard/dashboard.spec.ts --grep "Login"
npx playwright test tests/dashboard/dashboard.spec.ts --grep "Metrics"
npx playwright test tests/dashboard/dashboard.spec.ts --grep "Rekening"
npx playwright test tests/dashboard/dashboard.spec.ts --grep "Transaksi"
npx playwright test tests/dashboard/dashboard.spec.ts --grep "Spending"
npx playwright test tests/dashboard/dashboard.spec.ts --grep "AI"
npx playwright test tests/dashboard/dashboard.spec.ts --grep "Navigasi"
npx playwright test tests/dashboard/dashboard.spec.ts --grep "Groq"
```

## Prasyarat

Test dashboard memerlukan **login berhasil** (termasuk OTP via email). Pastikan:
- `.env` sudah dikonfigurasi dengan benar
- Email IMAP bisa diakses (untuk ambil OTP)
- Akun test sudah terdaftar di aplikasi
- `GROQ_API_KEY` diisi untuk test LLM (opsional)

## Test Cases

### 1. Login & Verifikasi Elemen

| Scenario | Expected |
|----------|----------|
| Login → Dashboard loaded | Semua section utama visible: Tren Keuangan, Rekening & Dompet, Transaksi Terbaru, Analisis AI, Filter, Search bar |

### 2. Finance Metrics Cards

| Scenario | Expected |
|----------|----------|
| Dashboard loaded | 5 metric cards tampil (Total Pemasukan, Total Pengeluaran, Net Flow, Total Saldo, Jumlah Transaksi) |

### 3. Rekening & Dompet

| Scenario | Expected |
|----------|----------|
| Klik filter "Bank" | Menampilkan hanya rekening bank |
| Klik filter "Dompet" | Menampilkan hanya dompet digital |
| Klik filter "Semua" | Menampilkan semua rekening & dompet |

### 4. Transaksi Terbaru

| Scenario | Expected |
|----------|----------|
| Section tampil | Heading + link "Lihat Semua" visible |
| Klik filter "Masuk" | Filter transaksi pemasukan |
| Klik filter "Keluar" | Filter transaksi pengeluaran |
| Klik filter "Semua" | Tampilkan semua transaksi |

### 5. Spending By Category

| Scenario | Expected |
|----------|----------|
| Toggle "Pemasukan" | Chart berubah ke data pemasukan |
| Toggle "Pengeluaran" | Chart berubah ke data pengeluaran |
| Toggle "Bar" | Tampilan chart berubah ke bar |
| Toggle "Donut" | Tampilan chart berubah ke donut |

### 6. AI Insights

| Scenario | Expected |
|----------|----------|
| Klik "Analisis Sekarang" | Loading → Hasil analisis AI muncul (atau error jika gagal) |

### 7. Navigasi ke Transaksi

| Scenario | Expected |
|----------|----------|
| Klik "Lihat Semua" di Transaksi Terbaru | Navigasi ke halaman `/transactions` |

### 8. LLM Analysis (Groq)

| Scenario | Expected |
|----------|----------|
| Ambil text + struktur halaman → kirim ke Groq | LLM memberikan UX score dan suggestions |

## LLM Integration (Groq)

Test menggunakan **Groq API** (Llama 3) untuk analisis text content dashboard secara otomatis. LLM menerima:
- Text content halaman (innerText)
- Informasi struktur (headings, charts, buttons)
- Info teknis (responsive, tech stack)

Dan memberikan:
- `uxScore` — skor UX 1-10
- `completeness` — seberapa lengkap fitur
- `suggestions` — saran perbaikan yang actionable

### Kenapa Text-Only?

Groq saat ini **hanya support text model** (semua vision model sudah di-decommission). Untuk mengatasi keterbatasan ini, test mengumpulkan informasi struktur halaman (accessibility roles, headings, chart presence) dan mengirimnya sebagai context tambahan ke LLM.

### Alternatif untuk Vision (Image Analysis)

Jika ingin LLM menganalisis **screenshot** langsung (visual analysis), gunakan provider berikut:

| Provider | Vision Model | Free? | Cocok? |
|----------|-------------|-------|--------|
| OpenAI | GPT-4o / GPT-4o-mini | Bayar (~$2.50/1M tokens) | ✅ Paling reliable |
| Google Gemini | gemini-2.0-flash | 15 req/min gratis | ⚠️ Quota terbatas |
| Anthropic | Claude 3.5 Sonnet | Bayar (~$3/1M tokens) | ✅ Bagus |
| OpenRouter | Free vision models | Beberapa gratis | ⚠️ Lambat |
| Ollama (local) | llama3.2-vision 11B | Gratis (local) | ⚠️ Butuh GPU |

## Shared Helper

Login logic di-extract ke `tests/helpers/login.ts` agar reusable:

```ts
import { loginToDashboard } from '../helpers/login';

// Di dalam test:
await loginToDashboard(page);
```

Flow: Buka login → Isi email & password → Klik Sign in → Ambil OTP dari email → Input OTP → Verifikasi → Tunggu dashboard loaded.

## Screenshots

Screenshot disimpan di `screenshots/dashboard/` dan di-regenerate otomatis tiap run.
