"use client";
import {FormEvent,useEffect,useState} from "react";
import DashboardShell from "@/components/DashboardShell";
import {TUTOR_NAV} from "@/lib/dashboard-nav";
import {authedNalarva,fileToBase64,formatDate} from "@/lib/apps-script";
import {Empty,Message,PageHead,Panel,Status} from "@/components/dashboard/DashboardUI";
type Row=Record<string,any>;
export default function Page(){
 const [rows,setRows]=useState<Row[]>([]),[classes,setClasses]=useState<Row[]>([]),[msg,setMsg]=useState(""),[busy,setBusy]=useState(false);
 async function load(){const [a,b]=await Promise.all([authedNalarva<Row[]>("listMaterials"),authedNalarva<Row[]>("listClasses")]);setRows(a.data||[]);setClasses(b.data||[])}
 useEffect(()=>{void load()},[]);
 async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();const form=e.currentTarget;setBusy(true);setMsg("");try{const fd=new FormData(form),file=fd.get("file");if(!(file instanceof File)||!file.size)throw new Error("Pilih file materi.");const base64=await fileToBase64(file);const r=await authedNalarva("uploadMaterial",{classId:String(fd.get("classId")||""),title:String(fd.get("title")||""),description:String(fd.get("description")||""),type:String(fd.get("type")||"PDF"),fileName:file.name,mimeType:file.type||"application/octet-stream",base64});setMsg(r.message||"");if(r.ok){form.reset();await load()}}catch(err){setMsg(err instanceof Error?err.message:"Upload gagal.")}finally{setBusy(false)}}
 return <DashboardShell accessRole="TUTOR" role="Tutor" name="Raka Pratama" initials="RP" nav={TUTOR_NAV}><PageHead eyebrow="Materi" title="Materi pembelajaran" desc="Unggah PDF atau dokumen kecil langsung ke Google Drive Nalarva."/>
 <div className="ops-grid"><Panel eyebrow="UPLOAD" title="Tambah materi"><form className="dash-form" onSubmit={submit}><label>Kelas<select name="classId" required><option value="">Pilih kelas</option>{classes.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label>Judul materi<input name="title" required/></label><label>Tipe<select name="type"><option>PDF</option><option>DOC</option><option>SLIDE</option><option>WORKSHEET</option></select></label><label>Deskripsi<textarea name="description"/></label><label>File maksimal 4 MB<input name="file" type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png" required/></label><button className="btn primary wide" disabled={busy}>{busy?"Mengunggah...":"Upload & publikasikan"}</button>{msg&&<Message text={msg}/>}</form></Panel>
 <Panel eyebrow="TERBIT" title={`${rows.length} materi`}>{rows.length===0?<Empty/>:<div className="mini-list">{rows.map(r=><div key={r.id}><span><b>{r.title}</b><small>{r.class_name} · {formatDate(r.published_at,true)}</small></span>{r.drive_url&&r.drive_url!=="#"?<a href={r.drive_url} target="_blank" rel="noreferrer">Buka →</a>:<Status value={r.status}/>}</div>)}</div>}</Panel></div></DashboardShell>
}
