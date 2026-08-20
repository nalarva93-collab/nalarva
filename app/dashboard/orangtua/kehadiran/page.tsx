"use client";
import {useEffect,useState} from "react";
import DashboardShell from "@/components/DashboardShell";
import ParentChildSelector,{ParentChild} from "@/components/dashboard/ParentChildSelector";
import {PARENT_NAV} from "@/lib/dashboard-nav";
import {authedNalarva,formatDate,getStoredSession} from "@/lib/apps-script";
import {Empty,Loading,PageHead,Panel,Status} from "@/components/dashboard/DashboardUI";
type Row=Record<string,any>;
export default function Page(){
 const [children,setChildren]=useState<ParentChild[]>([]),[childId,setChildId]=useState(""),[rows,setRows]=useState<Row[]|null>(null),[name,setName]=useState("Orang Tua Nalarva");
 useEffect(()=>{setName(getStoredSession()?.user?.name||"Orang Tua Nalarva");authedNalarva<ParentChild[]>("parentChildren").then(r=>{const c=r.data||[];setChildren(c);if(c[0])setChildId(c[0].id)})},[]);
 useEffect(()=>{if(childId){setRows(null);authedNalarva<Row[]>("parentAttendance",{studentUserId:childId}).then(r=>setRows(r.data||[]))}},[childId]);
 const hadir=(rows||[]).filter(x=>x.status==="HADIR").length,total=(rows||[]).length,rate=total?Math.round(hadir/total*100):0;
 return <DashboardShell accessRole="ORANG_TUA" role="Orang Tua / Wali" name={name} initials="OT" nav={PARENT_NAV}><PageHead eyebrow="Kehadiran" title="Rekap kehadiran anak." desc="Riwayat kehadiran yang dicatat oleh tutor pada setiap pertemuan."/><ParentChildSelector children={children} value={childId} onChange={setChildId}/>
  {rows===null?<Loading/>:<><div className="parent-summary-strip"><div><span>Kehadiran</span><b>{rate}%</b></div><div><span>Hadir</span><b>{hadir}</b></div><div><span>Izin</span><b>{rows.filter(x=>x.status==="IZIN").length}</b></div><div><span>Alpha</span><b>{rows.filter(x=>x.status==="ALPHA").length}</b></div></div>
  <Panel eyebrow="RIWAYAT" title={`${total} catatan kehadiran`}>{!total?<Empty text="Belum ada catatan kehadiran."/>:<div className="table-wrap"><table><thead><tr><th>Tanggal</th><th>Kelas</th><th>Pertemuan</th><th>Status</th><th>Catatan</th></tr></thead><tbody>{rows.map(r=><tr key={r.id}><td>{formatDate(r.start_at,true)}</td><td>{r.class_name||"—"}</td><td>{r.schedule_title||"—"}</td><td><Status value={r.status}/></td><td>{r.notes||"—"}</td></tr>)}</tbody></table></div>}</Panel></>}
 </DashboardShell>
}