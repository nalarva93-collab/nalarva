# Setup Backend Nalarva — Google Apps Script + Sheets + Drive

Versi ini dirancang agar setup backend dilakukan sekali dan frontend tetap statis.

## A. Buat project Apps Script
1. Buka Google Apps Script.
2. Buat project baru bernama `NALARVA Backend`.
3. Salin seluruh isi:
   `google-apps-script/Code.gs`
   ke file `Code.gs` di Apps Script.
4. Pada Project Settings, pastikan timezone `Asia/Jakarta`.
5. Bila memakai manifest, isi `appsscript.json` sudah tersedia pada folder `google-apps-script`.

## B. Jalankan setup otomatis
Di editor Apps Script pilih fungsi:

```javascript
setupNalarva
```

Klik **Run** sekali dan izinkan akses Google Sheets/Drive.

Fungsi ini otomatis membuat:
- Spreadsheet `NALARVA_DB`
- sheet operasional
- folder Drive `NALARVA`
- subfolder Materi, Tugas, Tryout, Upload Siswa, dll.
- program TKA SD, SMP, SMA
- akun admin awal

Lihat **Execution log**. Simpan:
- `spreadsheetUrl`
- `driveFolderUrl`
- `adminEmail`
- `temporaryPassword`

Password admin hanya ditampilkan saat akun admin pertama kali dibuat.

## C. Opsional: buat data demo backend
Untuk menguji alur siswa/tutor sebelum memasukkan data sungguhan, jalankan:

```javascript
setupDemoLearningData
```

Ini membuat:
- `tutor@nalarva.com`
- `siswa@nalarva.com`
- profil tutor/siswa
- satu kelas demo
- enrollment
- satu jadwal
- 3 soal demo
- satu tryout TKA SMA demo

Password ditampilkan di Execution log bila akun baru dibuat.

**Jangan jalankan fungsi ini jika database produksi tidak ingin berisi data demo.**

## D. Deploy sebagai Web App
1. Klik **Deploy**
2. **New deployment**
3. Type: **Web app**
4. Execute as: **Me**
5. Who has access: pilih opsi yang membuat web app dapat diakses frontend Nalarva sesuai akun Google Anda.
6. Deploy
7. Salin URL yang berakhir `/exec`

Jika Anda mengubah `Code.gs` setelah deployment, buat deployment/version baru atau edit deployment agar kode terbaru digunakan.

## E. Hubungkan frontend lokal
Di root project Nalarva buat file:

```text
.env.local
```

Isi:

```env
NEXT_PUBLIC_APPS_SCRIPT_URL=https://script.google.com/macros/s/XXXXX/exec
```

Restart:

```cmd
npm run dev
```

## F. Login
Gunakan akun admin yang muncul dari `setupNalarva()`.

Dari dashboard admin:
1. buat akun Tutor;
2. buat kelas;
3. buat akun Siswa;
4. masukkan siswa ke kelas;
5. susun jadwal;
6. tutor dapat mengunggah materi dan membuat tugas;
7. admin membuat bank soal dan tryout.

Saat admin membuat akun baru, aplikasi menampilkan password sementara. Kirimkan password tersebut kepada pengguna melalui kanal yang aman.

## G. Alur Tryout
1. Admin → **Bank Soal** → tambah soal.
2. Admin → **Tryout** → buat tryout.
3. Admin → **Bank Soal** → hubungkan soal ke tryout.
4. Status tryout harus `PUBLISHED`.
5. Siswa → **Tryout** → Mulai.
6. Jawaban disimpan setelah siswa mengirim.
7. Backend menghitung skor, benar/salah, analisis topik, percentile, dan ranking.

## H. Upload file
Upload langsung dari dashboard dibatasi **4 MB per file** untuk menjaga Apps Script tetap ringan.

File materi masuk ke:
`NALARVA/Materi`

Submission siswa masuk ke:
`NALARVA/Upload Siswa`

Backend mencoba mengatur file menjadi dapat dilihat melalui link. Jika kebijakan Google Workspace melarang hal tersebut, atur izin folder/file dari Google Drive sesuai kebutuhan sekolah/kursus.

Untuk video besar, jangan upload melalui Apps Script. Simpan video di Drive/YouTube/Vimeo dan gunakan link.

## I. Cloudflare Pages
Environment variable yang perlu dipasang sebelum build:

```text
NEXT_PUBLIC_APPS_SCRIPT_URL
```

Build:
```text
npm run build
```

Output:
```text
out
```

Project ini tidak membutuhkan OpenNext atau Wrangler Worker.

## J. Keamanan dasar yang sudah diterapkan
- password tidak disimpan plaintext;
- password di-hash dengan HMAC + salt + pepper;
- token session yang disimpan di Sheet adalah hash token;
- role dicek di backend;
- kelas difilter berdasarkan admin/tutor/siswa;
- spreadsheet formula injection dibatasi;
- audit log digunakan untuk aktivitas penting.

Catatan: arsitektur Sheets + Apps Script cocok untuk fase awal Nalarva. Bila trafik tryout dan jumlah pengguna tumbuh besar, backend dapat dipindahkan ke database/server khusus tanpa perlu mengganti desain frontend.
