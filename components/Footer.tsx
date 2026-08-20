import Link from "next/link";
import Image from "next/image";
export default function Footer(){return <footer className="footer">
  <div className="container footer-top">
    <div className="footer-brand-block">
      <Image src="/logo-horizontal.png" alt="Nalarva" width={360} height={80}/>
      <p>Persiapan TKA yang tertata, modern, dan mudah dipantau untuk siswa SD, SMP, dan SMA.</p>
    </div>
    <div className="footer-grid">
      <div><b>Program</b><Link href="/program/tka-sd">TKA SD</Link><Link href="/program/tka-smp">TKA SMP</Link><Link href="/program/tka-sma">TKA SMA</Link></div>
      <div><b>Nalarva</b><Link href="/tentang">Tentang</Link><Link href="/paket">Paket</Link><Link href="/faq">FAQ</Link></div>
      <div><b>Hubungi</b><Link href="/kontak">Kontak</Link><Link href="/daftar">Pendaftaran</Link><Link href="/pembayaran">Cek Pembayaran</Link><Link href="/login">Masuk</Link></div>
    </div>
  </div>
  <div className="container footer-bottom"><span>© 2026 Nalarva</span><span>Persiapan TKA · SD · SMP · SMA</span></div>
</footer>}
