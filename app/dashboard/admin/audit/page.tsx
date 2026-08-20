"use client";
import {useEffect,useMemo,useState} from "react";
import DashboardShell from "@/components/DashboardShell";
import {ADMIN_NAV} from "@/lib/dashboard-nav";
import {authedNalarva,formatDate} from "@/lib/apps-script";
import {Empty,Loading,Message,PageHead,Panel,Status} from "@/components/dashboard/DashboardUI";
type Row=Record<string,any>;

function csvCell(v:unknown){return `"${String(v??"").replace(/"/g,'""')}"`}
function downloadCsv(rows:Row[]){
  const head=["Waktu","Pengguna","Email","Aksi","Entitas","ID","Detail"];
  const data=rows.map(r=>[r.created_at,r.user_name,r.user_email,r.action,r.entity,r.entity_id,r.detail]);
  const body=[head.map(csvCell).join(","),...data.map(x=>x.map(csvCell).join(","))].join("\r\n");
  const blob=new Blob(["\uFEFF"+body],{type:"text/csv;charset=utf-8"});
  const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="nalarva-audit-log.csv";a.click();URL.revokeObjectURL(url);
}

export default function Page(){
  const [logs,setLogs]=useState<Row[]>([]);
  const [backups,setBackups]=useState<Row[]>([]);
  const [status,setStatus]=useState<Row|null>(null);
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState(false);
  const [msg,setMsg]=useState("");
  const [query,setQuery]=useState("");
  const [action,setAction]=useState("");

  async function load(){
    setLoading(true);
    const [a,b,c]=await Promise.all([
      authedNalarva<Row[]>("adminAuditLog"),
      authedNalarva<Row[]>("adminListBackups"),
      authedNalarva<Row>("adminSystemStatus")
    ]);
    setLogs(a.data||[]);setBackups(b.data||[]);setStatus(c.data||null);setLoading(false);
  }
  useEffect(()=>{void load()},[]);

  const filtered=useMemo(()=>logs.filter(r=>{
    const hay=[r.user_name,r.user_email,r.action,r.entity,r.entity_id,r.detail].join(" ").toLowerCase();
    return (!query||hay.includes(query.toLowerCase()))&&(!action||String(r.action)===action);
  }),[logs,query,action]);
  const actions=useMemo(()=>Array.from(new Set(logs.map(x=>String(x.action||"")).filter(Boolean))).sort(),[logs]);

  async function backup(){
    if(!confirm("Buat backup database Nalarva sekarang?"))return;
    setBusy(true);setMsg("");
    const r=await authedNalarva<Row>("adminCreateBackup");
    setBusy(false);setMsg(r.message||"");if(r.ok)await load();
  }

  return <DashboardShell accessRole="ADMIN" role="Administrator" name="Admin Nalarva" initials="AD" nav={ADMIN_NAV}>
    <PageHead eyebrow="Audit & Backup" title="Kontrol operasional dan jejak perubahan." desc="Pantau aktivitas penting, status backend, sesi aktif, dan backup database." action={<button className="btn primary" disabled={busy} onClick={()=>void backup()}>{busy?"Membuat backup...":"Backup database sekarang"}</button>}/>
    {msg&&<Message text={msg}/>}
    {loading?<Loading/>:<>
      <div className="system-health-grid">
        <div><span>Backend</span><b>{status?.version||"—"}</b><small>Google Apps Script</small></div>
        <div><span>Sesi aktif</span><b>{status?.activeSessions??0}</b><small>{status?.activeUsers??0} pengguna</small></div>
        <div><span>Kuota email</span><b>{status?.emailQuotaRemaining??"—"}</b><small>penerima tersisa hari ini</small></div>
        <div><span>Backup terakhir</span><b>{status?.lastBackupAt?formatDate(status.lastBackupAt):"Belum ada"}</b><small>{backups.length} backup tercatat</small></div>
      </div>

      <div className="dash-grid audit-grid">
        <Panel eyebrow="BACKUP DATABASE" title="Salinan Google Sheet">
          <div className="backup-info"><p>Backup membuat salinan privat database <b>NALARVA_DB</b> di folder Drive <b>Backup Database</b>. File materi dan bukti pembayaran tetap berada di folder Drive aslinya.</p></div>
          {backups.length===0?<Empty text="Belum ada backup database."/>:<div className="mini-list">{backups.slice(0,10).map(b=><div key={b.id}><span><b>{b.file_name}</b><small>{b.mode} · {formatDate(b.created_at,true)} · {b.created_by_name||"System"}</small></span>{b.file_url?<a className="text-link" href={b.file_url} target="_blank" rel="noreferrer">Buka Drive</a>:<Status value={b.status}/>}</div>)}</div>}
        </Panel>
        <Panel eyebrow="KEAMANAN" title="Status sistem">
          <div className="security-check-list">
            <div><span>Auth pepper</span><Status value={status?.authPepperConfigured?"AKTIF":"PERLU SETUP"}/></div>
            <div><span>Session cleanup</span><Status value="AKTIF"/></div>
            <div><span>Login rate limit</span><Status value="AKTIF"/></div>
            <div><span>Backup mingguan</span><Status value={status?.weeklyBackupTrigger?"AKTIF":"PERLU SETUP"}/></div>
            <div><span>Maintenance harian</span><Status value={status?.maintenanceTrigger?"AKTIF":"PERLU SETUP"}/></div>
          </div>
        </Panel>
      </div>

      <Panel eyebrow="AUDIT LOG" title={`${filtered.length} aktivitas`}>
        <div className="audit-filters"><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Cari pengguna, tindakan, atau detail..."/><select value={action} onChange={e=>setAction(e.target.value)}><option value="">Semua tindakan</option>{actions.map(a=><option key={a}>{a}</option>)}</select><button className="btn ghost" onClick={()=>downloadCsv(filtered)}>Export CSV</button></div>
        {filtered.length===0?<Empty text="Tidak ada aktivitas sesuai filter."/>:<div className="table-wrap"><table><thead><tr><th>Waktu</th><th>Pengguna</th><th>Aksi</th><th>Entitas</th><th>Detail</th></tr></thead><tbody>
          {filtered.slice(0,200).map(r=><tr key={r.id}><td>{formatDate(r.created_at,true)}</td><td><b>{r.user_name||"System"}</b><br/><small>{r.user_email||r.user_id||"—"}</small></td><td><Status value={r.action}/></td><td>{r.entity}<br/><small>{r.entity_id}</small></td><td>{r.detail||"—"}</td></tr>)}
        </tbody></table></div>}
      </Panel>
    </>}
  </DashboardShell>
}