"use client";
import {useEffect,useState} from "react";
import DashboardShell from "@/components/DashboardShell";
import {STUDENT_NAV} from "@/lib/dashboard-nav";
import {authedNalarva,formatDate} from "@/lib/apps-script";
import {Empty,PageHead,Panel} from "@/components/dashboard/DashboardUI";
type Row=Record<string,any>;
export default function Page(){const [rows,setRows]=useState<Row[]>([]);useEffect(()=>{authedNalarva<Row[]>("listMaterials").then(r=>setRows(r.data||[]))},[]);return <DashboardShell accessRole="SISWA" role="Siswa · TKA" name="Anisa" initials="AN" nav={STUDENT_NAV}><PageHead eyebrow="Materi" title="Perpustakaan belajar" desc="Materi yang dipublikasikan untuk kelasmu tersusun di sini."/><div className="resource-grid">{rows.map(r=><article className="material-card" key={r.id}><div className="material-icon">{r.type||"DOC"}</div><div><small>{r.class_name}</small><h3>{r.title}</h3><p>{r.description||"Materi pembelajaran Nalarva."}</p><span>{formatDate(r.published_at,true)}</span></div>{r.drive_url&&r.drive_url!=="#"?<a className="btn secondary wide" href={r.drive_url} target="_blank" rel="noreferrer">Buka materi</a>:<button className="btn secondary wide" disabled>Materi demo</button>}</article>)}</div>{rows.length===0&&<Panel title="Materi belum tersedia"><Empty text="Tutor belum mempublikasikan materi untuk kelasmu."/></Panel>}</DashboardShell>}
