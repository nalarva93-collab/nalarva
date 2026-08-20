# Update Google Apps Script ke Nalarva Complete v8

1. Buka `google-apps-script/Code.gs` dari v8.
2. Replace seluruh Code.gs di project Apps Script `NALARVA BACKEND`.
3. Save.
4. Jalankan `setupNalarva()` sekali.
5. v8 akan:
   - menambah sheet `NOTIFICATIONS`;
   - menambah setting email;
   - membuat trigger harian `sendSubscriptionRemindersDaily`;
   - mempertahankan database dan file lama.
6. Karena v8 menggunakan MailApp dan ScriptApp trigger, Google mungkin meminta otorisasi tambahan saat setup dijalankan.
7. Deploy > Manage deployments > Edit > New version > Deploy.
8. URL `/exec` tetap sama.
9. Cek `...?action=health`.
10. Versi yang benar: `6.0-notifications`.

## Setelah update
Buka Dashboard Admin > Pendaftaran & Bayar > Pengaturan pembayaran:
- Alamat website
- Nama pengirim email
- Email balasan
- Email notifikasi Admin

Email notifikasi Admin sebaiknya menggunakan alamat email nyata yang Anda pantau.
