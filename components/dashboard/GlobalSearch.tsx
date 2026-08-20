"use client";
import Link from "next/link";
import {useEffect,useRef,useState} from "react";
import {authedNalarva} from "@/lib/apps-script";

type SearchRow={type:string;title:string;subtitle?:string;href:string};

export default function GlobalSearch(){
  const [q,setQ]=useState("");
  const [rows,setRows]=useState<SearchRow[]>([]);
  const [open,setOpen]=useState(false);
  const [loading,setLoading]=useState(false);
  const timer=useRef<ReturnType<typeof setTimeout>|null>(null);

  useEffect(()=>{
    if(timer.current)clearTimeout(timer.current);
    const query=q.trim();
    if(query.length<2){setRows([]);setOpen(false);setLoading(false);return}
    setLoading(true);setOpen(true);
    timer.current=setTimeout(()=>{
      authedNalarva<SearchRow[]>("globalSearch",{query}).then(r=>{
        setRows(r.data||[]);
        setLoading(false);
      });
    },250);
    return ()=>{if(timer.current)clearTimeout(timer.current)}
  },[q]);

  useEffect(()=>{
    const esc=(e:KeyboardEvent)=>{if(e.key==="Escape"){setOpen(false);setQ("")}};
    window.addEventListener("keydown",esc);return()=>window.removeEventListener("keydown",esc);
  },[]);

  return <div className="global-search-wrap">
    <div className="search global-search">⌕ <input value={q} onChange={e=>setQ(e.target.value)} onFocus={()=>{if(q.trim().length>=2)setOpen(true)}} placeholder="Cari siswa, kelas, materi..." aria-label="Cari di Nalarva"/></div>
    {open&&<div className="search-popover">
      <div className="search-popover-head"><span>HASIL PENCARIAN</span>{q&&<button onClick={()=>{setQ("");setOpen(false)}}>Tutup</button>}</div>
      {loading?<div className="search-empty">Mencari...</div>:rows.length===0?<div className="search-empty">Tidak ada hasil untuk “{q}”.</div>:
      <div className="search-results">{rows.map((r,i)=><Link key={`${r.type}-${r.href}-${i}`} href={r.href} onClick={()=>{setOpen(false);setQ("")}}>
        <span className="search-type">{r.type}</span><div><b>{r.title}</b>{r.subtitle&&<small>{r.subtitle}</small>}</div><em>→</em>
      </Link>)}</div>}
    </div>}
    {open&&<button className="search-backdrop" aria-label="Tutup hasil pencarian" onClick={()=>setOpen(false)}/>}
  </div>;
}
