"use client";
import {FormEvent,useEffect,useState} from "react";
import DashboardShell from "@/components/DashboardShell";
import {STUDENT_NAV} from "@/lib/dashboard-nav";
import {authedNalarva,fileToBase64,formatDate} from "@/lib/apps-script";
import {Empty,Message,PageHead,Panel,Status} from "@/components/dashboard/DashboardUI";
type Row=Record<string,any>;
export default function Page(){
 const [rows,setRows]=useState<Row[]>([]),[selected,setSelected]=useState<Row|null>(null),[msg,setMsg]=useState(""),[busy,setBusy]=useState(false);
 async function load(){const r=await authedNalarva<Row[]>("listAssignments");setRows(r.data||[])}useEffect(()=>{void load()},[]);
 async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();if(!selected)return;setBusy(true);setMsg("");try{const fd=new FormData(e.currentTarget),file=fd.get("file");if(!(file instanceof File)||!file.size)throw new Error("Pilih file jawaban.");const base64=await fileToBase64(file);const r=await authedNalarva("submitAssignment",{assignmentId:selected.id,fileName:file.name,mimeType:file.type||"application/octet-stream",base64});setMsg(r.message||"");if(r.ok){setSelected(null);await load()}}catch(err){setMsg(err instanceof Error?err.message:"Pengumpulan gagal.")}finally{setBusy(false)}}
 return <DashboardShell accessRole="SISWA" role="Siswa · TKA" name="Anisa" initials="AN" nav={STUDENT_NAV}><PageHead eyebrow="Tugas" title="Tugas saya" desc="Kerjakan tugas dan unggah jawaban sebelum batas pengumpulan."/><div className="ops-grid"><Panel eyebrow="DAFTAR TUGAS" title={`${rows.length} tugas`}>{rows.length===0?<Empty/>:<div className="assignment-list">{rows.map(r=><button className={selected?.id===r.id?"assignment-row active":"assignment-row"} key={r.id} onClick={()=>setSelected(r)}><span><b>{r.title}</b><small>{r.class_name} · Deadline {formatDate(r.due_at,true)}</small></span><span><Status value={r.submission_status||r.status}/>{r.score!==""&&r.score!=null?<em>Nilai {r.score}</em>:null}</span></button>)}</div>}</Panel><Panel eyebrow="PENGUMPULAN" title={selected?selected.title:"Pilih tugas"}>{selected?<form className="dash-form" onSubmit={submit}><p className="form-context">{selected.description}</p><label>File jawaban maksimal 4 MB<input name="file" type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" required/></label><button className="btn primary wide" disabled={busy}>{busy?"Mengunggah...":"Kumpulkan tugas"}</button>{msg&&<Message text={msg}/>}</form>:<Empty text="Pilih tugas di sebelah kiri untuk melihat instruksi."/>}</Panel></div></DashboardShell>
}
