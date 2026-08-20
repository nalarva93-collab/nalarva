# Nalarva Complete v7

Versi FULL COMPLETE. Tidak perlu menggabungkan v1-v6 atau memasang PATCH satu per satu.

## Fitur kumulatif
- Next.js static export untuk Cloudflare Pages
- Landing page, program TKA SD/SMP/SMA, paket, FAQ, kontak, daftar, login
- Dashboard Admin, Tutor, Siswa
- Google Apps Script + Google Sheets + Google Drive
- Kelas, jadwal, enrollment, materi, tugas, absensi, nilai
- Bank soal, tryout profesional, timer, autosave, analisis, ranking
- Pendaftaran calon siswa, paket, order, pembayaran manual
- Invoice publik
- Upload bukti pembayaran
- Review bukti pembayaran oleh Admin
- Aktivasi akun siswa
- Masa aktif langganan
- Kontrol akses kelas/materi/tugas/tryout berdasarkan masa aktif
- Riwayat langganan siswa
- Migrasi aman untuk siswa lama (Legacy Access)

## Backend v7
Health check harus menampilkan:
`5.0-subscriptions`

## Menjalankan lokal
1. Copy `.env.local` dari project lama ke folder v7.
2. `npm ci`
3. `npm run dev`
4. Buka `http://localhost:3000`

## Build static
`npm run build`
Output berada di folder `out`.
