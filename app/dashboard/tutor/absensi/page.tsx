"use client";
import {useEffect,useState} from "react";
import DashboardShell from "@/components/DashboardShell";
import {TUTOR_NAV} from "@/lib/dashboard-nav";
import {authedNalarva,formatDate} from "@/lib/apps-script";
import {Empty,Message,PageHead,Panel} from "@/components/dashboard/DashboardUI";
type Row=Record<string,any>;
export default function Page(){
 const [schedules,setSchedules]=useState<Row[]>([]),[students,setStudents]=useState<Row[]>([]),[scheduleId,setScheduleId]=useState(""),[msg,setMsg]=useState("");
 useEffect(()=>{authedNalarva<Row[]>("listSchedules").then(r=>setSchedules(r.data||[]))},[]);
 async function choose(id:string){setScheduleId(id);const s=schedules.find(x=>x.id===id);if(!s){setStudents([]);return}const r=await authedNalarva<Row[]>("listClassStudents",{classId:s.class_id});setStudents(r.data||[])}
 async function mark(userId:string,status:string){const r=await authedNalarva("recordAttendance",{scheduleId,studentUserId:userId,status});setMsg(r.message||"")}
 return <DashboardShell accessRole="TUTOR" role="Tutor" name="Raka Pratama" initials="RP" nav={TUTOR_NAV}><PageHead eyebrow="Absensi" title="Kehadiran kelas" desc="Pilih jadwal lalu tandai kehadiran setiap siswa."/><Panel eyebrow="PERTEMUAN" title="Pilih jadwal"><div className="field-row"><select value={scheduleId} onChange={e=>void choose(e.target.value)}><option value="">Pilih jadwal</option>{schedules.map(s=><option key={s.id} value={s.id}>{formatDate(s.start_at,true)} · {s.title}</option>)}</select></div>{msg&&<Message text={msg}/>}<div className="attendance-list">{students.map(s=><div key={s.id}><span><b>{s.name}</b><small>{s.student_no} · {s.school}</small></span><div><button onClick={()=>void mark(s.id,"HADIR")}>Hadir</button><button onClick={()=>void mark(s.id,"IZIN")}>Izin</button><button onClick={()=>void mark(s.id,"ALPHA")}>Alpha</button></div></div>)}</div>{scheduleId&&students.length===0&&<Empty text="Belum ada siswa pada kelas ini."/>}</Panel></DashboardShell>
}
