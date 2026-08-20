"use client";
import {FormEvent,useEffect,useMemo,useState} from "react";
import DashboardShell from "@/components/DashboardShell";
import {ADMIN_NAV} from "@/lib/dashboard-nav";
import {authedNalarva,formatDate} from "@/lib/apps-script";
import {Empty,Loading,Message,PageHead,Panel,Status} from "@/components/dashboard/DashboardUI";

type Row=Record<string,any>;

function rupiah(v:unknown){
  return new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(Number(v||0));
}

export default function Page(){
  const [regs,setRegs]=useState<Row[]>([]);
  const [packages,setPackages]=useState<Row[]>([]);
  const [orders,setOrders]=useState<Row[]>([]);
  const [programs,setPrograms]=useState<Row[]>([]);
  const [classes,setClasses]=useState<Row[]>([]);
  const [settings,setSettings]=useState<Row>({});
  const [subscriptions,setSubscriptions]=useState<Row[]>([]);
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState(false);
  const [msg,setMsg]=useState("");

  async function load(){
    setLoading(true);
    const [a,b,c,d,e,f,g]=await Promise.all([
      authedNalarva<Row[]>("listRegistrations"),
      authedNalarva<Row[]>("listPackages"),
      authedNalarva<Row[]>("adminListOrders"),
      authedNalarva<Row[]>("listPrograms"),
      authedNalarva<Row[]>("listClasses"),
      authedNalarva<Row>("adminListPaymentSettings"),
      authedNalarva<Row[]>("adminListSubscriptions")
    ]);
    setRegs(a.data||[]);setPackages(b.data||[]);setOrders(c.data||[]);setPrograms(d.data||[]);setClasses(e.data||[]);setSettings(f.data||{});setSubscriptions(g.data||[]);
    setLoading(false);
  }
  useEffect(()=>{void load()},[]);

  const activePackages=useMemo(()=>packages.filter(p=>String(p.status)==="ACTIVE"),[packages]);

  async function savePackage(e:FormEvent<HTMLFormElement>){
    e.preventDefault();const form=e.currentTarget;setBusy(true);setMsg("");
    const r=await authedNalarva("adminUpsertPackage",Object.fromEntries(new FormData(form).entries()));
    setBusy(false);setMsg(r.message||"");if(r.ok){form.reset();await load();}
  }

  async function createOrder(e:FormEvent<HTMLFormElement>){
    e.preventDefault();const form=e.currentTarget;setBusy(true);setMsg("");
    const r=await authedNalarva("adminCreateOrder",Object.fromEntries(new FormData(form).entries()));
    setBusy(false);setMsg(r.message||"");if(r.ok){form.reset();await load();}
  }

  async function markPaid(id:string){
    const reference=window.prompt("Nomor referensi / catatan pembayaran (opsional):","")||"";
    if(!window.confirm("Konfirmasi bahwa pembayaran ini sudah diterima?"))return;
    const r=await authedNalarva("adminMarkOrderPaid",{orderId:id,reference});
    setMsg(r.message||"");if(r.ok)await load();
  }

  async function reviewProof(orderId:string,decision:"APPROVE"|"REJECT"){
    const notes=decision==="REJECT"?(window.prompt("Alasan penolakan bukti pembayaran:","Bukti belum sesuai.")||""):"";
    if(!window.confirm(decision==="APPROVE"?"Setujui bukti dan tandai tagihan sudah dibayar?":"Tolak bukti pembayaran ini?"))return;
    const r=await authedNalarva("adminReviewPaymentProof",{orderId,decision,notes});
    setMsg(r.message||"");if(r.ok)await load();
  }

  async function savePaymentSettings(e:FormEvent<HTMLFormElement>){
    e.preventDefault();const form=e.currentTarget;setBusy(true);setMsg("");
    const r=await authedNalarva("adminSavePaymentSettings",Object.fromEntries(new FormData(form).entries()));
    setBusy(false);setMsg(r.message||"");if(r.ok)await load();
  }

  async function updateSubscription(id:string,action:"EXTEND_30"|"SUSPEND"|"ACTIVATE"){
    if(!window.confirm(`Lanjutkan tindakan ${action.replace("_"," ")} untuk langganan ini?`))return;
    const r=await authedNalarva("adminUpdateSubscription",{subscriptionId:id,operation:action});
    setMsg(r.message||"");if(r.ok)await load();
  }

  async function activate(id:string){
    const classId=window.prompt("ID kelas tujuan (opsional). Kosongkan jika kelas akan dipilih nanti.","")||"";
    if(!window.confirm("Aktifkan pendaftaran menjadi akun siswa Nalarva?"))return;
    const r=await authedNalarva<Row>("adminActivateOrder",{orderId:id,classId});
    const suffix=r.ok&&r.data?.temporaryPassword?` Password sementara: ${r.data.temporaryPassword}`:"";
    setMsg((r.message||"")+suffix);if(r.ok)await load();
  }

  async function updateReg(id:string,status:string){
    const r=await authedNalarva("adminUpdateRegistrationStatus",{registrationId:id,status});
    setMsg(r.message||"");if(r.ok)await load();
  }

  return <DashboardShell accessRole="ADMIN" role="Administrator" name="Admin Nalarva" initials="AD" nav={ADMIN_NAV}>
    <PageHead eyebrow="Pendaftaran & Pembayaran" title="Dari calon siswa sampai akun aktif." desc="Kelola paket, calon siswa, tagihan manual, konfirmasi pembayaran, dan aktivasi akun dari satu halaman."/>
    {msg&&<Message text={msg}/>}
    {loading?<Loading/>:<>
      <div className="commerce-stats">
        <div><span>Calon siswa</span><b>{regs.length}</b><small>{regs.filter(r=>String(r.status)==="BARU").length} baru</small></div>
        <div><span>Menunggu bayar</span><b>{orders.filter(o=>String(o.status)==="MENUNGGU_PEMBAYARAN").length}</b><small>tagihan aktif</small></div>
        <div><span>Sudah dibayar</span><b>{orders.filter(o=>String(o.status)==="PAID").length}</b><small>siap diaktifkan</small></div>
        <div><span>Akun aktif</span><b>{orders.filter(o=>String(o.status)==="ACTIVATED").length}</b><small>dari pendaftaran</small></div>
      </div>

      <div className="ops-grid">
        <Panel eyebrow="PAKET" title="Buat / ubah paket">
          <form className="dash-form" onSubmit={savePackage}>
            <div className="form-two"><label>Kode paket<input name="code" placeholder="FOCUS" required/></label><label>Nama paket<input name="name" placeholder="TKA Focus" required/></label></div>
            <label>Program<select name="programId"><option value="">Semua jenjang</option>{programs.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
            <div className="form-two"><label>Harga (Rp)<input name="price" type="number" min="0" step="1000" required/></label><label>Periode<select name="billingPeriod"><option value="BULANAN">Bulanan</option><option value="SEKALI_BAYAR">Sekali bayar</option></select></label></div>
            <div className="form-two"><label>Sesi kelas<input name="classSessions" type="number" min="0" defaultValue="0"/></label><label>Kuota tryout<input name="tryoutQuota" type="number" min="0" defaultValue="0"/></label></div>
            <label>Masa aktif (hari)<input name="durationDays" type="number" min="1" defaultValue="30" required/></label>
            <label>Deskripsi<textarea name="description" rows={3}/></label>
            <label>Status<select name="status"><option value="DRAFT">Draft</option><option value="ACTIVE">Aktif / tampil publik</option><option value="ARCHIVED">Arsip</option></select></label>
            <button className="btn primary wide" disabled={busy}>{busy?"Menyimpan...":"Simpan paket"}</button>
          </form>
        </Panel>

        <Panel eyebrow="TAGIHAN" title="Buat tagihan calon siswa">
          <form className="dash-form" onSubmit={createOrder}>
            <label>Calon siswa<select name="registrationId" required><option value="">Pilih pendaftaran</option>{regs.filter(r=>!["AKTIF","BATAL"].includes(String(r.status))).map(r=><option key={r.id} value={r.id}>{r.name} · {r.level}</option>)}</select></label>
            <label>Paket<select name="packageId" required><option value="">Pilih paket aktif</option>{activePackages.map(p=><option key={p.id} value={p.id}>{p.name} · {rupiah(p.price)}</option>)}</select></label>
            <label>Metode pembayaran<select name="paymentMethod"><option value="TRANSFER">Transfer bank</option><option value="QRIS_MANUAL">QRIS manual</option><option value="TUNAI">Tunai</option><option value="LAINNYA">Lainnya</option></select></label>
            <label>Jatuh tempo<input type="date" name="dueDate"/></label>
            <label>Catatan<textarea name="notes" rows={3} placeholder="Catatan tambahan untuk tagihan."/></label>
            <button className="btn primary wide" disabled={busy}>Buat tagihan</button>
            <small className="form-context">Harga diambil otomatis dari paket. Konfirmasi pembayaran tetap dilakukan Admin.</small>
          </form>
        </Panel>
      </div>

      <div className="dash-grid commercial-grid">
        <Panel eyebrow="REKENING" title="Pengaturan pembayaran">
          <form className="dash-form" onSubmit={savePaymentSettings}>
            <label>Nama bank<input name="bankName" defaultValue={settings.bankName||""} placeholder="Contoh: BCA"/></label>
            <label>Nomor rekening<input name="bankAccount" defaultValue={settings.bankAccount||""} placeholder="Nomor rekening Nalarva"/></label>
            <label>Nama pemilik rekening<input name="bankHolder" defaultValue={settings.bankHolder||""} placeholder="Nama pemilik rekening"/></label>
            <label>Catatan pembayaran<textarea name="paymentNote" defaultValue={settings.paymentNote||""} rows={3} placeholder="Contoh: Cantumkan nomor invoice pada berita transfer."/></label>
            <label>Alamat website<input name="siteUrl" defaultValue={settings.siteUrl||"https://nalarva.com"} placeholder="https://nalarva.com"/></label>
            <div className="form-two"><label>Nama pengirim email<input name="senderName" defaultValue={settings.senderName||"Nalarva"}/></label><label>Email balasan<input type="email" name="replyTo" defaultValue={settings.replyTo||""} placeholder="halo@nalarva.com"/></label></div>
            <label>Email notifikasi Admin<input type="email" name="adminNotificationEmail" defaultValue={settings.adminNotificationEmail||""} placeholder="Email yang menerima notifikasi operasional"/></label>
            <button className="btn primary wide" disabled={busy}>Simpan pengaturan</button>
          </form>
        </Panel>
        <Panel eyebrow="ALUR" title="Cara kerja pembayaran">
          <div className="commercial-flow">
            <div><b>1</b><span>Admin membuat invoice</span></div>
            <div><b>2</b><span>Calon siswa membuka /pembayaran</span></div>
            <div><b>3</b><span>Bukti dikirim ke Drive</span></div>
            <div><b>4</b><span>Admin review dan aktivasi</span></div>
          </div>
        </Panel>
      </div>

      <div className="dash-grid commercial-grid">
        <Panel eyebrow="LEADS" title={`Pendaftaran website (${regs.length})`}>
          {regs.length===0?<Empty text="Belum ada pendaftaran."/>:<div className="table-wrap"><table><thead><tr><th>Calon siswa</th><th>Jenjang</th><th>Kontak</th><th>Status</th><th>Aksi</th></tr></thead><tbody>
            {regs.map(r=><tr key={r.id}><td><b>{r.name}</b><br/><small>{r.school||"—"} · {formatDate(r.created_at)}</small></td><td>{r.level||"—"}</td><td>{r.phone}<br/><small>{r.email}</small></td><td><Status value={r.status}/></td><td><div className="table-actions"><button onClick={()=>void updateReg(r.id,"DIHUBUNGI")}>Dihubungi</button><button onClick={()=>void updateReg(r.id,"BATAL")}>Batal</button></div></td></tr>)}
          </tbody></table></div>}
        </Panel>

        <Panel eyebrow="PAKET AKTIF" title={`Paket (${packages.length})`}>
          {packages.length===0?<Empty text="Belum ada paket."/>:<div className="mini-list">{packages.map(p=><div key={p.id}><span><b>{p.name}</b><small>{p.code} · {rupiah(p.price)} · {p.program_name||"Semua jenjang"}</small></span><Status value={p.status}/></div>)}</div>}
        </Panel>
      </div>

      <Panel eyebrow="PEMBAYARAN" title={`Tagihan & aktivasi (${orders.length})`}>
        {orders.length===0?<Empty text="Belum ada tagihan."/>:<div className="table-wrap"><table><thead><tr><th>Invoice</th><th>Calon siswa</th><th>Paket</th><th>Nilai</th><th>Status</th><th>Bukti</th><th>Jatuh tempo</th><th>Aksi</th></tr></thead><tbody>
          {orders.map(o=><tr key={o.id}><td><b>{o.invoice_no||o.id}</b><br/><small>{o.payment_method||"—"}</small></td><td><b>{o.registration_name||"—"}</b><br/><small>{o.registration_email||""}</small></td><td>{o.package_name||o.package_id}</td><td><b>{rupiah(o.amount)}</b></td><td><Status value={o.status}/></td><td>{o.proof_url?<a className="text-link" href={o.proof_url} target="_blank" rel="noreferrer">{o.proof_status||"Lihat"}</a>:<small>Belum ada</small>}</td><td>{formatDate(o.due_at||o.created_at)}</td><td><div className="table-actions">
            {String(o.proof_status)==="SUBMITTED"&&<><button onClick={()=>void reviewProof(o.id,"APPROVE")}>Setujui bukti</button><button onClick={()=>void reviewProof(o.id,"REJECT")}>Tolak</button></>}
            {String(o.status)==="MENUNGGU_PEMBAYARAN"&&String(o.proof_status)!=="SUBMITTED"&&<button onClick={()=>void markPaid(o.id)}>Konfirmasi manual</button>}
            {String(o.status)==="PAID"&&<button onClick={()=>void activate(o.id)}>Aktifkan siswa</button>}
            {String(o.status)==="ACTIVATED"&&<span className="done-label">Selesai</span>}
          </div></td></tr>)}
        </tbody></table></div>}
        <div className="activation-note"><b>Catatan kelas:</b> saat aktivasi, ID kelas boleh dikosongkan. Siswa tetap mendapat akun/program dan dapat dimasukkan ke kelas melalui menu Kelas & Jadwal setelahnya.</div>
      </Panel>

      <Panel eyebrow="LANGGANAN" title={`Masa aktif siswa (${subscriptions.length})`}>
        {!subscriptions.length?<Empty text="Belum ada langganan siswa."/>:<div className="table-wrap"><table><thead><tr><th>Siswa</th><th>Paket</th><th>Program</th><th>Mulai</th><th>Berakhir</th><th>Status</th><th>Aksi</th></tr></thead><tbody>
          {subscriptions.map(s=><tr key={s.id}><td><b>{s.student_name||"—"}</b><br/><small>{s.student_email||""}</small></td><td>{s.package_name||s.source||"Manual"}</td><td>{s.program_name||"—"}</td><td>{formatDate(s.start_at)}</td><td>{formatDate(s.end_at)}</td><td><Status value={s.status}/></td><td><div className="table-actions"><button onClick={()=>void updateSubscription(s.id,"EXTEND_30")}>+30 hari</button>{String(s.status)==="ACTIVE"?<button onClick={()=>void updateSubscription(s.id,"SUSPEND")}>Suspend</button>:<button onClick={()=>void updateSubscription(s.id,"ACTIVATE")}>Aktifkan</button>}</div></td></tr>)}
        </tbody></table></div>}
      </Panel>
    </>}
  </DashboardShell>;
}
