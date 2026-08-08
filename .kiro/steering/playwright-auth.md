---
inclusion: auto
---

# Playwright MCP - Auto Auth for Fin-Techno

Saat menggunakan Playwright MCP untuk mengakses `fin-techno.vercel.app`, **selalu set cookie token dulu** sebelum navigate ke halaman yang butuh auth.

## Cara akses dashboard tanpa login:

1. Navigate ke domain dulu (halaman apapun):
```js
await page.goto('https://fin-techno.vercel.app/auth/login');
```

2. Set cookie token dari `.env` (`AUTH_TOKEN`):
```js
await page.evaluate(() => {
  document.cookie = "token=<AUTH_TOKEN_VALUE>; path=/; domain=fin-techno.vercel.app";
});
```

3. Baru navigate ke halaman yang diinginkan:
```js
await page.goto('https://fin-techno.vercel.app');
```

## Token lokasi:
- File: `c:\Users\Arif Yudi\Documents\automation-fin-techno\.env`
- Key: `AUTH_TOKEN`
- Expired: biasanya 24 jam. Kalau redirect ke login, minta user update token di `.env`

## Halaman yang butuh auth:
- `/` (dashboard)
- `/transactions`
- `/bank-accounts`
- `/wallets`
- `/categories`
- `/calendar`
- `/upload`
- `/profile`

## Halaman publik (tanpa auth):
- `/auth/login`
- `/auth/register`
- `/signup`
- `/auth/change-password`
- `/docs`
