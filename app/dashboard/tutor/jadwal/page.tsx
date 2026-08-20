"use client";
import {useEffect,useState} from "react";
import DashboardShell from "@/components/DashboardShell";
import {TUTOR_NAV} from "@/lib/dashboard-nav";
import {authedNalarva,formatDate} from "@/lib/apps-script";
import {Empty,PageHead,Panel,Status} from "@/components/dashboard/DashboardUI";
type Row=Record<string,any>;
export default function Page(){const [rows,setRows]=useState<Row[]>([]);useEffect(()=>{authedNalarva<Row[]>("listSchedules").then(r=>setRows(r.data||[]))},[]);return <DashboardShell accessRole="TUTOR" role="Tutor" name="Raka Pratama" initials="RP" nav={TUTOR_NAV}><PageHead eyebrow="Jadwal" title="Jadwal mengajar" desc="Pertemuan live yang terkait dengan kelas Anda."/><Panel eyebrow="PERTEMUAN" title={`${rows.length} jadwal`}>{rows.length===0?<Empty/>:<div>{rows.map(r=><div className="schedule schedule-large" key={r.id}><time>{formatDate(r.start_at,true)}</time><div><b>{r.title}</b><span>{r.class_name} · {r.notes||"Tanpa catatan"}</span></div>{r.meeting_url?<a className="btn secondary small" href={r.meeting_url} target="_blank" rel="noreferrer">Buka kelas</a>:<Status value={r.status}/>}</div>)}</div>}</Panel></DashboardShell>}
