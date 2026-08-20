# Update Backend ke Nalarva Complete v10

1. Buka `google-apps-script/Code.gs` dari Complete v10.
2. Replace seluruh Code.gs pada project `NALARVA BACKEND`.
3. Save.
4. Jalankan `setupNalarva()` sekali.
5. Setup menambahkan sheet `GUARDIANS` tanpa menghapus data lama.
6. Deploy > Manage deployments > Edit > New version > Deploy.
7. URL `/exec` tetap sama.
8. Health check harus menunjukkan `8.0-parent-portal`.

## Membuat akun Orang Tua
Dashboard Admin > Orang Tua/Wali:
1. Pilih siswa.
2. Isi nama, email, WhatsApp, dan hubungan.
3. Sistem membuat akun role ORANG_TUA serta password sementara.
4. Jika email orang tua sudah memiliki akun ORANG_TUA, sistem hanya menambahkan hubungan ke anak lain.
