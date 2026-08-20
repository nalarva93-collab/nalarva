# Update Backend ke v6

1. Buka `google-apps-script/Code.gs` dari project v6.
2. Copy seluruh isi file.
3. Buka project Google Apps Script `NALARVA BACKEND`.
4. Replace seluruh Code.gs lama lalu Save.
5. Jalankan `setupNalarva()` sekali lagi.
   - Data lama tidak dihapus.
   - Sheet baru `PACKAGES`, `ORDERS`, dan `PAYMENTS` dibuat otomatis.
   - Tiga template paket dibuat dalam status DRAFT dengan harga Rp0.
6. Deploy > Manage deployments > Edit > New version > Deploy.
7. URL `/exec` tetap sama.
8. Health check harus menampilkan versi `4.0-commercial`.

Penting:
- Sebelum paket tampil publik, buka Dashboard Admin > Pendaftaran & Bayar.
- Isi harga paket dan ubah status menjadi ACTIVE.
- Jangan mengaktifkan paket dengan harga Rp0 kecuali memang ingin membuat paket gratis.
