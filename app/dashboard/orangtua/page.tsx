"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
import DashboardShell from "@/components/DashboardShell";
import ParentChildSelector,{ParentChild} from "@/components/dashboard/ParentChildSelector";
import {PARENT_NAV} from "@/lib/dashboard-nav";
import {authedNalarva,formatDate,getStoredSession} from "@/lib/apps-script";
import {Empty,Loading,PageHead,Panel,Status} from "@/components/dashboard/DashboardUI";
type Row=Record<string,any>;
export default function Page(){
  const [children,setChildren]=useState<ParentChild[]>([]),[childId,setChildId]=useState(""),[data,setData]=useState<Row|null>(null),[name,setName]=useState("Orang Tua Nalarva");
  useEffect(()=>{setName(getStoredSession()?.user?.name||"Orang Tua Nalarva");authedNalarva<ParentChild[]>("parentChildren").then(r=>{const c=r.data||[];setChildren(c);if(c[0])setChildId(c[0].id)})},[]);
  useEffect(()=>{if(childId)authedNalarva<Row>("parentOverview",{studentUserId:childId}).then(r=>setData(r.data||null))},[childId]);
  return <DashboardShell accessRole="ORANG_TUA" role="Orang Tua / Wali" name={name} initials="OT" nav={PARENT_NAV}>
    <PageHead eyebrow="Portal Orang Tua" title="Pantau proses belajar anak dengan jelas." desc="Kehadiran, tugas, tryout, jadwal, dan status paket dalam satu ringkasan."/>
    <ParentChildSelector children={children} value={childId} onChange={v=>{setChildId(v);setData(null)}}/>
    {!childId?<Empty text="Akun ini belum terhubung dengan siswa."/>:!data?<Loading/>:<>
      <div className="parent-child-hero"><div><small>SISWA</small><h2>{data.student?.name}</h2><p>{data.student?.student_no} · {data.student?.level} · {data.student?.school||"Sekolah belum diisi"}</p></div><div><span>Program</span><b>{data.student?.program_name||"—"}</b><Status value={data.subscription?.active?"AKTIF":"TIDAK AKTIF"}/></div></div>
      <div className="stats parent-stats">
        <div className="stat"><span>Kehadiran</span><b>{data.attendanceRate??0}%</b><small>{data.attendanceCount??0} catatan pertemuan</small></div>
        <div className="stat"><span>Rata-rata tryout</span><b>{data.averageExamScore==null?"—":Math.round(data.averageExamScore)}</b><small>{data.examCount??0} hasil</small></div>
        <div className="stat"><span>Tugas selesai</span><b>{data.assignmentProgress??0}%</b><small>{data.pendingAssignments??0} masih perlu diselesaikan</small></div>
        <div className="stat"><span>Masa aktif</span><b>{data.subscription?.active?`${data.subscription.daysLeft??0} hari`:"—"}</b><small>{data.subscription?.packageName||"Belum aktif"}</small></div>
      </div>
      <div className="dash-grid">
        <Panel eyebrow="JADWAL" title="Agenda berikutnya">
          {!data.upcomingSchedules?.length?<Empty text="Belum ada jadwal mendatang."/>:<div className="mini-list">{data.upcomingSchedules.map((s:Row)=><div key={s.id}><span><b>{s.title}</b><small>{s.class_name} · {formatDate(s.start_at,true)}</small></span></div>)}</div>}
        </Panel>
        <Panel eyebrow="HASIL" title="Tryout terbaru">
          {!data.recentResults?.length?<Empty text="Belum ada hasil tryout."/>:<div className="mini-list">{data.recentResults.map((r:Row)=><div key={r.id}><span><b>{r.exam_title}</b><small>{formatDate(r.published_at)} · Rank #{r.rank||"—"}</small></span><strong>{Math.round(Number(r.score||0))}</strong></div>)}</div>}
        </Panel>
      </div>
      <div className="parent-quick-links"><Link href="/dashboard/orangtua/perkembangan">Lihat laporan perkembangan →</Link><Link href="/dashboard/orangtua/kehadiran">Lihat rekap kehadiran →</Link><Link href="/dashboard/orangtua/transkrip">Lihat transcript →</Link></div>
    </>}
  </DashboardShell>
}