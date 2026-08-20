"use client";
import Link from "next/link";
export default function Error({reset}:{error:Error&{digest?:string};reset:()=>void}){
  return <div className="error-screen"><div className="error-card"><span>NALARVA</span><h1>Ada kendala saat membuka halaman.</h1><p>Data kamu tidak dihapus. Coba muat ulang halaman atau kembali ke dashboard.</p><div><button className="btn primary" onClick={()=>reset()}>Coba Lagi</button><Link className="btn ghost" href="/">Halaman Utama</Link></div></div></div>;
}