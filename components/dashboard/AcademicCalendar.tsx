"use client";
import {useEffect,useMemo,useState} from "react";
import {authedNalarva,formatDate} from "@/lib/apps-script";
import {Empty,Loading,PageHead,Panel,Status} from "@/components/dashboard/DashboardUI";

type Row=Record<string,any>;

export default function AcademicCalendar({canCreate=false}:{canCreate?:boolean}){
  const [rows,setRows]=useState<Row[]>([]);
  const [programs,setPrograms]=useState<Row[]>([]);
  const [classes,setClasses]=useState<Row[]>([]);
  const [loading,setLoading]=useState(true);
  const [msg,setMsg]=useState("");

  async function load(){
    setLoading(true);
    const [a,b,c]=await Promise.all([
      authedNalarva<Row[]>("listCalendarEvents"),
      authedNalarva<Row[]>("listPrograms"),
      authedNalarva<Row[]>("listClasses")
    ]);
    setRows(a.data||[]);setPrograms(b.data||[]);setClasses(c.data||[]);setLoading(false);
  }
  useEffect(()=>{void load()},[]);

  const upcoming=useMemo(()=>rows.filter(x=>new Date(String(x.end_at||x.start_at)).getTime()>=Date.now()).sort((a,b)=>String(a.start_at).localeCompare(String(b.start_at))),[rows]);
  const past=useMemo(()=>rows.filter(x=>new Date(String(x.end_at||x.start_at)).getTime()<Date.now()).sort((a,b)=>String(b.start_at).localeCompare(String(a.start_at))),[rows]);

  async function create(e:React.FormEvent<HTMLFormElement>){
    e.preventDefault();const form=e.currentTarget;setMsg("");
    const r=await authedNalarva("adminCreateCalendarEvent",Object.fromEntries(new FormData(form).entries()));
    setMsg(r.message||"");if(r.ok){form.reset();await load();}
  }

  return <>
    <PageHead eyebrow="Kalender Akademik" title="Agenda belajar dalam satu kalender." desc="Jadwal penting, tryout, kelas, deadline, dan agenda Nalarva."/>
    {msg&&<div className="op-message">{msg}</div>}
    {canCreate&&<Panel eyebrow="ADMIN" title="Tambah agenda kalender">
      <form className="dash-form" onSubmit={create}>
        <div className="form-two"><label>Judul<input name="title" required placeholder="Contoh: Tryout Nasional TKA"/></label><label>Jenis<select name="type"><option value="AKADEMIK">Akademik</option><option value="TRYOUT">Tryout</option><option value="KELAS">Kelas</option><option value="DEADLINE">Deadline</option><option value="LIBUR">Libur</option><option value="INFO">Informasi</option></select></label></div>
        <div className="form-two"><label>Mulai<input type="datetime-local" name="startAt" required/></label><label>Selesai<input type="datetime-local" name="endAt" required/></label></div>
        <div className="form-two"><label>Program<select name="programId"><option value="">Semua program</option>{programs.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label><label>Kelas<select name="classId"><option value="">Semua kelas</option>{classes.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label></div>
        <label>Deskripsi<textarea name="description" rows={3} placeholder="Informasi yang perlu diketahui peserta."/></label>
        <button className="btn primary">Tambah agenda</button>
      </form>
    </Panel>}
    {loading?<Loading/>:<div className="calendar-layout">
      <Panel eyebrow="MENDATANG" title={`${upcoming.length} agenda`}>
        {upcoming.length===0?<Empty text="Belum ada agenda mendatang."/>:<div className="calendar-list">{upcoming.map(x=><article className="calendar-event" key={x.id}>
          <div className="calendar-date"><b>{new Date(String(x.start_at)).getDate()}</b><span>{new Intl.DateTimeFormat("id-ID",{month:"short"}).format(new Date(String(x.start_at)))}</span></div>
          <div><div className="calendar-event-top"><Status value={x.type||"INFO"}/><small>{formatDate(x.start_at,true)} – {formatDate(x.end_at,true)}</small></div><h3>{x.title}</h3><p>{x.description||"Agenda Nalarva"}</p><div className="calendar-scope">{x.program_name&&<span>{x.program_name}</span>}{x.class_name&&<span>{x.class_name}</span>}</div></div>
        </article>)}</div>}
      </Panel>
      <Panel eyebrow="SELESAI" title="Agenda sebelumnya">
        {past.length===0?<Empty text="Belum ada agenda sebelumnya."/>:<div className="mini-list">{past.slice(0,12).map(x=><div key={x.id}><span><b>{x.title}</b><small>{formatDate(x.start_at,true)}</small></span><Status value={x.type||"INFO"}/></div>)}</div>}
      </Panel>
    </div>}
  </>;
}
