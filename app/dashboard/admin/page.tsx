"use client";
import {useEffect,useState} from "react";
import DashboardShell from "@/components/DashboardShell";
import {ADMIN_NAV} from "@/lib/dashboard-nav";
import {authedNalarva,formatDate} from "@/lib/apps-script";
import {Empty,Loading,Status} from "@/components/dashboard/DashboardUI";
type Overview={students:number;tutors:number;classes:number;exams:number;registrations:number;recentRegistrations:any[];upcomingSchedules:any[]};
export default function Page(){
 const [data,setData]=useState<Overview|null>(null);
 useEffect(()=>{authedNalarva<Overview>("adminOverview").then(r=>setData(r.data||null))},[]);
 return <DashboardShell accessRole="ADMIN" role="Administrator" name="Admin Nalarva" initials="AD" nav={ADMIN_NAV}>
  <div className="dash-welcome"><div><small>Admin Nalarva</small><h1>Ringkasan operasional</h1><p>Data di halaman ini dibaca langsung dari backend Nalarva.</p></div><a className="btn primary" href="/dashboard/admin/kelas">+ Buat Kelas</a></div>
  {!data?<Loading text="Memuat ringkasan..."/>:<><div className="stats"><div className="stat"><span>Siswa aktif</span><b>{data.students}</b><small>Akun siswa aktif</small></div><div className="stat"><span>Tutor aktif</span><b>{data.tutors}</b><small>Akun tutor aktif</small></div><div className="stat"><span>Kelas aktif</span><b>{data.classes}</b><small>Kelas berjalan</small></div><div className="stat"><span>Tryout aktif</span><b>{data.exams}</b><small>{data.registrations} pendaftaran baru</small></div></div>
  <div className="dash-grid"><section className="dash-card"><div className="card-head"><div><span>JADWAL</span><h3>Pertemuan mendatang</h3></div></div>{data.upcomingSchedules.length?data.upcomingSchedules.map(s=><div className="schedule" key={s.id}><time>{formatDate(s.start_at,true)}</time><div><b>{s.title}</b><span>{s.class_name}</span></div><Status value={s.status}/></div>):<Empty text="Belum ada jadwal mendatang."/>}</section><section className="dash-card"><div className="card-head"><div><span>PENDAFTARAN</span><h3>Calon siswa terbaru</h3></div></div>{data.recentRegistrations.length?<div className="mini-list">{data.recentRegistrations.map(r=><div key={r.id}><span><b>{r.name}</b><small>{r.level} · {formatDate(r.created_at)}</small></span><Status value={r.status}/></div>)}</div>:<Empty text="Belum ada pendaftaran baru."/>}<a className="btn soft wide" href="/dashboard/admin/laporan">Buka laporan</a></section></div></>}
 </DashboardShell>
}
