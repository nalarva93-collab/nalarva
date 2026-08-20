"use client";
import {FormEvent,useEffect,useState} from "react";
import DashboardShell from "@/components/DashboardShell";
import {STUDENT_NAV} from "@/lib/dashboard-nav";
import {authedNalarva,getStoredSession} from "@/lib/apps-script";
import {Loading,Message,PageHead,Panel} from "@/components/dashboard/DashboardUI";
type Row=Record<string,any>;

export default function Page(){
  const [data,setData]=useState<Row|null>(null);
  const [msg,setMsg]=useState("");
  const [name,setName]=useState("Siswa Nalarva");
  async function load(){const r=await authedNalarva<Row>("studentProfile");setData(r.data||null);}
  useEffect(()=>{setName(getStoredSession()?.user?.name||"Siswa Nalarva");void load()},[]);

  async function save(e:FormEvent<HTMLFormElement>){
    e.preventDefault();const form=e.currentTarget;
    const r=await authedNalarva("updateStudentProfile",Object.fromEntries(new FormData(form).entries()));
    setMsg(r.message||"");if(r.ok)await load();
  }
  return <DashboardShell accessRole="SISWA" role="Siswa · TKA" name={name} initials="SN" nav={STUDENT_NAV}>
    <PageHead eyebrow="Profil Saya" title="Data siswa & orang tua." desc="Pastikan informasi ini benar agar komunikasi dan administrasi belajar berjalan baik."/>
    {msg&&<Message text={msg}/>}
    {!data?<Loading/>:<div className="profile-layout">
      <Panel eyebrow="IDENTITAS" title="Data siswa">
        <form className="dash-form" onSubmit={save}>
          <div className="profile-id"><span>Nomor siswa</span><b>{data.student_no||"—"}</b></div>
          <div className="form-two"><label>Nama lengkap<input name="name" defaultValue={data.name||""} required/></label><label>Email<input value={data.email||""} disabled/></label></div>
          <div className="form-two"><label>Nomor HP siswa<input name="studentPhone" defaultValue={data.student_phone||""}/></label><label>Tanggal lahir<input type="date" name="birthDate" defaultValue={data.birth_date||""}/></label></div>
          <div className="form-two"><label>Jenjang<input value={data.level||""} disabled/></label><label>Kelas sekolah<input name="grade" defaultValue={data.grade||""} placeholder="Contoh: XI"/></label></div>
          <label>Sekolah<input name="school" defaultValue={data.school||""}/></label>
          <div className="form-two"><label>Kota/Kabupaten<input name="city" defaultValue={data.city||""}/></label><label>Program<input value={data.program_name||"—"} disabled/></label></div>
          <label>Alamat<textarea name="address" rows={3} defaultValue={data.address||""}/></label>

          <div className="profile-section-title"><span>ORANG TUA / WALI</span><h3>Kontak pendamping belajar</h3></div>
          <div className="form-two"><label>Nama orang tua/wali<input name="parentName" defaultValue={data.parent_name||""}/></label><label>Hubungan<select name="guardianRelation" defaultValue={data.guardian_relation||"ORANG_TUA"}><option value="ORANG_TUA">Orang Tua</option><option value="WALI">Wali</option><option value="KAKAK">Kakak</option><option value="LAINNYA">Lainnya</option></select></label></div>
          <div className="form-two"><label>WhatsApp orang tua/wali<input name="parentPhone" defaultValue={data.parent_phone||""}/></label><label>Email orang tua/wali<input type="email" name="parentEmail" defaultValue={data.parent_email||""}/></label></div>
          <button className="btn primary">Simpan profil</button>
        </form>
      </Panel>
      <Panel eyebrow="PRIVASI" title="Penggunaan data">
        <div className="profile-note"><b>Data profil</b><p>Digunakan untuk administrasi kelas, identifikasi siswa, komunikasi pembelajaran, dan kebutuhan operasional Nalarva.</p></div>
        <div className="profile-note"><b>Kontak orang tua/wali</b><p>Disiapkan sebagai kontak pendamping belajar. Sistem belum membuat akun orang tua terpisah.</p></div>
        <div className="profile-note"><b>Password</b><p>Perubahan password tetap dilakukan melalui menu Pengaturan dan tidak ditampilkan di halaman profil.</p></div>
      </Panel>
    </div>}
  </DashboardShell>
}