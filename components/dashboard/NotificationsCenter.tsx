"use client";
import Link from "next/link";
import {useEffect,useMemo,useState} from "react";
import {authedNalarva,formatDate} from "@/lib/apps-script";
import {Empty,Loading,Message,PageHead,Panel,Status} from "@/components/dashboard/DashboardUI";

type NRow={
  id:string;type?:string;title?:string;message?:string;link?:string;
  status?:string;created_at?:string;read_at?:string;channel?:string;
};

export default function NotificationsCenter(){
  const [rows,setRows]=useState<NRow[]>([]);
  const [loading,setLoading]=useState(true);
  const [msg,setMsg]=useState("");

  async function load(){
    setLoading(true);
    const r=await authedNalarva<NRow[]>("listNotifications");
    setRows(r.data||[]);
    setLoading(false);
  }
  useEffect(()=>{void load()},[]);

  const unread=useMemo(()=>rows.filter(x=>!x.read_at).length,[rows]);

  async function read(id:string){
    const r=await authedNalarva("markNotificationRead",{notificationId:id});
    setMsg(r.message||"");
    if(r.ok)await load();
  }
  async function readAll(){
    const r=await authedNalarva("markAllNotificationsRead");
    setMsg(r.message||"");
    if(r.ok)await load();
  }

  return <>
    <PageHead eyebrow="Notifikasi" title="Pusat informasi Nalarva." desc={`${unread} notifikasi belum dibaca.`}
      action={unread>0?<button className="btn ghost" onClick={()=>void readAll()}>Tandai semua dibaca</button>:undefined}/>
    {msg&&<Message text={msg}/>}
    <Panel eyebrow="TERBARU" title="Aktivitas & pengingat">
      {loading?<Loading/>:rows.length===0?<Empty text="Belum ada notifikasi untuk akun ini."/>:
      <div className="notification-list">
        {rows.map(n=><article className={n.read_at?"notification-item":"notification-item unread"} key={n.id}>
          <div className="notification-dot"/>
          <div className="notification-copy">
            <div className="notification-top"><Status value={n.type||"INFO"}/><small>{formatDate(n.created_at,true)}</small></div>
            <h3>{n.title||"Notifikasi Nalarva"}</h3>
            <p>{n.message||""}</p>
            <div className="notification-actions">
              {n.link&&<Link className="text-link" href={n.link}>Buka →</Link>}
              {!n.read_at&&<button onClick={()=>void read(n.id)}>Tandai dibaca</button>}
            </div>
          </div>
        </article>)}
      </div>}
    </Panel>
  </>;
}
