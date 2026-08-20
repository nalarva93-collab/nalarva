"use client";
import {ReactNode} from "react";

export function PageHead({eyebrow,title,desc,action}:{eyebrow?:string;title:string;desc?:string;action?:ReactNode}){
  return <div className="dash-welcome"><div>{eyebrow&&<small>{eyebrow}</small>}<h1>{title}</h1>{desc&&<p>{desc}</p>}</div>{action}</div>
}
export function Panel({eyebrow,title,children,className=""}:{eyebrow?:string;title:string;children:ReactNode;className?:string}){
  return <section className={`dash-card ${className}`}><div className="card-head"><div>{eyebrow&&<span>{eyebrow}</span>}<h3>{title}</h3></div></div>{children}</section>
}
export function Empty({text="Belum ada data."}:{text?:string}){return <div className="empty-state"><b>Belum ada data</b><span>{text}</span></div>}
export function Message({text,ok=true}:{text:string;ok?:boolean}){return <div className={ok?"op-message ok":"op-message error"}>{text}</div>}
export function Status({value}:{value:unknown}){const v=String(value||"—");return <span className={`status-tag status-${v.toLowerCase().replace(/[^a-z0-9]/g,"-")}`}>{v}</span>}
export function Loading({text="Memuat data Nalarva..."}:{text?:string}={}){return <div className="empty-state"><span>{text}</span></div>}
