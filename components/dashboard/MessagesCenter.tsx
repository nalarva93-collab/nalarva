"use client";
import {useEffect,useMemo,useState} from "react";
import {authedNalarva,formatDate} from "@/lib/apps-script";
import {Empty,Loading,Message,PageHead,Panel,Status} from "@/components/dashboard/DashboardUI";

type Row=Record<string,any>;

export default function MessagesCenter(){
  const [messages,setMessages]=useState<Row[]>([]);
  const [recipients,setRecipients]=useState<Row[]>([]);
  const [loading,setLoading]=useState(true);
  const [msg,setMsg]=useState("");
  const [selected,setSelected]=useState("");

  async function load(){
    setLoading(true);
    const [a,b]=await Promise.all([authedNalarva<Row[]>("listMessages"),authedNalarva<Row[]>("messageRecipients")]);
    setMessages(a.data||[]);setRecipients(b.data||[]);setLoading(false);
  }
  useEffect(()=>{void load()},[]);

  const thread=useMemo(()=>selected?messages.filter(x=>String(x.other_user_id)===selected):messages,[messages,selected]);

  async function send(e:React.FormEvent<HTMLFormElement>){
    e.preventDefault();const form=e.currentTarget;setMsg("");
    const r=await authedNalarva("sendMessage",Object.fromEntries(new FormData(form).entries()));
    setMsg(r.message||"");if(r.ok){form.reset();await load();}
  }

  async function read(id:string){
    await authedNalarva("markMessageRead",{messageId:id});await load();
  }

  return <>
    <PageHead eyebrow="Pesan" title="Komunikasi belajar yang terarah." desc="Pesan hanya dapat dikirim antara tutor dan siswa yang terhubung melalui kelas Nalarva."/>
    {msg&&<Message text={msg}/>}
    <div className="message-layout">
      <Panel eyebrow="TULIS PESAN" title="Pesan baru">
        <form className="dash-form" onSubmit={send}>
          <label>Penerima<select name="recipientUserId" required><option value="">Pilih penerima</option>{recipients.map(r=><option key={r.id} value={r.id}>{r.name} · {r.role_label||r.role}</option>)}</select></label>
          <label>Subjek<input name="subject" required placeholder="Contoh: Pertanyaan tugas minggu ini"/></label>
          <label>Pesan<textarea name="message" required rows={5} maxLength={1500}/></label>
          <button className="btn primary">Kirim pesan</button>
        </form>
        <div className="message-filter"><label>Filter percakapan<select value={selected} onChange={e=>setSelected(e.target.value)}><option value="">Semua pesan</option>{recipients.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}</select></label></div>
      </Panel>
      <Panel eyebrow="KOTAK PESAN" title={`${messages.filter(x=>!x.read_at&&x.direction==="IN").length} belum dibaca`}>
        {loading?<Loading/>:thread.length===0?<Empty text="Belum ada pesan."/>:<div className="message-list">{thread.map(m=><article className={m.direction==="OUT"?"message-item out":"message-item in"} key={m.id} onClick={()=>{if(m.direction==="IN"&&!m.read_at)void read(m.id)}}>
          <div className="message-meta"><span>{m.direction==="OUT"?"Kepada":"Dari"} <b>{m.other_name||"Pengguna Nalarva"}</b></span><small>{formatDate(m.created_at,true)}</small></div>
          <h3>{m.subject||"Pesan Nalarva"}</h3><p>{m.message}</p>
          <div className="message-state">{m.direction==="OUT"?<span>Terkirim</span>:m.read_at?<span>Dibaca</span>:<Status value="BARU"/>}</div>
        </article>)}</div>}
      </Panel>
    </div>
  </>;
}
