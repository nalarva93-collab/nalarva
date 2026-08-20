"use client";
import {useEffect,useState} from "react";
import DashboardShell from "@/components/DashboardShell";
import {STUDENT_NAV} from "@/lib/dashboard-nav";
import {authedNalarva,formatDate} from "@/lib/apps-script";
import {Empty,PageHead,Panel} from "@/components/dashboard/DashboardUI";
type Row=Record<string,any>;
export default function Page(){
 const [rows,setRows]=useState<Row[]>([]);useEffect(()=>{authedNalarva<Row[]>("listResults").then(r=>setRows(r.data||[]))},[]);
 function analysis(raw:any){try{return typeof raw==="string"?JSON.parse(raw):raw||{}}catch{return {}}}
 return <DashboardShell accessRole="SISWA" role="Siswa · TKA" name="Anisa" initials="AN" nav={STUDENT_NAV}><PageHead eyebrow="Analisis" title="Perkembangan tryout" desc="Gunakan hasil ini untuk menentukan fokus belajar berikutnya."/>
 {rows.length===0?<Panel title="Belum ada hasil"><Empty text="Selesaikan tryout pertama untuk melihat analisis."/></Panel>:rows.map(r=><div className="analysis-card" key={r.id}><div className="analysis-score"><span>{r.exam_title}</span><b>{r.score}</b><small>{formatDate(r.published_at,true)} · Rank #{r.rank||"—"} · Percentile {r.percentile||"—"}</small></div><div className="analysis-topics">{Object.entries(analysis(r.analysis_json)).map(([topic,v]:[string,any])=><div key={topic}><div><span>{topic}</span><b>{v.accuracy}%</b></div><div className="progress"><i style={{width:`${v.accuracy}%`}}/></div><small>{v.correct}/{v.total} benar</small></div>)}</div></div>)}
 </DashboardShell>
}
