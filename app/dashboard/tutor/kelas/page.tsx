"use client";
import {useEffect,useState} from "react";
import DashboardShell from "@/components/DashboardShell";
import {TUTOR_NAV} from "@/lib/dashboard-nav";
import {authedNalarva,formatDate} from "@/lib/apps-script";
import {Empty,PageHead,Panel,Status} from "@/components/dashboard/DashboardUI";
type Row=Record<string,any>;
export default function Page(){const [rows,setRows]=useState<Row[]>([]);useEffect(()=>{authedNalarva<Row[]>("listClasses").then(r=>setRows(r.data||[]))},[]);return <DashboardShell accessRole="TUTOR" role="Tutor" name="Raka Pratama" initials="RP" nav={TUTOR_NAV}><PageHead eyebrow="Kelas" title="Kelas saya" desc="Kelas yang ditugaskan kepada akun tutor ini."/><div className="card-grid">{rows.map(r=><article className="class-card" key={r.id}><div className="class-card-top"><span>{r.program_name||"Program TKA"}</span><Status value={r.status}/></div><h3>{r.name}</h3><p>{r.code} · Kapasitas {r.capacity||"—"} siswa</p><div className="class-meta"><span>Mulai <b>{formatDate(r.start_date)}</b></span><span>Selesai <b>{formatDate(r.end_date)}</b></span></div></article>)}</div>{rows.length===0&&<Panel title="Belum ada kelas"><Empty text="Admin belum menetapkan kelas untuk tutor ini."/></Panel>}</DashboardShell>}
