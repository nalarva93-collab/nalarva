"use client";
import {useEffect,useState} from "react";
import DashboardShell from "@/components/DashboardShell";
import {STUDENT_NAV} from "@/lib/dashboard-nav";
import {authedNalarva} from "@/lib/apps-script";
import {Empty,PageHead,Panel} from "@/components/dashboard/DashboardUI";
type Row=Record<string,any>;
export default function Page(){const [rows,setRows]=useState<Row[]>([]);useEffect(()=>{authedNalarva<Row[]>("getRanking").then(r=>setRows(r.data||[]))},[]);return <DashboardShell accessRole="SISWA" role="Siswa · TKA" name="Anisa" initials="AN" nav={STUDENT_NAV}><PageHead eyebrow="Ranking" title="Papan peringkat" desc="Ranking digunakan sebagai motivasi, bukan satu-satunya ukuran keberhasilan."/><Panel eyebrow="TRYOUT TERBARU" title="Top peserta">{rows.length===0?<Empty/>:<div className="ranking-table">{rows.map(r=><div className={r.is_me?"ranking-row me":"ranking-row"} key={`${r.rank}-${r.name}`}><b>#{r.rank}</b><span>{r.name}{r.is_me&&<small>Kamu</small>}</span><strong>{r.score}</strong></div>)}</div>}</Panel></DashboardShell>}
