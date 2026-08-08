# Test Auth

Test suite untuk fitur autentikasi aplikasi Fin-Techno: **Login**, **Sign Up**, dan **Forgot Password**.

## File Test

| File | Deskripsi |
|------|-----------|
| `login.spec.ts` | Test login (full flow + negative + UI) |
| `signup.spec.ts` | Test sign up / registrasi (full flow + negative + UI) |
| `forgot-password.spec.ts` | Test lupa/ganti password (full flow + negative) |

## Menjalankan Test

```bash
# Semua test auth
npx playwright test tests/auth/

# Per file
npx playwright test tests/auth/login.spec.ts
npx playwright test tests/auth/signup.spec.ts
npx playwright test tests/auth/forgot-password.spec.ts
```

## Test Cases

### Login (`login.spec.ts`)

#### Positive Test (Full Flow)

| # | Scenario | Expected |
|---|----------|----------|
| 1 | Login → Input OTP dari email → Verifikasi | Redirect ke Dashboard |

#### Negative Test

| # | Scenario | Expected |
|---|----------|----------|
| 1 | Email kosong + password valid | Tombol Sign in disabled |
| 2 | Email tidak valid + password valid | Tetap di halaman login |
| 3 | Email valid + password kosong | Tombol Sign in disabled |
| 4 | Email & password kosong | Tombol Sign in disabled |
| 5 | Password salah | Tetap di halaman login |
| 6 | Email belum terdaftar | Tetap di halaman login |

#### UI Test

| # | Scenario | Expected |
|---|----------|----------|
| 1 | Toggle show/hide password | Input type berubah password ↔ text |
| 2 | Theme toggle dark/light | Class `dark` toggle di `<html>` |
| 3 | Logo link ke halaman utama | Redirect ke `/auth/login` (belum auth) |

---

### Sign Up (`signup.spec.ts`)

#### Positive Test (Full Flow)

| # | Scenario | Expected |
|---|----------|----------|
| 1 | Isi nama + email + password + centang terms → OTP → Verifikasi | Redirect ke Dashboard |

#### Negative Test

| # | Scenario | Expected |
|---|----------|----------|
| 1 | Semua field kosong | Tombol Sign Up disabled |
| 2 | Nama kosong | Tombol Sign Up disabled |
| 3 | Email kosong | Tombol Sign Up disabled |
| 4 | Password kosong | Tombol Sign Up disabled |
| 5 | Checkbox terms tidak dicentang | Tombol Sign Up disabled |
| 6 | Password < 8 karakter | Warning toast, tetap di halaman |
| 7 | Email sudah terdaftar | Error toast, tetap di halaman |

#### UI Test

| # | Scenario | Expected |
|---|----------|----------|
| 1 | Toggle show/hide password | Input type berubah password ↔ text |
| 2 | Klik link "Sign In" | Navigasi ke `/auth/login` |
| 3 | Theme toggle dark/light | Class `dark` toggle di `<html>` |

---

### Forgot Password (`forgot-password.spec.ts`)

#### Navigasi

| # | Scenario | Expected |
|---|----------|----------|
| 1 | Klik "Lupa password?" di halaman login | Navigasi ke halaman Ganti Password |

#### Positive Test (Full Flow)

| # | Scenario | Expected |
|---|----------|----------|
| 1 | Isi email + password baru + konfirmasi → Kirim OTP → Verifikasi | Redirect ke halaman login |

#### Negative Test

| # | Scenario | Expected |
|---|----------|----------|
| 1 | Form kosong | Tidak bisa submit (browser validation) |
| 2 | Password tidak cocok | Error "Password tidak cocok" |
| 3 | Password < 8 karakter | Error "Password terlalu pendek" |
| 4 | Email tidak terdaftar | Error "Email tidak ditemukan" |
| 5 | Email format tidak valid | Tidak bisa submit (browser validation) |

## Screenshots

Setiap test menghasilkan screenshot di:
- `screenshots/login/`
- `screenshots/signup/`
- `screenshots/forgot-password/`

Screenshot di-regenerate otomatis tiap run (folder lama dihapus).
