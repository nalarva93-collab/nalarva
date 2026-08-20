# Update Backend ke Nalarva Complete v9

1. Replace seluruh `Code.gs` di project `NALARVA BACKEND` dengan `google-apps-script/Code.gs` dari v9.
2. Save.
3. Jalankan `setupNalarva()` sekali.
4. Setup akan menambah kolom profil siswa serta sheet:
   - CALENDAR_EVENTS
   - MESSAGES
   - CERTIFICATES
5. Data lama tidak dihapus.
6. Deploy > Manage deployments > Edit > New version > Deploy.
7. URL `/exec` tetap sama.
8. Health check harus menunjukkan `7.0-student-experience`.

## Menu baru
Admin:
- Kalender

Tutor:
- Kalender
- Pesan

Siswa:
- Profil Saya
- Kalender
- Pesan
- Sertifikat
