"use client";
import {useEffect,useState} from "react";
import DashboardShell from "@/components/DashboardShell";
import ParentChildSelector,{ParentChild} from "@/components/dashboard/ParentChildSelector";
import {PARENT_NAV} from "@/lib/dashboard-nav";
import {authedNalarva,formatDate,getStoredSession} from "@/lib/apps-script";
import {Empty,Loading,PageHead} from "@/components/dashboard/DashboardUI";
type Row=Record<string,any>;
export default function Page(){
 const [children,setChildren]=useState<ParentChild[]>([]),[childId,setChildId]=useState(""),[data,setData]=useState<Row|null>(null),[name,setName]=useState("Orang Tua Nalarva");
 useEffect(()=>{setName(getStoredSession()?.user?.name||"Orang Tua Nalarva");authedNalarva<ParentChild[]>("parentChildren").then(r=>{const c=r.data||[];setChildren(c);if(c[0])setChildId(c[0].id)})},[]);
 useEffect(()=>{if(childId){setData(null);authedNalarva<Row>("parentTranscript",{studentUserId:childId}).then(r=>setData(r.data||null))}},[childId]);
 return <DashboardShell accessRole="ORANG_TUA" role="Orang Tua / Wali" name={name} initials="OT" nav={PARENT_NAV}><PageHead eyebrow="Transcript" title="Rekap hasil belajar Nalarva." desc="Dokumen ringkasan hasil tryout dan tugas yang telah dinilai." action={data?<button className="btn primary" onClick={()=>window.print()}>Cetak transcript</button>:undefined}/><ParentChildSelector children={children} value={childId} onChange={setChildId}/>
 {!data?<Loading/>:<article className="transcript-sheet" id="transcript-print">
   <header><div><span>NALARVA</span><h2>Transcript Hasil Belajar</h2></div><div><small>Diterbitkan</small><b>{formatDate(data.generatedAt)}</b></div></header>
   <div className="transcript-student"><h3>{data.student.name}</h3><p>{data.student.student_no} · {data.student.program_name||data.student.level} · {data.student.school||"—"}</p></div>
   <section><h4>Tryout</h4>{!data.results?.length?<Empty text="Belum ada hasil tryout."/>:<table><thead><tr><th>Tryout</th><th>Tanggal</th><th>Skor</th><th>Rank</th><th>Percentile</th></tr></thead><tbody>{data.results.map((r:Row)=><tr key={r.id}><td>{r.exam_title}</td><td>{formatDate(r.published_at)}</td><td><b>{r.score}</b></td><td>#{r.rank||"—"}</td><td>{r.percentile||"—"}</td></tr>)}</tbody></table>}</section>
   <section><h4>Tugas</h4>{!data.assignments?.length?<Empty text="Belum ada tugas yang dinilai."/>:<table><thead><tr><th>Tugas</th><th>Kelas</th><th>Dikumpulkan</th><th>Nilai</th></tr></thead><tbody>{data.assignments.map((a:Row)=><tr key={a.id}><td>{a.assignment_title}</td><td>{a.class_name}</td><td>{formatDate(a.submitted_at)}</td><td><b>{a.score}</b></td></tr>)}</tbody></table>}</section>
   <footer><span>Dokumen internal Nalarva</span><span>{data.documentNo}</span></footer>
 </article>}
 </DashboardShell>
}