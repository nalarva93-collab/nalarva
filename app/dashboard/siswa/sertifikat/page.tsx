"use client";
import {useEffect,useState} from "react";
import DashboardShell from "@/components/DashboardShell";
import {STUDENT_NAV} from "@/lib/dashboard-nav";
import {authedNalarva,formatDate,getStoredSession} from "@/lib/apps-script";
import {Empty,Loading,PageHead,Panel} from "@/components/dashboard/DashboardUI";
type Row=Record<string,any>;

export default function Page(){
  const [rows,setRows]=useState<Row[]>([]);
  const [selected,setSelected]=useState<Row|null>(null);
  const [name,setName]=useState("Siswa Nalarva");
  useEffect(()=>{setName(getStoredSession()?.user?.name||"Siswa Nalarva");authedNalarva<Row[]>("studentCertificates").then(r=>setRows(r.data||[]))},[]);
  return <DashboardShell accessRole="SISWA" role="Siswa · TKA" name={name} initials="SN" nav={STUDENT_NAV}>
    <PageHead eyebrow="Sertifikat & Hasil" title="Dokumen capaian tryout." desc="Sertifikat digital tersedia untuk hasil tryout yang telah dipublikasikan."/>
    <div className="certificate-layout">
      <Panel eyebrow="DOKUMEN" title={`${rows.length} sertifikat`}>
        {rows.length===0?<Empty text="Belum ada sertifikat. Sertifikat muncul setelah hasil tryout dipublikasikan."/>:<div className="certificate-list">{rows.map(c=><button className={selected?.id===c.id?"certificate-row active":"certificate-row"} key={c.id} onClick={()=>setSelected(c)}>
          <span><b>{c.exam_title}</b><small>{c.cert_no} · {formatDate(c.issued_at)}</small></span><strong>{Number(c.score||0).toFixed(0)}</strong>
        </button>)}</div>}
      </Panel>
      <div>
        {!selected?<div className="certificate-placeholder"><b>Pilih sertifikat</b><span>Preview sertifikat akan tampil di sini.</span></div>:
        <article className="certificate-sheet" id="certificate-print">
          <div className="certificate-mark">N</div><span className="certificate-brand">NALARVA</span>
          <small className="certificate-kicker">SERTIFIKAT HASIL TRYOUT</small>
          <h1>Sertifikat Pencapaian</h1>
          <p>Diberikan kepada</p><h2>{selected.student_name}</h2>
          <p>atas partisipasi dan hasil pada</p><h3>{selected.exam_title}</h3>
          <div className="certificate-score"><span>Nilai</span><b>{Number(selected.score||0).toFixed(0)}</b><small>Rank #{selected.rank||"—"} · Percentile {selected.percentile||"—"}</small></div>
          <div className="certificate-bottom"><div><small>Nomor Sertifikat</small><b>{selected.cert_no}</b></div><div><small>Diterbitkan</small><b>{formatDate(selected.issued_at)}</b></div></div>
          <p className="certificate-verify">Verifikasi: {selected.verification_code}</p>
        </article>}
        {selected&&<div className="certificate-actions"><button className="btn primary" onClick={()=>window.print()}>Cetak / Simpan PDF</button></div>}
      </div>
    </div>
  </DashboardShell>
}