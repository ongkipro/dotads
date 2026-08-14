"use client";

import { CheckCircle2, Copy, CreditCard, Eye, EyeOff, Play, QrCode, ShieldCheck, X } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";

type ChannelKey = "qris" | "bca" | "mandiri" | "bri" | "bsi";
type Channels = Record<ChannelKey, boolean>;

const CHANNEL_LABELS: Record<ChannelKey, { name: string; description: string }> = {
  qris: { name: "QRIS EMV dinamis", description: "Buat kode QR unik dan konfirmasi pembayaran secara langsung." },
  bca: { name: "Virtual Account BCA", description: "Verifikasi otomatis transfer melalui BCA." },
  mandiri: { name: "Virtual Account Mandiri", description: "Verifikasi otomatis transfer melalui Mandiri." },
  bri: { name: "Virtual Account BRI", description: "Verifikasi otomatis transfer melalui BRI." },
  bsi: { name: "Virtual Account BSI", description: "Verifikasi otomatis transfer melalui BSI." },
};

export default function AdminAutoLarisPage() {
  const [merchantSecret, setMerchantSecret] = useState("sandbox-autolaris-secret-key");
  const [showSecret, setShowSecret] = useState(false);
  const [channels, setChannels] = useState<Channels>({ qris: true, bca: true, mandiri: true, bri: true, bsi: true });
  const [webhookUrl, setWebhookUrl] = useState("https://app.dotads.id/api/webhooks/autolaris");
  const [copyStatus, setCopyStatus] = useState<"" | "tersalin" | "gagal">("");
  const [saved, setSaved] = useState(false);
  const [simulatorOpen, setSimulatorOpen] = useState(false);
  const [orderNumber, setOrderNumber] = useState("ORD-260814-0991");
  const [amount, setAmount] = useState("250000");
  const [paymentMethod, setPaymentMethod] = useState<ChannelKey>("qris");
  const [simulationResult, setSimulationResult] = useState<null | { paymentId: string; status: string; expiresAt: string }>(null);

  const activeChannelCount = Object.values(channels).filter(Boolean).length;
  const availableChannels = (Object.keys(channels) as ChannelKey[]).filter((key) => channels[key]);
  const paymentPayload = useMemo(() => ({ order_number: orderNumber, amount: Number(amount) || 0, currency: "IDR", payment_method: paymentMethod.toUpperCase(), callback_url: webhookUrl }), [amount, orderNumber, paymentMethod, webhookUrl]);

  const toggleChannel = (key: ChannelKey) => {
    setChannels((current) => ({ ...current, [key]: !current[key] }));
    setSaved(false);
  };

  const copyWebhook = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      setCopyStatus("tersalin");
    } catch {
      setCopyStatus("gagal");
    }
    window.setTimeout(() => setCopyStatus(""), 2500);
  };

  const saveSettings = () => {
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
  };

  const openSimulator = () => {
    setPaymentMethod(availableChannels[0] ?? "qris");
    setSimulationResult(null);
    setSimulatorOpen(true);
  };

  const runSimulation = (event: FormEvent) => {
    event.preventDefault();
    if (!channels[paymentMethod] || Number(amount) < 1000) return;
    setSimulationResult({ paymentId: `PAY-TEST-${Date.now().toString().slice(-8)}`, status: "Menunggu pembayaran", expiresAt: "14 Agu 2026, 23.59 WIB" });
  };

  return (
    <div className="space-y-6 pb-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div><div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-indigo-600"><CreditCard className="h-4 w-4" /> Gerbang pembayaran</div><h1 className="text-2xl font-bold tracking-tight text-slate-900">Integrasi AutoLaris Pay</h1><p className="mt-1 text-sm text-slate-500">Kelola QRIS, Virtual Account, webhook, dan uji payload pembayaran tanpa transaksi nyata.</p></div>
        <button type="button" onClick={openSimulator} disabled={activeChannelCount === 0} className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300 focus:outline-none focus:ring-4 focus:ring-indigo-500/20"><Play className="h-4 w-4" /> Uji payload pembayaran</button>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Rekonsiliasi otomatis</p><p className="mt-2 text-2xl font-black tracking-tight text-slate-900">100%</p><p className="mt-1 text-xs text-slate-500">Webhook HMAC SHA-256 aktif</p></div><span className="rounded-lg bg-emerald-50 p-2 text-emerald-600"><CheckCircle2 className="h-5 w-5" /></span></div></article>
        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Kanal pembayaran aktif</p><p className="mt-2 text-2xl font-black tracking-tight text-indigo-700">{activeChannelCount} kanal</p><p className="mt-1 text-xs text-slate-500">QRIS EMV dan Virtual Account</p></div><span className="rounded-lg bg-indigo-50 p-2 text-indigo-600"><CreditCard className="h-5 w-5" /></span></div></article>
        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Nilai transaksi terselesaikan</p><p className="mt-2 text-2xl font-black tracking-tight text-slate-900">Rp18.250.000</p><p className="mt-1 text-xs text-slate-500">Konfirmasi pembayaran hari ini</p></div><span className="rounded-lg bg-purple-50 p-2 text-purple-600"><QrCode className="h-5 w-5" /></span></div></article>
      </section>

      <section className="space-y-6 rounded-xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
        <div className="border-b border-slate-100 pb-3"><h2 className="text-sm font-bold text-slate-900">Kredensial dan alamat webhook</h2><p className="mt-1 text-xs text-slate-500">Tanda tangan HMAC SHA-256 memverifikasi bahwa notifikasi benar-benar berasal dari AutoLaris.</p></div>
        <div className="grid gap-5 lg:grid-cols-2">
          <label className="block space-y-1.5 text-xs font-bold text-slate-700">Kunci rahasia merchant (HMAC SHA-256)<span className="relative block"><input type={showSecret ? "text" : "password"} value={merchantSecret} onChange={(event) => { setMerchantSecret(event.target.value); setSaved(false); }} placeholder="Masukkan kunci rahasia merchant" className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-3 pr-11 font-mono text-sm font-normal text-slate-800 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20" /><button type="button" aria-label={showSecret ? "Sembunyikan kunci rahasia" : "Tampilkan kunci rahasia"} onClick={() => setShowSecret((current) => !current)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700">{showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></span><span className="block text-[11px] font-normal leading-5 text-slate-500">Digunakan di server untuk memvalidasi tanda tangan setiap webhook.</span></label>
          <div className="space-y-1.5 text-xs font-bold text-slate-700">
            <label htmlFor="autolaris-webhook-url">URL webhook pembayaran</label>
            <div className="flex gap-2">
              <input id="autolaris-webhook-url" type="url" value={webhookUrl} onChange={(event) => { setWebhookUrl(event.target.value); setCopyStatus(""); }} className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 font-mono text-sm font-normal text-slate-800 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20" />
              <button type="button" onClick={copyWebhook} className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"><Copy className="h-4 w-4" /> Salin</button>
            </div>
            {copyStatus && <span role="status" className={`block text-[11px] font-semibold ${copyStatus === "tersalin" ? "text-emerald-700" : "text-rose-700"}`}>{copyStatus === "tersalin" ? "URL webhook berhasil disalin." : "URL belum dapat disalin. Periksa izin papan klip."}</span>}
          </div>
        </div>

        <div className="space-y-3 border-t border-slate-100 pt-5">
          <div><h2 className="text-sm font-bold text-slate-900">Kanal pembayaran yang diizinkan</h2><p className="mt-1 text-xs text-slate-500">Nonaktifkan kanal yang tidak ingin ditampilkan pada halaman pembayaran.</p></div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{(Object.keys(CHANNEL_LABELS) as ChannelKey[]).map((key) => <ChannelToggle key={key} checked={channels[key]} name={CHANNEL_LABELS[key].name} description={CHANNEL_LABELS[key].description} onChange={() => toggleChannel(key)} />)}</div>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-end">{saved && <p role="status" className="text-sm font-semibold text-emerald-700">Pengaturan pembayaran berhasil disimpan.</p>}<button type="button" onClick={saveSettings} disabled={!merchantSecret.trim() || !webhookUrl.trim() || activeChannelCount === 0} className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300 focus:outline-none focus:ring-4 focus:ring-indigo-500/20"><ShieldCheck className="h-4 w-4" /> Simpan pengaturan</button></div>
      </section>

      {simulatorOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setSimulatorOpen(false)}><section role="dialog" aria-modal="true" aria-labelledby="simulator-title" className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl"><div className="flex items-start justify-between border-b border-slate-100 p-5"><div><p className="text-xs font-bold uppercase tracking-wider text-indigo-600">Mode pengujian lokal</p><h2 id="simulator-title" className="mt-1 text-lg font-bold text-slate-900">Simulator payload pembayaran</h2><p className="mt-1 text-xs text-slate-500">Simulasi tidak mengirim dana atau membuat transaksi produksi.</p></div><button type="button" aria-label="Tutup simulator pembayaran" onClick={() => setSimulatorOpen(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X className="h-5 w-5" /></button></div><form onSubmit={runSimulation} className="grid gap-5 p-5 lg:grid-cols-2"><div className="space-y-4"><label className="block space-y-1.5 text-xs font-bold text-slate-700">Nomor pesanan<input required value={orderNumber} onChange={(event) => { setOrderNumber(event.target.value); setSimulationResult(null); }} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-normal outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20" /></label><label className="block space-y-1.5 text-xs font-bold text-slate-700">Nominal pembayaran<input required min="1000" type="number" value={amount} onChange={(event) => { setAmount(event.target.value); setSimulationResult(null); }} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-normal outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20" /><span className="block text-[11px] font-normal text-slate-500">Minimal Rp1.000.</span></label><label className="block space-y-1.5 text-xs font-bold text-slate-700">Metode pembayaran<select value={paymentMethod} onChange={(event) => { setPaymentMethod(event.target.value as ChannelKey); setSimulationResult(null); }} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20">{availableChannels.map((key) => <option key={key} value={key}>{CHANNEL_LABELS[key].name}</option>)}</select></label><button type="submit" className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"><Play className="h-4 w-4" /> Jalankan simulasi</button></div><div className="space-y-4"><div><p className="mb-2 text-xs font-bold text-slate-700">Payload yang akan dikirim</p><pre className="overflow-x-auto rounded-xl bg-slate-900 p-4 text-xs leading-6 text-slate-100">{JSON.stringify(paymentPayload, null, 2)}</pre></div>{simulationResult ? <div aria-live="polite" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4"><p className="flex items-center gap-2 text-sm font-bold text-emerald-800"><CheckCircle2 className="h-5 w-5" /> Simulasi berhasil</p><dl className="mt-3 space-y-2 text-xs text-emerald-900"><div className="flex justify-between gap-4"><dt>ID pembayaran</dt><dd className="font-mono font-bold">{simulationResult.paymentId}</dd></div><div className="flex justify-between gap-4"><dt>Status</dt><dd className="font-bold">{simulationResult.status}</dd></div><div className="flex justify-between gap-4"><dt>Berlaku hingga</dt><dd className="font-bold">{simulationResult.expiresAt}</dd></div></dl></div> : <div className="rounded-xl border border-dashed border-slate-300 p-5 text-center"><CreditCard className="mx-auto h-7 w-7 text-slate-300" /><p className="mt-2 text-xs text-slate-500">Hasil simulasi akan muncul di sini.</p></div>}</div></form></section></div>}
    </div>
  );
}

function ChannelToggle({ checked, name, description, onChange }: { checked: boolean; name: string; description: string; onChange: () => void }) {
  return <label className={`flex cursor-pointer items-start justify-between gap-4 rounded-xl border p-4 transition-colors ${checked ? "border-indigo-200 bg-indigo-50/50" : "border-slate-200 hover:bg-slate-50"}`}><span><span className="block text-sm font-bold text-slate-900">{name}</span><span className="mt-1 block text-xs leading-5 text-slate-500">{description}</span></span><span className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? "bg-indigo-600" : "bg-slate-200"}`}><input type="checkbox" checked={checked} onChange={onChange} className="sr-only" /><span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-xs transition-transform ${checked ? "translate-x-5" : "translate-x-0.5"}`} /></span></label>;
}
