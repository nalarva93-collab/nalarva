"use client";
import Link from "next/link";
import Image from "next/image";
import {ReactNode,useEffect,useState} from "react";
import {usePathname,useRouter} from "next/navigation";
import {authedNalarva,getStoredSession,isBackendConfigured,logoutNalarva,validateSession} from "@/lib/apps-script";
import type {DashboardNavItem} from "@/lib/dashboard-nav";
import GlobalSearch from "@/components/dashboard/GlobalSearch";

export default function DashboardShell({
  role,name,initials,nav,accessRole,children
}:{
  role:string;
  name:string;
  initials:string;
  nav:DashboardNavItem[];
  accessRole?:"SISWA"|"TUTOR"|"ADMIN"|"ORANG_TUA";
  children:ReactNode
}){
  const [open,setOpen]=useState(false);
  const [ready,setReady]=useState(!isBackendConfigured());
  const [displayName,setDisplayName]=useState(name);
  const [displayRole,setDisplayRole]=useState(role);
  const [unread,setUnread]=useState(0);
  const router=useRouter();
  const pathname=usePathname();

  useEffect(()=>{
    const local=getStoredSession();
    if(local?.user){
      setDisplayName(local.user.name||name);
      setDisplayRole(local.user.role||role);
    }
    if(!isBackendConfigured()){setReady(true);return;}
    validateSession().then(result=>{
      if(!result.ok){router.replace("/login");return;}
      const liveSession=getStoredSession();
      if(accessRole && liveSession?.user?.role && liveSession.user.role!==accessRole){
        router.replace(liveSession.user.role==="ADMIN"?"/dashboard/admin":liveSession.user.role==="TUTOR"?"/dashboard/tutor":liveSession.user.role==="ORANG_TUA"?"/dashboard/orangtua":"/dashboard/siswa");
        return;
      }
      authedNalarva<{unread:number}>("notificationCount").then(r=>setUnread(Number(r.data?.unread||0)));
      if(accessRole==="SISWA"){
        authedNalarva<{active:boolean}>("studentAccessStatus").then(access=>{
          const alwaysAllowed=["/dashboard/siswa/langganan","/dashboard/siswa/pengaturan","/dashboard/siswa/analisis","/dashboard/siswa/ranking","/dashboard/siswa/notifikasi","/dashboard/siswa/profil","/dashboard/siswa/kalender","/dashboard/siswa/pesan","/dashboard/siswa/sertifikat"];
          const allowed=alwaysAllowed.some(x=>pathname===x||pathname.startsWith(x+"/"));
          if(access.ok && access.data && !access.data.active && !allowed){
            router.replace("/dashboard/siswa/langganan");
            return;
          }
          setReady(true);
        });
        return;
      }
      setReady(true);
    });
  },[name,role,router,accessRole,pathname]);

  async function logout(){await logoutNalarva();router.push("/login")}
  if(!ready) return <div className="dash-loading">Memeriksa sesi Nalarva...</div>;

  const shownInitials=(displayName||initials).split(" ").map(x=>x[0]).join("").slice(0,2).toUpperCase()||initials;
  return <div className="dash-shell">
    <aside className={open?"sidebar open":"sidebar"}>
      <Link href="/" className="side-brand"><Image src="/logo-horizontal.png" alt="Nalarva" width={360} height={80} loading="eager"/></Link>
      <span className="role-chip">{displayRole}</span>
      <nav>
        {nav.map((item)=>{
          const active=pathname===item.href || (item.href.split("/").length>3 && pathname.startsWith(item.href+"/"));
          return <Link onClick={()=>setOpen(false)} className={active?"active":""} href={item.href} key={item.href}>
            <i>{item.icon}</i>{item.label}
          </Link>
        })}
      </nav>
      <div className="side-foot"><button className="side-logout" onClick={logout}>↗ Keluar</button></div>
    </aside>
    <main className="dash-main">
      <header className="dash-top">
        <button aria-label="Buka menu" onClick={()=>setOpen(!open)}>☰</button>
        <GlobalSearch/>
        <Link aria-label="Notifikasi" className="notification-bell" href={accessRole==="ADMIN"?"/dashboard/admin/notifikasi":accessRole==="TUTOR"?"/dashboard/tutor/notifikasi":accessRole==="ORANG_TUA"?"/dashboard/orangtua/notifikasi":"/dashboard/siswa/notifikasi"}>✦{unread>0&&<b>{unread>99?"99+":unread}</b>}</Link>
        <div className="dash-user"><div><b>{displayName}</b><span>{displayRole}</span></div><em>{shownInitials}</em></div>
      </header>
      <div className="dash-content">{children}</div>
    </main>
    {open&&<button className="dash-overlay" aria-label="Tutup menu" onClick={()=>setOpen(false)}/>}
  </div>
}
