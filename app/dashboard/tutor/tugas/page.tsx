"use client";
import {FormEvent,useEffect,useState} from "react";
import DashboardShell from "@/components/DashboardShell";
import {TUTOR_NAV} from "@/lib/dashboard-nav";
import {authedNalarva,formatDate} from "@/lib/apps-script";
import {Empty,Message,PageHead,Panel,Status} from "@/components/dashboard/DashboardUI";
type Row=Record<string,any>;
export default function Page(){
 const [rows,setRows]=useState<Row[]>([]),[classes,setClasses]=useState<Row[]>([]),[msg,setMsg]=useState(""),[busy,setBusy]=useState(false);
 async function load(){const [a,b]=await Promise.all([authedNalarva<Row[]>("listAssignments"),authedNalarva<Row[]>("listClasses")]);setRows(a.data||[]);setClasses(b.data||[])}
 useEffect(()=>{void load()},[]);
 async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();const form=e.currentTarget;setBusy(true);const r=await authedNalarva("createAssignment",Object.fromEntries(new FormData(form).entries()));setBusy(false);setMsg(r.message||"");if(r.ok){form.reset();await load()}}
 return <DashboardShell accessRole="TUTOR" role="Tutor" name="Raka Pratama" initials="RP" nav={TUTOR_NAV}><PageHead eyebrow="Tugas" title="Tugas siswa" desc="Buat tugas untuk kelas dan tentukan batas pengumpulan."/><div className="ops-grid"><Panel eyebrow="TUGAS BARU" title="Buat tugas"><form className="dash-form" onSubmit={submit}><label>Kelas<select name="classId" required><option value="">Pilih kelas</option>{classes.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label>Judul<input name="title" required/></label><label>Instruksi<textarea name="description" required/></label><label>Batas pengumpulan<input name="dueAt" type="datetime-local" required/></label><button className="btn primary wide" disabled={busy}>Publikasikan tugas</button>{msg&&<Message text={msg}/>}</form></Panel><Panel eyebrow="AKTIF" title={`${rows.length} tugas`}>{rows.length===0?<Empty/>:<div className="mini-list">{rows.map(r=><div key={r.id}><span><b>{r.title}</b><small>{r.class_name} · Deadline {formatDate(r.due_at,true)}</small></span><Status value={r.status}/></div>)}</div>}</Panel></div></DashboardShell>
}
