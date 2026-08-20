"use client";
import Image from "next/image";
import Link from "next/link";
import {FormEvent, useState} from "react";
import {useRouter} from "next/navigation";
import {loginNalarva} from "@/lib/apps-script";

export default function Page(){
  const router=useRouter();
  const [busy,setBusy]=useState(false);
  const [msg,setMsg]=useState("");

  async function submit(e:FormEvent<HTMLFormElement>){
    e.preventDefault();
    setBusy(true);setMsg("");
    const fd=new FormData(e.currentTarget);
    const email=String(fd.get("email")||"");
    const password=String(fd.get("password")||"");
    const result=await loginNalarva(email,password);
    setBusy(false);
    if(!result.ok || !result.data){setMsg(result.message||"Login gagal.");return;}
    const role=result.data.user.role;
    router.push(role==="ADMIN"?"/dashboard/admin":role==="TUTOR"?"/dashboard/tutor":role==="ORANG_TUA"?"/dashboard/orangtua":"/dashboard/siswa");
  }

  return <div className="auth-page elegant-auth">
    <section className="auth-visual">
      <Link href="/" className="auth-logo"><Image src="/logo-horizontal.png" alt="Nalarva" width={360} height={80} loading="eager"/></Link>
      <div className="auth-copy"><span className="eyebrow light">Ruang Belajar Nalarva</span><h1>Belajar lebih fokus. Progres lebih mudah dipahami.</h1><p>Masuk untuk melihat kelas, materi, jadwal, tryout, dan perkembangan belajar dalam satu ruang yang tertata.</p></div>
      <div className="auth-quote"><span>“</span><p>Belajar yang baik bukan tentang menambah banyak hal, tetapi memahami apa yang perlu dilakukan berikutnya.</p></div>
    </section>
    <section className="auth-form-wrap"><div className="auth-box"><div className="auth-small-logo"><Image src="/icon.png" alt="Nalarva" width={44} height={44}/></div><span className="eyebrow">Selamat Datang</span><h2>Masuk ke Nalarva</h2><p>Gunakan akun Nalarva untuk mengakses ruang belajar.</p>
      <form onSubmit={submit}>
        <label>Email<input name="email" type="email" placeholder="nama@email.com" required autoComplete="email"/></label>
        <label>Password<input name="password" type="password" placeholder="••••••••" required autoComplete="current-password"/></label>
        <div className="auth-form-note"><span>Akun dikelola oleh Nalarva</span><Link href="/kontak">Butuh bantuan?</Link></div>
        <button className="btn primary wide large" disabled={busy}>{busy?"Memeriksa...":"Masuk"}</button>
        {msg&&<p className="form-message" style={{marginTop:12}}>{msg}</p>}
      </form>
      <div className="demo-links"><span>Tanpa backend, untuk demo gunakan email yang mengandung:</span><Link href="/dashboard/siswa">siswa</Link><Link href="/dashboard/tutor">tutor</Link><Link href="/dashboard/admin">admin</Link><Link href="/dashboard/orangtua">orangtua</Link></div>
      <Link className="back-home" href="/">← Kembali ke beranda</Link>
    </div></section>
  </div>
}
