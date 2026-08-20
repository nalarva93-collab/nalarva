# Nalarva Next.js Elegant v5 — Academic Workflow

# Nalarva Next.js Elegant v4.2 — Readable

# Nalarva Next.js Elegant v4 — Operational

Baseline aplikasi Nalarva untuk persiapan TKA SD, SMP, dan SMA.

## Arsitektur
- Frontend: Next.js 16.3 + React 19
- Deployment: static export (`output: "export"`)
- Hosting: Cloudflare Pages
- Backend: Google Apps Script Web App
- Database: Google Sheets
- File: Google Drive

Tidak memakai Prisma, Neon, PostgreSQL, OpenNext, atau Next.js SSR.

## Jalankan lokal
```cmd
npm ci
npm run dev
```
Buka `http://localhost:3000`.

Tanpa `NEXT_PUBLIC_APPS_SCRIPT_URL`, aplikasi otomatis berjalan dalam mode demo lokal.

## Build production
```cmd
npm run build
```
Hasil berada di folder `out/`.

## Halaman publik
- `/`
- `/program`
- `/program/tka-sd`
- `/program/tka-smp`
- `/program/tka-sma`
- `/paket`
- `/tryout`
- `/tentang`
- `/faq`
- `/kontak`
- `/daftar`
- `/login`

## Dashboard Admin
- `/dashboard/admin`
- `/dashboard/admin/siswa`
- `/dashboard/admin/tutor`
- `/dashboard/admin/kelas`
- `/dashboard/admin/materi`
- `/dashboard/admin/tryout`
- `/dashboard/admin/bank-soal`
- `/dashboard/admin/laporan`

## Dashboard Tutor
- `/dashboard/tutor`
- `/dashboard/tutor/kelas`
- `/dashboard/tutor/jadwal`
- `/dashboard/tutor/materi`
- `/dashboard/tutor/tugas`
- `/dashboard/tutor/absensi`
- `/dashboard/tutor/nilai`

## Dashboard Siswa
- `/dashboard/siswa`
- `/dashboard/siswa/kelas`
- `/dashboard/siswa/materi`
- `/dashboard/siswa/tugas`
- `/dashboard/siswa/tryout`
- `/dashboard/siswa/analisis`
- `/dashboard/siswa/ranking`

## Fitur backend v4
- akun Admin/Tutor/Siswa dengan password hash + session token
- pendaftaran website dan kontak masuk Google Sheets
- admin membuat akun siswa/tutor
- admin membuat kelas, jadwal, enrollment
- admin/tutor upload materi ke Google Drive
- tutor membuat tugas
- siswa upload submission ke Google Drive
- tutor mengisi absensi dan nilai
- admin membuat bank soal dan tryout
- siswa mengerjakan tryout
- koreksi otomatis
- analisis per topik
- ranking tryout
- audit log login dan aktivitas penting

Baca `BACKEND_SETUP.md` sebelum mengaktifkan backend.
