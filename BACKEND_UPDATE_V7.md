# Update Google Apps Script ke Nalarva v7

1. Buka `google-apps-script/Code.gs` dari Nalarva Complete v7.
2. Replace seluruh isi Code.gs di project `NALARVA BACKEND`.
3. Save.
4. Jalankan `setupNalarva()` sekali.
5. Setup v7 melakukan migrasi aman:
   - menambahkan kolom baru pada sheet lama tanpa menghapus data;
   - membuat sheet SUBSCRIPTIONS dan SETTINGS;
   - membuat folder Drive `Bukti Pembayaran`;
   - memberi Legacy Access kepada siswa aktif lama yang belum mempunyai langganan.
6. Deploy > Manage deployments > Edit > New version > Deploy.
7. URL `/exec` tetap sama.
8. Health check: `...?action=health`
9. Versi yang benar: `5.0-subscriptions`.

## Setelah update
- Dashboard Admin > Pendaftaran & Bayar:
  - isi rekening pembayaran;
  - atur paket dan `Masa aktif (hari)`;
  - buat invoice.
- Calon siswa membuka `/pembayaran`.
- Setelah bukti dikirim, Admin dapat menyetujui/menolak.
- Setelah PAID, Admin mengaktifkan siswa.
- Langganan otomatis dibuat/ditambahkan sesuai masa aktif paket.
