# Update backend ke Nalarva v5

Jika backend Google Apps Script v4 sudah aktif:

1. Buka project Apps Script `NALARVA BACKEND`.
2. Ganti seluruh isi `Code.gs` dengan file `google-apps-script/Code.gs` dari paket v5 ini.
3. Simpan.
4. Jalankan `setupNalarva()` satu kali. Fungsi ini aman dijalankan ulang dan tidak membuat database baru jika properti backend sudah ada.
5. Pilih **Deploy > Manage deployments**.
6. Edit deployment Web App yang sedang digunakan, pilih **New version**, lalu Deploy.
7. URL `/exec` tetap dapat digunakan. Tidak perlu mengubah `.env.local` bila URL deployment tetap sama.
8. Uji: buka `<URL_EXEC>?action=health`. Versi backend akan tampil `3.0-academic`.

Catatan: jangan menjalankan `setupDemoLearningData()` pada database produksi kecuali memang ingin memasukkan data demo.
