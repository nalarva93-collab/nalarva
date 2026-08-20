# Nalarva Complete v8

Ini adalah FULL COMPLETE kumulatif. Tidak perlu memasang v1-v7 atau PATCH.

## Tambahan v8
- Notifikasi dashboard untuk Admin, Tutor, dan Siswa.
- Badge jumlah notifikasi belum dibaca.
- Email otomatis menggunakan Google Apps Script MailApp.
- Email: pendaftaran diterima, invoice dibuat, bukti pembayaran diterima, pembayaran disetujui/ditolak, akun aktif.
- Pengingat masa aktif paket otomatis 7, 3, 1, dan 0 hari sebelum berakhir.
- Trigger harian otomatis dibuat oleh `setupNalarva()`.
- Laporan Admin diperluas: penerimaan, tagihan tertunda, langganan aktif, pendaftaran, hasil tryout.
- Export CSV pembayaran, pendaftaran, dan hasil tryout.
- Pengaturan website, nama pengirim, email balasan, dan email notifikasi Admin.

## Backend
Health check yang benar:
`6.0-notifications`

## Email
MailApp menggunakan kuota Google Apps Script. Bila kuota email habis, notifikasi dashboard tetap tersimpan.
