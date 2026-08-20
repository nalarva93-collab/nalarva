# Security Notes — Nalarva v11

## Frontend
- Dashboard dan login mendapat `X-Robots-Tag: noindex` melalui Cloudflare Pages `_headers`.
- `X-Frame-Options: DENY`.
- `X-Content-Type-Options: nosniff`.
- Restrictive Permissions-Policy for camera, microphone, geolocation, and USB.
- Session token tetap hanya dikirim ke Apps Script backend dan privileged actions diverifikasi berdasarkan role.

## Backend
- Password disimpan sebagai HMAC-SHA256 dengan salt per user dan script-level pepper.
- Raw session token tidak disimpan; hanya hash token.
- Login rate limit: 6 percobaan / sekitar 15 menit per email.
- Register: 4 / jam per kombinasi email + WhatsApp.
- Contact: 6 / jam per nomor.
- Payment proof: 5 / jam per invoice + email.
- Messaging: 30 / 10 menit per user.
- Maksimal 8 sesi aktif per akun.
- Session expired dibersihkan maintenance harian.
- Backup database bersifat private di Google Drive.

## Batasan arsitektur
Google Apps Script + Sheets cocok untuk fase awal dan operasional yang belum bertrafik sangat tinggi. Rate limit berbasis Script Cache adalah lapisan perlindungan praktis, bukan pengganti WAF/rate limiting di edge untuk skala besar.
