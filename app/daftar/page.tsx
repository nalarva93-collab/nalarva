import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import LeadForm from "@/components/LeadForm";
import Link from "next/link";
export default function Page(){
  return <><Header/>
    <PageHero eyebrow="Pendaftaran" title="Mulai perjalanan belajar bersama Nalarva." desc="Isi data calon siswa. Setelah data diterima, Admin Nalarva dapat membuat tagihan, mengonfirmasi pembayaran, lalu mengaktifkan akun belajar."/>
    <section className="section"><div className="container contact-grid">
      <div className="contact-card">
        <span className="kicker">Alur Pendaftaran</span>
        <h2>Sederhana dan transparan.</h2>
        <ol className="registration-steps">
          <li><b>1</b><span><strong>Daftar minat</strong><small>Isi data calon siswa.</small></span></li>
          <li><b>2</b><span><strong>Pilih paket</strong><small>Tim Nalarva mengonfirmasi program dan paket.</small></span></li>
          <li><b>3</b><span><strong>Pembayaran</strong><small>Pembayaran dikonfirmasi Admin.</small></span></li>
          <li><b>4</b><span><strong>Akun aktif</strong><small>Siswa menerima akses Nalarva.</small></span></li>
        </ol>
        <div className="registration-links"><Link className="text-link" href="/paket">Lihat paket belajar →</Link><Link className="text-link" href="/pembayaran">Sudah punya invoice? Cek pembayaran →</Link></div>
      </div>
      <LeadForm mode="register"/>
    </div></section>
    <Footer/>
  </>;
}