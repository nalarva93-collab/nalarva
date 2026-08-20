"use client";
import {FormEvent,useState} from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import {fileToBase64,submitToNalarva,formatDate} from "@/lib/apps-script";

type Invoice={
  invoiceNo:string;status:string;amount:number;packageName:string;packageCode:string;
  registrationName:string;registrationEmail:string;level:string;createdAt:string;dueAt:string;
  paymentMethod:string;payment?:{bankName?:string;bankAccount?:string;bankHolder?:string;paymentNote?:string};
  proofStatus?:string;proofUrl?:string;
};

function rupiah(v:unknown){
  return new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(Number(v||0));
}

export default function Page(){
  const [invoice,setInvoice]=useState<Invoice|null>(null);
  const [email,setEmail]=useState("");
  const [invoiceNo,setInvoiceNo]=useState("");
  const [msg,setMsg]=useState("");
  const [busy,setBusy]=useState(false);

  async function lookup(e:FormEvent<HTMLFormElement>){
    e.preventDefault();setBusy(true);setMsg("");
    const r=await submitToNalarva<Invoice>("lookupInvoice",{invoiceNo,email});
    setBusy(false);setMsg(r.message||"");
    setInvoice(r.ok&&r.data?r.data:null);
  }

  async function upload(e:FormEvent<HTMLFormElement>){
    e.preventDefault();
    const form=e.currentTarget;
    const fd=new FormData(form);
    const file=fd.get("proof") as File|null;
    if(!file||!file.size){setMsg("Pilih file bukti pembayaran.");return;}
    setBusy(true);setMsg("");
    try{
      const base64=await fileToBase64(file);
      const r=await submitToNalarva("submitPaymentProof",{
        invoiceNo,email,fileName:file.name,mimeType:file.type,base64
      });
      setMsg(r.message||"");
      if(r.ok){
        const fresh=await submitToNalarva<Invoice>("lookupInvoice",{invoiceNo,email});
        if(fresh.ok&&fresh.data)setInvoice(fresh.data);
        form.reset();
      }
    }catch(err){setMsg(err instanceof Error?err.message:"Bukti pembayaran gagal dibaca.");}
    finally{setBusy(false);}
  }

  return <><Header/>
    <PageHero eyebrow="Pembayaran" title="Cek tagihan dan kirim bukti pembayaran." desc="Masukkan nomor invoice dan email yang digunakan saat pendaftaran. Pembayaran tetap dikonfirmasi oleh Admin Nalarva."/>
    <section className="section"><div className="container payment-layout">
      <div className="payment-search-card">
        <span className="kicker">CEK INVOICE</span>
        <h2>Temukan tagihanmu</h2>
        <form className="dash-form" onSubmit={lookup}>
          <label>Nomor invoice<input value={invoiceNo} onChange={e=>setInvoiceNo(e.target.value)} placeholder="NV-INV-2026-0001" required/></label>
          <label>Email pendaftaran<input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="nama@email.com" required/></label>
          <button className="btn primary wide" disabled={busy}>{busy?"Memeriksa...":"Cek Tagihan"}</button>
        </form>
        {msg&&<div className="payment-message">{msg}</div>}
      </div>

      <div>
        {!invoice?<div className="invoice-placeholder"><b>Belum ada invoice yang ditampilkan.</b><span>Nomor invoice diberikan oleh Admin setelah paket belajar dipilih.</span></div>:
        <article className="invoice-card" id="invoice-print">
          <div className="invoice-head">
            <div><span>NALARVA</span><h2>Invoice</h2></div>
            <div><small>Nomor</small><b>{invoice.invoiceNo}</b></div>
          </div>
          <div className="invoice-meta">
            <div><small>Calon siswa</small><b>{invoice.registrationName}</b><span>{invoice.level}</span></div>
            <div><small>Tanggal</small><b>{formatDate(invoice.createdAt)}</b><span>Jatuh tempo {formatDate(invoice.dueAt)}</span></div>
          </div>
          <div className="invoice-line"><div><b>{invoice.packageName}</b><span>{invoice.packageCode}</span></div><strong>{rupiah(invoice.amount)}</strong></div>
          <div className="invoice-total"><span>Total</span><b>{rupiah(invoice.amount)}</b></div>
          <div className="invoice-status-row"><span>Status</span><b className={`invoice-status ${String(invoice.status).toLowerCase()}`}>{invoice.status}</b></div>

          {invoice.payment&&<div className="payment-instruction">
            <span className="kicker">INSTRUKSI PEMBAYARAN</span>
            {invoice.payment.bankName&&<p><b>{invoice.payment.bankName}</b><br/>{invoice.payment.bankAccount}<br/>{invoice.payment.bankHolder}</p>}
            {invoice.payment.paymentNote&&<p>{invoice.payment.paymentNote}</p>}
          </div>}

          {["MENUNGGU_PEMBAYARAN","BUKTI_DIKIRIM"].includes(String(invoice.status))&&
          <form className="proof-form" onSubmit={upload}>
            <label>Unggah bukti pembayaran
              <input name="proof" type="file" accept=".jpg,.jpeg,.png,.pdf" required/>
            </label>
            <small>JPG, PNG, atau PDF. Maksimal 4 MB.</small>
            <button className="btn primary" disabled={busy}>{busy?"Mengunggah...":"Kirim Bukti Pembayaran"}</button>
          </form>}

          {invoice.proofStatus&&<div className="proof-status"><span>Bukti pembayaran</span><b>{invoice.proofStatus}</b>{invoice.proofUrl&&<a href={invoice.proofUrl} target="_blank" rel="noreferrer">Lihat bukti</a>}</div>}

          <div className="invoice-actions"><button className="btn ghost" type="button" onClick={()=>window.print()}>Cetak / Simpan PDF</button></div>
        </article>}
      </div>
    </div></section>
    <Footer/>
  </>;
}
