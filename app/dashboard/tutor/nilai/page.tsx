"use client";
import {FormEvent,useEffect,useState} from "react";
import DashboardShell from "@/components/DashboardShell";
import {TUTOR_NAV} from "@/lib/dashboard-nav";
import {authedNalarva,formatDate} from "@/lib/apps-script";
import {Empty,Message,PageHead,Panel,Status} from "@/components/dashboard/DashboardUI";
type Row=Record<string,any>;
export default function Page(){
 const [rows,setRows]=useState<Row[]>([]),[selected,setSelected]=useState<Row|null>(null),[msg,setMsg]=useState("");
 async function load(){const r=await authedNalarva<Row[]>("listSubmissions");setRows(r.data||[])}useEffect(()=>{void load()},[]);
 async function grade(e:FormEvent<HTMLFormElement>){e.preventDefault();if(!selected)return;const r=await authedNalarva("gradeSubmission",{submissionId:selected.id,...Object.fromEntries(new FormData(e.currentTarget).entries())});setMsg(r.message||"");if(r.ok){setSelected(null);await load()}}
 return <DashboardShell accessRole="TUTOR" role="Tutor" name="Raka Pratama" initials="RP" nav={TUTOR_NAV}><PageHead eyebrow="Penilaian" title="Nilai tugas" desc="Periksa submission siswa, beri skor dan feedback."/><div className="ops-grid"><Panel eyebrow="SUBMISSION" title={`${rows.length} pengumpulan`}>{rows.length===0?<Empty/>:<div className="mini-list">{rows.map(r=><div key={r.id}><span><b>{r.student_name}</b><small>{r.assignment_title} · {formatDate(r.submitted_at,true)}</small></span><button className="text-button" onClick={()=>setSelected(r)}>{r.status==="GRADED"?"Edit nilai":"Nilai"} →</button></div>)}</div>}</Panel><Panel eyebrow="PENILAIAN" title={selected?selected.student_name:"Pilih submission"}>{selected?<form className="dash-form" onSubmit={grade}><p className="form-context">{selected.assignment_title}</p>{selected.drive_url&&<a className="btn secondary wide" href={selected.drive_url} target="_blank" rel="noreferrer">Buka file siswa</a>}<label>Skor<input name="score" type="number" min="0" max="100" defaultValue={selected.score||""} required/></label><label>Feedback<textarea name="feedback" defaultValue={selected.feedback||""}/></label><button className="btn primary wide">Simpan nilai</button>{msg&&<Message text={msg}/>}</form>:<Empty text="Klik tombol Nilai pada salah satu submission."/>}</Panel></div></DashboardShell>
}
