import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProgramGrid from "@/components/ProgramGrid";
import SectionTitle from "@/components/SectionTitle";
import Image from "next/image";
import Link from "next/link";

export default function Home(){return <><Header/><main>
  <section className="hero elegant-hero">
    <div className="container hero-grid">
      <div className="hero-copy">
        <div className="hero-overline"><span/>Fokus Persiapan TKA</div>
        <h1>Persiapan TKA yang <em>lebih tenang, terarah,</em> dan terukur.</h1>
        <p>Nalarva menyatukan kelas, materi, latihan, tryout, dan evaluasi progres dalam satu pengalaman belajar yang rapi—agar siswa tahu apa yang harus dipelajari berikutnya.</p>
        <div className="hero-actions"><Link className="btn primary large" href="/daftar">Mulai Program</Link><Link className="btn text-button" href="/program">Lihat seluruh program <span>→</span></Link></div>
        <div className="trust"><div><b>TKA SD</b><span>Fondasi yang kuat</span></div><div><b>TKA SMP</b><span>Penguatan konsep</span></div><div><b>TKA SMA</b><span>Persiapan intensif</span></div></div>
      </div>
      <div className="hero-visual">
        <div className="hero-frame"><Image src="/hero-students.jpg" alt="Siswa Nalarva" width={900} height={950} priority/></div>
        <div className="hero-badge badge-top"><span className="badge-icon">✓</span><div><b>Belajar terstruktur</b><small>Materi · Latihan · Tryout</small></div></div>
        <div className="hero-badge badge-bottom"><span className="badge-icon gold">↗</span><div><b>Progres terlihat</b><small>Evaluasi yang mudah dipahami</small></div></div>
        <div className="hero-gold-line"/>
      </div>
    </div>
    <div className="container elegant-benefits">
      <article><span>01</span><div><b>Materi tersusun</b><p>Belajar sesuai jenjang dan kebutuhan.</p></div></article>
      <article><span>02</span><div><b>Latihan bertahap</b><p>Bangun pemahaman, bukan sekadar hafalan.</p></div></article>
      <article><span>03</span><div><b>Tryout berkala</b><p>Biasakan diri dengan pola dan waktu ujian.</p></div></article>
      <article><span>04</span><div><b>Evaluasi progres</b><p>Tahu area kuat dan fokus berikutnya.</p></div></article>
    </div>
  </section>

  <section className="section ivory-section"><div className="container">
    <SectionTitle eyebrow="Program Nalarva" title="Satu standar belajar, tiga jenjang berbeda." desc="Setiap jenjang memiliki ritme, kedalaman materi, dan fokus latihan yang disesuaikan dengan tahap belajar siswa."/>
    <ProgramGrid/>
  </div></section>

  <section className="section experience-section"><div className="container experience-grid">
    <div className="experience-copy"><span className="eyebrow">Pengalaman Belajar</span><h2>Bukan sekadar banyak materi. Yang penting, siswa tahu arah belajarnya.</h2><p>Alur Nalarva dirancang sederhana: mengenali kemampuan, belajar sesuai kebutuhan, berlatih, lalu mengevaluasi hasil untuk menentukan fokus berikutnya.</p><Link href="/tryout" className="btn ghost">Coba Tryout Demo</Link></div>
    <div className="journey-list">
      <article><span>01</span><div><h3>Pemetaan awal</h3><p>Kenali posisi awal sebelum menentukan fokus belajar.</p></div></article>
      <article><span>02</span><div><h3>Belajar terarah</h3><p>Materi dan kelas disusun agar tidak terasa acak.</p></div></article>
      <article><span>03</span><div><h3>Latihan & tryout</h3><p>Bangun konsistensi dan kesiapan menghadapi ujian.</p></div></article>
      <article><span>04</span><div><h3>Evaluasi</h3><p>Lihat progres dan tentukan langkah berikutnya.</p></div></article>
    </div>
  </div></section>

  <section className="section dashboard-showcase"><div className="container showcase">
    <div className="showcase-copy"><span className="eyebrow">Dashboard Siswa</span><h2>Informasi penting, tanpa membuat siswa kewalahan.</h2><p>Jadwal, progres, tryout, materi, dan target belajar ditampilkan secara ringkas agar fokus tetap pada proses belajar.</p><ul className="showcase-list"><li>Ringkasan progres mingguan</li><li>Jadwal kelas berikutnya</li><li>Hasil dan analisis tryout</li><li>Akses materi dari satu tempat</li></ul><Link className="btn soft" href="/dashboard/siswa">Lihat Demo Dashboard</Link></div>
    <div className="premium-panel">
      <div className="premium-panel-top"><div><small>Ringkasan belajar</small><h4>Selamat sore, Anisa</h4></div><span className="pill">TKA SMA</span></div>
      <div className="premium-metrics"><article><span>Progress</span><b>72%</b><small>minggu ini</small></article><article><span>Tryout</span><b>84</b><small>skor terakhir</small></article><article><span>Target</span><b>5/7</b><small>selesai</small></article></div>
      <div className="premium-progress"><div className="progress-title"><span>Fokus belajar</span><b>71%</b></div><div className="progress"><i style={{width:"71%"}}/></div><div className="topic-row"><span>Literasi Bahasa Indonesia</span><b>86%</b></div><div className="progress thin"><i style={{width:"86%"}}/></div><div className="topic-row"><span>Numerasi Matematika</span><b>68%</b></div><div className="progress thin"><i style={{width:"68%"}}/></div></div>
      <div className="next-session"><div><small>Kelas berikutnya</small><b>Matematika TKA</b><span>19.00 WIB · Live class</span></div><span className="session-arrow">→</span></div>
    </div>
  </div></section>

  <section className="section"><div className="container final-cta"><div><span className="eyebrow light">Mulai Bersama Nalarva</span><h2>Bangun kebiasaan belajar yang lebih terarah.</h2><p>Pilih program sesuai jenjang dan mulai persiapan TKA dengan alur yang lebih jelas.</p></div><div className="final-cta-actions"><Link className="btn white large" href="/daftar">Daftar Program</Link><Link className="btn outline-light large" href="/kontak">Tanya Program</Link></div></div></section>
</main><Footer/></>}
