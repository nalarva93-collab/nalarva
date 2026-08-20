"use client";
import {useEffect,useState} from "react";
import DashboardShell from "@/components/DashboardShell";
import ParentChildSelector,{ParentChild} from "@/components/dashboard/ParentChildSelector";
import {PARENT_NAV} from "@/lib/dashboard-nav";
import {authedNalarva,formatDate,getStoredSession} from "@/lib/apps-script";
import {Empty,Loading,PageHead,Status} from "@/components/dashboard/DashboardUI";
type Row=Record<string,any>;
export default function Page(){
 const [children,setChildren]=useState<ParentChild[]>([]),[childId,setChildId]=useState(""),[data,setData]=useState<Row|null>(null),[name,setName]=useState("Orang Tua Nalarva");
 useEffect(()=>{setName(getStoredSession()?.user?.name||"Orang Tua Nalarva");authedNalarva<ParentChild[]>("parentChildren").then(r=>{const c=r.data||[];setChildren(c);if(c[0])setChildId(c[0].id)})},[]);
 useEffect(()=>{if(childId){setData(null);authedNalarva<Row>("parentProgressReport",{studentUserId:childId}).then(r=>setData(r.data||null))}},[childId]);
 return <DashboardShell accessRole="ORANG_TUA" role="Orang Tua / Wali" name={name} initials="OT" nav={PARENT_NAV}><PageHead eyebrow="Perkembangan" title="Laporan perkembangan belajar." desc="Ringkasan akademik yang dapat dicetak untuk dokumentasi orang tua." action={data?<button className="btn primary" onClick={()=>window.print()}>Cetak laporan</button>:undefined}/><ParentChildSelector children={children} value={childId} onChange={setChildId}/>
 {!data?<Loading/>:<article className="parent-report-sheet" id="parent-report-print">
   <div className="parent-report-head"><div><span>NALARVA</span><h2>Laporan Perkembangan Siswa</h2></div><div><small>Periode</small><b>{formatDate(data.periodStart)} – {formatDate(data.periodEnd)}</b></div></div>
   <div className="parent-report-student"><div><small>Nama siswa</small><b>{data.student.name}</b></div><div><small>Nomor siswa</small><b>{data.student.student_no}</b></div><div><small>Program</small><b>{data.student.program_name||"—"}</b></div><div><small>Sekolah</small><b>{data.student.school||"—"}</b></div></div>
   <div className="parent-report-metrics"><div><span>Kehadiran</span><b>{data.summary.attendanceRate}%</b></div><div><span>Tugas selesai</span><b>{data.summary.assignmentProgress}%</b></div><div><span>Rata-rata tugas</span><b>{data.summary.assignmentAverage??"—"}</b></div><div><span>Rata-rata tryout</span><b>{data.summary.examAverage??"—"}</b></div></div>
   <section><h3>Hasil Tryout</h3>{!data.results?.length?<Empty text="Belum ada hasil tryout."/>:<table><thead><tr><th>Tryout</th><th>Tanggal</th><th>Skor</th><th>Rank</th><th>Percentile</th></tr></thead><tbody>{data.results.map((r:Row)=><tr key={r.id}><td>{r.exam_title}</td><td>{formatDate(r.published_at)}</td><td><b>{r.score}</b></td><td>#{r.rank||"—"}</td><td>{r.percentile||"—"}</td></tr>)}</tbody></table>}</section>
   <section><h3>Tugas & Feedback</h3>{!data.assignments?.length?<Empty text="Belum ada tugas yang dinilai."/>:<table><thead><tr><th>Tugas</th><th>Kelas</th><th>Status</th><th>Nilai</th><th>Feedback</th></tr></thead><tbody>{data.assignments.map((a:Row)=><tr key={a.id}><td>{a.assignment_title}</td><td>{a.class_name}</td><td><Status value={a.status}/></td><td>{a.score===""?"—":a.score}</td><td>{a.feedback||"—"}</td></tr>)}</tbody></table>}</section>
   <div className="parent-report-note"><b>Catatan</b><p>Laporan ini merupakan ringkasan data yang tercatat di sistem Nalarva dan bukan dokumen nilai sekolah formal.</p></div>
 </article>}
 </DashboardShell>
}