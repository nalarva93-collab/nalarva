"use client";
import {useEffect,useMemo,useState} from "react";
import DashboardShell from "@/components/DashboardShell";
import {ADMIN_NAV} from "@/lib/dashboard-nav";
import {authedNalarva,formatDate} from "@/lib/apps-script";
import {Empty,Loading,PageHead,Panel,Status} from "@/components/dashboard/DashboardUI";
type Row=Record<string,any>;

function rupiah(v:unknown){return new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(Number(v||0))}
function csvCell(v:unknown){const s=String(v??"").replace(/"/g,'""');return `"${s}"`}
function downloadCsv(name:string,headers:string[],rows:unknown[][]){
  const body=[headers.map(csvCell).join(","),...rows.map(r=>r.map(csvCell).join(","))].join("\r\n");
  const blob=new Blob(["\uFEFF"+body],{type:"text/csv;charset=utf-8"});
  const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=name;a.click();URL.revokeObjectURL(url);
}

export default function Page(){
  const [results,setResults]=useState<Row[]>([]);
  const [regs,setRegs]=useState<Row[]>([]);
  const [orders,setOrders]=useState<Row[]>([]);
  const [subs,setSubs]=useState<Row[]>([]);
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    Promise.all([
      authedNalarva<Row[]>("listResults"),
      authedNalarva<Row[]>("listRegistrations"),
      authedNalarva<Row[]>("adminListOrders"),
      authedNalarva<Row[]>("adminListSubscriptions")
    ]).then(([a,b,c,d])=>{
      setResults(a.data||[]);setRegs(b.data||[]);setOrders(c.data||[]);setSubs(d.data||[]);setLoading(false);
    })
  },[]);

  const paid=useMemo(()=>orders.filter(x=>["PAID","ACTIVATED"].includes(String(x.status))),[orders]);
  const revenue=useMemo(()=>paid.reduce((s,x)=>s+Number(x.amount||0),0),[paid]);
  const pending=useMemo(()=>orders.filter(x=>["MENUNGGU_PEMBAYARAN","BUKTI_DIKIRIM"].includes(String(x.status))),[orders]);
  const activeSubs=useMemo(()=>subs.filter(x=>String(x.status)==="ACTIVE"),[subs]);

  if(loading)return <DashboardShell accessRole="ADMIN" role="Administrator" name="Admin Nalarva" initials="AD" nav={ADMIN_NAV}><Loading/></DashboardShell>;

  return <DashboardShell accessRole="ADMIN" role="Administrator" name="Admin Nalarva" initials="AD" nav={ADMIN_NAV}>
    <PageHead eyebrow="Laporan" title="Ringkasan bisnis & akademik." desc="Pantau penerimaan, pendaftaran, langganan aktif, serta hasil tryout dari satu halaman."/>
    <div className="report-stats">
      <div><span>Total penerimaan</span><b>{rupiah(revenue)}</b><small>{paid.length} pembayaran</small></div>
      <div><span>Tagihan tertunda</span><b>{pending.length}</b><small>menunggu tindak lanjut</small></div>
      <div><span>Langganan aktif</span><b>{activeSubs.length}</b><small>siswa memiliki akses</small></div>
      <div><span>Pendaftaran</span><b>{regs.length}</b><small>{regs.filter(x=>String(x.status)==="BARU").length} baru</small></div>
    </div>

    <div className="report-actions">
      <button className="btn ghost" onClick={()=>downloadCsv("nalarva-orders.csv",["Invoice","Nama","Email","Paket","Nilai","Status","Tanggal"],orders.map(o=>[o.invoice_no,o.registration_name,o.registration_email,o.package_name,o.amount,o.status,o.created_at]))}>Export pembayaran CSV</button>
      <button className="btn ghost" onClick={()=>downloadCsv("nalarva-registrations.csv",["Nama","Email","WhatsApp","Jenjang","Sekolah","Status","Tanggal"],regs.map(r=>[r.name,r.email,r.phone,r.level,r.school,r.status,r.created_at]))}>Export pendaftaran CSV</button>
      <button className="btn ghost" onClick={()=>downloadCsv("nalarva-results.csv",["Siswa","Tryout","Skor","Rank","Tanggal"],results.map(r=>[r.student_name||r.student_user_id,r.exam_title||r.exam_id,r.score,r.rank,r.published_at]))}>Export hasil CSV</button>
    </div>

    <div className="dash-grid report-grid">
      <Panel eyebrow="KEUANGAN" title="Pembayaran terbaru">
        {orders.length===0?<Empty/>:<div className="table-wrap"><table><thead><tr><th>Invoice</th><th>Siswa</th><th>Paket</th><th>Nilai</th><th>Status</th></tr></thead><tbody>
          {orders.slice(0,15).map(o=><tr key={o.id}><td><b>{o.invoice_no||o.id}</b></td><td>{o.registration_name||"—"}</td><td>{o.package_name||"—"}</td><td>{rupiah(o.amount)}</td><td><Status value={o.status}/></td></tr>)}
        </tbody></table></div>}
      </Panel>
      <Panel eyebrow="LANGGANAN" title="Akses siswa">
        {subs.length===0?<Empty/>:<div className="mini-list">{subs.slice(0,15).map(s=><div key={s.id}><span><b>{s.student_name||"—"}</b><small>{s.package_name||s.source||"Akses"} · s.d. {formatDate(s.end_at)}</small></span><Status value={s.status}/></div>)}</div>}
      </Panel>
    </div>

    <div className="dash-grid report-grid">
      <Panel eyebrow="TRYOUT" title="Hasil terbaru">
        {results.length===0?<Empty/>:<div className="table-wrap"><table><thead><tr><th>Siswa</th><th>Tryout</th><th>Skor</th><th>Rank</th></tr></thead><tbody>
          {results.slice(0,15).map(r=><tr key={r.id}><td>{r.student_name||r.student_user_id}</td><td>{r.exam_title||r.exam_id}</td><td><b>{r.score}</b></td><td>#{r.rank||"—"}</td></tr>)}
        </tbody></table></div>}
      </Panel>
      <Panel eyebrow="LEADS" title="Pendaftaran website">
        {regs.length===0?<Empty/>:<div className="mini-list">{regs.slice(0,15).map(r=><div key={r.id}><span><b>{r.name}</b><small>{r.level} · {formatDate(r.created_at)}</small></span><Status value={r.status}/></div>)}</div>}
      </Panel>
    </div>
  </DashboardShell>
}