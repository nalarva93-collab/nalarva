"use client";
import {FormEvent,useEffect,useState} from "react";
import DashboardShell from "@/components/DashboardShell";
import {ADMIN_NAV} from "@/lib/dashboard-nav";
import {authedNalarva} from "@/lib/apps-script";
import {Empty,Loading,Message,PageHead,Panel,Status} from "@/components/dashboard/DashboardUI";
type Row=Record<string,any>;
export default function Page(){
  const [students,setStudents]=useState<Row[]>([]),[rows,setRows]=useState<Row[]>([]),[loading,setLoading]=useState(true),[msg,setMsg]=useState("");
  async function load(){
    setLoading(true);
    const [a,b]=await Promise.all([authedNalarva<Row[]>("adminListStudents"),authedNalarva<Row[]>("adminListGuardians")]);
    setStudents(a.data||[]);setRows(b.data||[]);setLoading(false);
  }
  useEffect(()=>{void load()},[]);
  async function create(e:FormEvent<HTMLFormElement>){
    e.preventDefault();const form=e.currentTarget;setMsg("");
    const r=await authedNalarva<Row>("adminCreateGuardian",Object.fromEntries(new FormData(form).entries()));
    setMsg((r.message||"")+(r.ok&&r.data?.temporaryPassword?` Password sementara: ${r.data.temporaryPassword}`:""));
    if(r.ok){form.reset();await load();}
  }
  async function reset(id:string){
    if(!confirm("Reset password akun orang tua/wali?"))return;
    const r=await authedNalarva<Row>("adminResetUserPassword",{userId:id});
    setMsg((r.message||"")+(r.data?.temporaryPassword?` ${r.data.temporaryPassword}`:""));
  }
  async function status(id:string,value:string){
    const r=await authedNalarva("adminUpdateUserStatus",{userId:id,status:value});setMsg(r.message||"");if(r.ok)await load();
  }
  return <DashboardShell accessRole="ADMIN" role="Administrator" name="Admin Nalarva" initials="AD" nav={ADMIN_NAV}>
    <PageHead eyebrow="Orang Tua / Wali" title="Akun pendamping siswa." desc="Buat akun orang tua/wali dan hubungkan hanya ke siswa yang memang menjadi tanggung jawabnya."/>
    {msg&&<Message text={msg}/>}
    <div className="ops-grid guardian-admin-grid">
      <Panel eyebrow="AKUN BARU" title="Hubungkan orang tua/wali">
        <form className="dash-form" onSubmit={create}>
          <label>Siswa<select name="studentUserId" required><option value="">Pilih siswa</option>{students.map(s=><option key={s.id} value={s.id}>{s.name} · {s.student_no} · {s.level}</option>)}</select></label>
          <label>Nama orang tua/wali<input name="name" required placeholder="Nama lengkap"/></label>
          <div className="form-two"><label>Email login<input type="email" name="email" required/></label><label>WhatsApp<input name="phone"/></label></div>
          <label>Hubungan<select name="relation"><option value="ORANG_TUA">Orang Tua</option><option value="AYAH">Ayah</option><option value="IBU">Ibu</option><option value="WALI">Wali</option><option value="LAINNYA">Lainnya</option></select></label>
          <button className="btn primary">Buat / hubungkan akun</button>
          <small className="form-context">Jika email orang tua sudah memiliki akun ORANG_TUA, akun yang sama dapat dihubungkan ke anak kedua tanpa membuat password baru.</small>
        </form>
      </Panel>
      <Panel eyebrow="PRINSIP AKSES" title="Privasi orang tua">
        <div className="profile-note"><b>Hanya anak yang ditautkan</b><p>Portal orang tua tidak dapat melihat data siswa lain.</p></div>
        <div className="profile-note"><b>Read-only akademik</b><p>Orang tua dapat melihat perkembangan tetapi tidak dapat mengubah nilai, absensi, atau hasil tryout.</p></div>
        <div className="profile-note"><b>Komunikasi terbatas</b><p>Pesan hanya dapat dikirim kepada tutor yang mengajar anaknya.</p></div>
      </Panel>
    </div>
    <Panel eyebrow="AKUN TERHUBUNG" title={`Orang tua / wali (${rows.length})`}>
      {loading?<Loading/>:rows.length===0?<Empty text="Belum ada akun orang tua/wali."/>:<div className="table-wrap"><table><thead><tr><th>Orang tua/wali</th><th>Anak</th><th>Hubungan</th><th>Kontak</th><th>Status</th><th>Aksi</th></tr></thead><tbody>
        {rows.map(r=><tr key={r.link_id}><td><b>{r.guardian_name}</b><br/><small>{r.guardian_email}</small></td><td>{r.student_name}<br/><small>{r.student_no} · {r.level}</small></td><td>{r.relation}</td><td>{r.phone||"—"}</td><td><Status value={r.guardian_status}/></td><td><div className="table-actions"><button onClick={()=>void reset(r.guardian_user_id)}>Reset password</button>{r.guardian_status==="ACTIVE"?<button onClick={()=>void status(r.guardian_user_id,"SUSPENDED")}>Suspend</button>:<button onClick={()=>void status(r.guardian_user_id,"ACTIVE")}>Aktifkan</button>}</div></td></tr>)}
      </tbody></table></div>}
    </Panel>
  </DashboardShell>
}