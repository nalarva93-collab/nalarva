"use client";
import {useEffect,useState} from "react";
import DashboardShell from "@/components/DashboardShell";
import {STUDENT_NAV} from "@/lib/dashboard-nav";
import {authedNalarva,formatDate,getStoredSession} from "@/lib/apps-script";
import {Empty,Loading,PageHead,Panel,Status} from "@/components/dashboard/DashboardUI";

type Billing={
  access:{active:boolean;status:string;startAt?:string;endAt?:string;daysLeft?:number;packageName?:string;programName?:string;source?:string};
  orders:any[];
};

function rupiah(v:unknown){
  return new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(Number(v||0));
}

export default function Page(){
  const [data,setData]=useState<Billing|null>(null);
  const [name,setName]=useState("Siswa Nalarva");
  useEffect(()=>{
    setName(getStoredSession()?.user?.name||"Siswa Nalarva");
    authedNalarva<Billing>("studentBilling").then(r=>setData(r.data||null));
  },[]);
  return <DashboardShell accessRole="SISWA" role="Siswa · TKA" name={name} initials="SN" nav={STUDENT_NAV}>
    <PageHead eyebrow="Langganan" title="Status akses belajarmu." desc="Lihat paket aktif, masa berlaku, serta riwayat tagihan akun Nalarva."/>
    {!data?<Loading text="Memuat status langganan..."/>:<>
      <div className={data.access.active?"subscription-hero active":"subscription-hero expired"}>
        <div><span>STATUS AKSES</span><h2>{data.access.active?"Aktif":"Belum aktif / berakhir"}</h2><p>{data.access.active?"Kamu dapat mengakses kelas, materi, tugas, dan tryout.":"Akses belajar dikunci sampai paket aktif kembali. Pengaturan akun dan riwayat hasil tetap dapat dibuka."}</p></div>
        <div className="subscription-meta">
          <div><small>Paket</small><b>{data.access.packageName||"—"}</b></div>
          <div><small>Program</small><b>{data.access.programName||"—"}</b></div>
          <div><small>Berakhir</small><b>{data.access.endAt?formatDate(data.access.endAt):"—"}</b></div>
          <div><small>Sisa hari</small><b>{data.access.active?`${data.access.daysLeft??0} hari`:"—"}</b></div>
        </div>
      </div>

      <Panel eyebrow="RIWAYAT" title="Tagihan akun">
        {!data.orders?.length?<Empty text="Belum ada riwayat tagihan pada akun ini."/>:<div className="table-wrap"><table><thead><tr><th>Invoice</th><th>Paket</th><th>Nilai</th><th>Status</th><th>Tanggal</th></tr></thead><tbody>
          {data.orders.map(o=><tr key={o.id}><td><b>{o.invoice_no||o.id}</b></td><td>{o.package_name||"—"}</td><td>{rupiah(o.amount)}</td><td><Status value={o.status}/></td><td>{formatDate(o.created_at)}</td></tr>)}
        </tbody></table></div>}
      </Panel>
    </>}
  </DashboardShell>;
}
