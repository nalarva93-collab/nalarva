# Nalarva v4.1 Hotfix

Perbaikan:
- Memperbaiki crash form admin siswa akibat `e.currentTarget` menjadi null setelah `await`.
- Menerapkan pola aman yang sama pada form tutor, materi, tugas, kelas, bank soal, dan tryout.
- Memperbaiki warning aspect-ratio logo Next.js dengan logo horizontal yang mempertahankan rasio.
- Memuat logo above-the-fold secara eager untuk menghilangkan warning LCP terkait logo.
- Menambahkan `data-scroll-behavior="smooth"` pada root HTML untuk warning route transition Next.js.

Backend dan `.env.local` tidak diubah.
