"use client";
import {FormEvent,useEffect,useState} from "react";
import Link from "next/link";
import DashboardShell from "@/components/DashboardShell";
import {authedNalarva,clearSession,getStoredSession} from "@/lib/apps-script";
import type {DashboardNavItem} from "@/lib/dashboard-nav";
import {Message,PageHead,Panel} from "@/components/dashboard/DashboardUI";

export default function AccountSettings({accessRole,role,nav}:{accessRole:"ADMIN"|"TUTOR"|"SISWA"|"ORANG_TUA";role:string;nav:DashboardNavItem[]}){
 const [session,setSession]=useState<ReturnType<typeof getStoredSession>>(null);
 const [busy,setBusy]=useState(false),[msg,setMsg]=useState(""),[done,setDone]=useState(false);
 useEffect(()=>setSession(getStoredSession()),[]);
 async function submit(e:FormEvent<HTMLFormElement>){
  e.preventDefault();const form=e.currentTarget;setBusy(true);setMsg("");
  const fd=new FormData(form),currentPassword=String(fd.get("currentPassword")||""),newPassword=String(fd.get("newPassword")||""),confirmPassword=String(fd.get("confirmPassword")||"");
  if(newPassword!==confirmPassword){setBusy(false);setMsg("Konfirmasi password baru tidak sama.");return}
  const r=await authedNalarva("changePassword",{currentPassword,newPassword});setBusy(false);setMsg(r.message||"");
  if(r.ok){form.reset();clearSession();setDone(true)}
 }
 return <DashboardShell accessRole={accessRole} role={role} name={session?.user?.name||"Pengguna Nalarva"} initials="NV" nav={nav}>
  <PageHead eyebrow="Akun" title="Pengaturan akun" desc="Kelola keamanan akun Nalarva Anda."/>
  <div className="ops-grid settings-grid">
   <Panel eyebrow="PROFIL" title="Informasi akun"><div className="profile-summary"><div className="profile-avatar">{(session?.user?.name||"NV").split(" ").map(x=>x[0]).join("").slice(0,2).toUpperCase()}</div><div><b>{session?.user?.name||"Pengguna Nalarva"}</b><span>{session?.user?.email||"—"}</span><small>{session?.user?.role||accessRole}</small></div></div><p className="form-context">Nama dan email akun dikelola oleh administrator. Hubungi admin bila ada data yang perlu diperbarui.</p></Panel>
   <Panel eyebrow="KEAMANAN" title="Ganti password">{done?<div className="security-success"><b>Password berhasil diubah.</b><p>Untuk keamanan, semua sesi lama sudah dikeluarkan. Silakan masuk kembali menggunakan password baru.</p><Link className="btn primary" href="/login">Masuk kembali</Link></div>:<form className="dash-form" onSubmit={submit}><label>Password saat ini<input name="currentPassword" type="password" required autoComplete="current-password"/></label><label>Password baru<input name="newPassword" type="password" minLength={10} required autoComplete="new-password"/><small>Minimal 10 karakter dan gunakan kombinasi huruf besar, huruf kecil, angka, serta simbol.</small></label><label>Ulangi password baru<input name="confirmPassword" type="password" minLength={10} required autoComplete="new-password"/></label><button className="btn primary wide" disabled={busy}>{busy?"Memperbarui...":"Ubah password"}</button>{msg&&<Message text={msg}/>}</form>}</Panel>
  </div>
 </DashboardShell>
}
