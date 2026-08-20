"use client";
import {useEffect,useState} from "react";
import DashboardShell from "@/components/DashboardShell";
import {STUDENT_NAV} from "@/lib/dashboard-nav";
import {authedNalarva,formatDate} from "@/lib/apps-script";
import {Empty,PageHead,Panel,Status} from "@/components/dashboard/DashboardUI";
type Row=Record<string,any>;
export default function Page(){
 const [classes,setClasses]=useState<Row[]>([]),[schedules,setSchedules]=useState<Row[]>([]);
 useEffect(()=>{Promise.all([authedNalarva<Row[]>("listClasses"),authedNalarva<Row[]>("listSchedules")]).then(([a,b])=>{setClasses(a.data||[]);setSchedules(b.data||[])})},[]);
 return <DashboardShell accessRole="SISWA" role="Siswa · TKA" name="Anisa" initials="AN" nav={STUDENT_NAV}><PageHead eyebrow="Kelas Saya" title="Kelas & jadwal" desc="Lihat kelas yang kamu ikuti dan pertemuan live berikutnya."/><div className="dash-grid"><Panel eyebrow="KELAS" title={`${classes.length} kelas`}>{classes.length===0?<Empty/>:<div className="mini-list">{classes.map(c=><div key={c.id}><span><b>{c.name}</b><small>{c.program_name} · Tutor {c.tutor_name||"Nalarva"}</small></span><Status value={c.status}/></div>)}</div>}</Panel><Panel eyebrow="JADWAL" title="Pertemuan berikutnya">{schedules.length===0?<Empty/>:<div>{schedules.map(s=><div className="schedule" key={s.id}><time>{formatDate(s.start_at,true)}</time><div><b>{s.title}</b><span>{s.class_name}</span></div>{s.meeting_url?<a className="btn secondary small" href={s.meeting_url} target="_blank" rel="noreferrer">Masuk</a>:<Status value={s.status}/>}</div>)}</div>}</Panel></div></DashboardShell>
}
