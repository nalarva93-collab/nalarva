"use client";
import {useEffect,useState} from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import Link from "next/link";
import {submitToNalarva} from "@/lib/apps-script";

type PackageRow={
  id:string;code:string;name:string;program_name?:string;billing_period?:string;
  price?:number|string;class_sessions?:number|string;tryout_quota?:number|string;duration_days?:number|string;
  description?:string;status?:string;
};

function rupiah(v:unknown){
  const n=Number(v||0);
  return new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(n);
}

export default function Page(){
  const [rows,setRows]=useState<PackageRow[]>([]);
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    submitToNalarva<PackageRow[]>("publicPackages").then(r=>{
      setRows(r.data||[]);
      setLoading(false);
    });
  },[]);

  return <><Header/>
    <PageHero eyebrow="Paket Belajar" title="Pilih paket yang sesuai kebutuhan belajar." desc="Harga dan paket yang tampil di sini dikelola langsung dari dashboard Admin Nalarva."/>
    <section className="section">
      <div className="container">
        {loading?<div className="public-empty">Memuat paket Nalarva...</div>:
        rows.length===0?
          <div className="public-empty commercial-empty">
            <span>PAKET NALARVA</span>
            <h2>Paket sedang disiapkan.</h2>
            <p>Admin belum mempublikasikan harga. Kamu tetap dapat mendaftarkan minat atau berkonsultasi terlebih dahulu.</p>
            <div><Link className="btn primary" href="/daftar">Daftar Minat</Link><Link className="btn ghost" href="/kontak">Konsultasi</Link></div>
          </div>
        :
          <div className="pricing">
            {rows.map((p,i)=><article className={i===1?"price-card featured":"price-card"} key={p.id}>
              <small>{p.program_name||"Program TKA"} · {p.billing_period||"Paket"}</small>
              <h3>{p.name}</h3>
              <div className="price">{rupiah(p.price)} <span>{String(p.billing_period||"").toUpperCase()==="BULANAN"?"/bulan":""}</span></div>
              {p.description&&<p className="package-desc">{p.description}</p>}
              <ul>
                {Number(p.class_sessions||0)>0&&<li>✓ {p.class_sessions} sesi kelas</li>}
                {Number(p.tryout_quota||0)>0&&<li>✓ {p.tryout_quota} tryout</li>}
                {Number(p.duration_days||0)>0&&<li>✓ Akses {p.duration_days} hari</li>}<li>✓ Dashboard siswa</li>
                <li>✓ Materi & evaluasi progres</li>
              </ul>
              <Link className={i===1?"btn primary wide":"btn ghost wide"} href="/daftar">Daftar Program</Link>
            </article>)}
          </div>}
      </div>
    </section>
    <Footer/>
  </>;
}
