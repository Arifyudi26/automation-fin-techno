# Test Dashboard

Test suite untuk halaman **Dashboard** aplikasi Fin-Techno. Setiap test melakukan login terlebih dahulu menggunakan shared helper (`tests/helpers/login.ts`), kemudian memverifikasi komponen-komponen dashboard.

## File Test

| File | Deskripsi |
|------|-----------|
| `dashboard.spec.ts` | Test semua section dan interaksi di halaman dashboard |

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
```

## Prasyarat

Test dashboard memerlukan **login berhasil** (termasuk OTP via email). Pastikan:
- `.env` sudah dikonfigurasi dengan benar
- Email IMAP bisa diakses (untuk ambil OTP)
- Akun test sudah terdaftar di aplikasi

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
