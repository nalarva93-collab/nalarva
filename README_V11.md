# Nalarva Complete v11 — Production Readiness

FULL COMPLETE kumulatif. Tidak perlu memasang v1-v10 atau PATCH.

## Tambahan v11
- Global search dashboard berbasis role/permission.
- Admin Audit Log.
- Export Audit Log CSV.
- Manual database backup ke Google Drive.
- Weekly automatic database backup.
- Daily maintenance: cleanup session kadaluarsa + subscription reminders.
- System health/status page.
- Login rate limiting.
- Public form / payment proof / messaging rate limiting.
- Maksimal 8 sesi aktif per akun.
- Error boundary dan 404 yang lebih matang.
- SEO metadata.
- robots.txt metadata route.
- sitemap.xml metadata route.
- Web manifest.
- Cloudflare Pages `_headers` security headers.
- Cloudflare Pages `_redirects`.
- Deployment guide.

## Backend
Health check:
`9.0-production-ready`

## Penting
Backup v11 menyalin database Google Sheet. File Drive seperti materi, tugas, upload siswa, dan bukti pembayaran tetap berada di folder Drive Nalarva dan tidak diduplikasi oleh backup database.
