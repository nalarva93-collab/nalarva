# Deploy Nalarva v11 ke Cloudflare Pages

## Arsitektur
Next.js static export -> folder `out` -> Cloudflare Pages.
Backend tetap Google Apps Script.

## Sebelum deploy
1. Pastikan `.env.local`:
   `NEXT_PUBLIC_APPS_SCRIPT_URL=https://script.google.com/macros/s/.../exec`
2. Jalankan:
   `npm ci`
   `npm run build`
3. Pastikan folder `out` terbentuk.

## Cloudflare Pages
- Framework preset: Next.js (Static HTML Export) bila tersedia, atau konfigurasi manual.
- Build command: `npm run build`
- Build output directory: `out`
- Environment variable:
  - `NEXT_PUBLIC_APPS_SCRIPT_URL` = URL Apps Script `/exec`

## Jangan gunakan
- `wrangler deploy`
- OpenNext
- Cloudflare Workers SSR
untuk arsitektur v11 ini.

## Domain
Setelah Pages deployment sehat:
1. Tambahkan custom domain `nalarva.com`.
2. Tambahkan `www.nalarva.com` bila diinginkan.
3. Pilih satu domain utama/canonical. Metadata v11 menggunakan `https://nalarva.com`.

## File Cloudflare
`public/_headers` dan `public/_redirects` otomatis ikut masuk ke hasil static export.
