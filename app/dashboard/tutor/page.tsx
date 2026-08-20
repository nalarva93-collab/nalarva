"use client";
import {useEffect,useState} from "react";
import DashboardShell from "@/components/DashboardShell";
import {TUTOR_NAV} from "@/lib/dashboard-nav";
import {authedNalarva,formatDate} from "@/lib/apps-script";
import {Empty,Loading,Status} from "@/components/dashboard/DashboardUI";
type Overview={classes:number;students:number;pendingSubmissions:number;averageScore:number|null;upcomingSchedules:any[]};
export default function Page(){
 const [data,setData]=useState<Overview|null>(null);useEffect(()=>{authedNalarva<Overview>("tutorOverview").then(r=>setData(r.data||null))},[]);
 return <DashboardShell accessRole="TUTOR" role="Tutor" name="Tutor Nalarva" initials="TN" nav={TUTOR_NAV}>
  <div className="dash-welcome"><div><small>Dashboard Tutor</small><h1>Ruang kerja tutor</h1><p>Kelas, siswa, submission, dan jadwal ditampilkan dari data operasional.</p></div><a className="btn primary" href="/dashboard/tutor/materi">+ Tambah Materi</a></div>
  {!data?<Loading text="Memuat ringkasan..."/>:<><div className="stats"><div className="stat"><span>Kelas aktif</span><b>{data.classes}</b><small>Kelas yang Anda ampu</small></div><div className="stat"><span>Total siswa</span><b>{data.students}</b><small>Siswa unik di kelas Anda</small></div><div className="stat"><span>Perlu dinilai</span><b>{data.pendingSubmissions}</b><small>Submission menunggu nilai</small></div><div className="stat"><span>Rata-rata nilai</span><b>{data.averageScore==null?"—":data.averageScore}</b><small>Dari tugas yang sudah dinilai</small></div></div><div className="dash-grid"><section className="dash-card"><div className="card-head"><div><span>BERIKUTNYA</span><h3>Jadwal mengajar</h3></div></div>{data.upcomingSchedules.length?data.upcomingSchedules.map(s=><div className="schedule" key={s.id}><time>{formatDate(s.start_at,true)}</time><div><b>{s.title}</b><span>{s.class_name}</span></div><Status value={s.status}/></div>):<Empty text="Belum ada jadwal mendatang."/>}</section><section className="dash-card"><div className="card-head"><div><span>AKSI</span><h3>Yang perlu dilakukan</h3></div></div><div className="quick-links"><a href="/dashboard/tutor/tugas">Buat tugas <b>→</b></a><a href="/dashboard/tutor/absensi">Isi absensi <b>→</b></a><a href="/dashboard/tutor/nilai">Nilai submission <b>→</b></a></div></section></div></>}
 </DashboardShell>
}
