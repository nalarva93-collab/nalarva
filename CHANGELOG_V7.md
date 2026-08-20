# Changelog v7

## Billing
- Nomor invoice otomatis NV-INV-YYYY-XXXX.
- Jatuh tempo invoice.
- Halaman publik `/pembayaran`.
- Cek invoice dengan nomor invoice + email.
- Cetak / simpan invoice sebagai PDF melalui browser.
- Pengaturan rekening dari dashboard Admin.
- Upload bukti JPG/PNG/PDF maksimal 4 MB.
- Bukti disimpan ke Google Drive.
- Admin approve/reject bukti.

## Subscription
- PACKAGES memiliki `duration_days`.
- Sheet baru SUBSCRIPTIONS.
- Aktivasi siswa membuat atau memperpanjang masa aktif.
- Admin dapat tambah 30 hari, suspend, atau aktifkan langganan.
- Student menu `Langganan`.
- Backend mengunci kelas, materi, tugas, dan tryout saat langganan tidak aktif.
- Siswa tetap dapat login, mengganti password, melihat analisis/ranking lama, dan status langganan.
- Siswa lama mendapat Legacy Access saat setup v7.

## Database migration
`ensureSheet_()` sekarang menambahkan header baru ke sheet lama sehingga update schema tidak membutuhkan penghapusan data.

## Privasi
- Bukti pembayaran disimpan private di Google Drive dan URL-nya tidak dikirim ke halaman publik.
