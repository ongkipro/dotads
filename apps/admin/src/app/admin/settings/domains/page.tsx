"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Check, CheckCircle2, Clock, Copy, Globe, Plus, ShieldCheck, Trash2, X } from "lucide-react";

interface DomainItem {
  id: string;
  hostname: string;
  isPrimary: boolean;
  status: "verified" | "pending";
  sslStatus: "active" | "provisioning";
  verificationToken: string;
}

const initialDomains: DomainItem[] = [
  { id: "dom_1", hostname: "store-alpha.com", isPrimary: true, status: "verified", sslStatus: "active", verificationToken: "dotads-verify-alpha-998811" },
  { id: "dom_2", hostname: "shop.mybrand.id", isPrimary: false, status: "pending", sslStatus: "provisioning", verificationToken: "dotads-verify-mybrand-772211" },
];

export default function AdminDomainsPage() {
  const [domains, setDomains] = useState(initialDomains);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newHostname, setNewHostname] = useState("");
  const [selectedDomainId, setSelectedDomainId] = useState<string | null>(null);
  const [copiedRecord, setCopiedRecord] = useState("");
  const [notice, setNotice] = useState("");

  const selectedDomain = useMemo(() => domains.find((domain) => domain.id === selectedDomainId) ?? null, [domains, selectedDomainId]);

  const notify = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3000);
  };

  const handleAddDomain = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const hostname = newHostname.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "");
    if (!hostname || domains.some((domain) => domain.hostname === hostname)) {
      notify("Nama domain kosong atau sudah terdaftar.");
      return;
    }
    const id = `dom_${Date.now()}`;
    const newDomain: DomainItem = {
      id,
      hostname,
      isPrimary: domains.length === 0,
      status: "pending",
      sslStatus: "provisioning",
      verificationToken: `dotads-verify-${Math.random().toString(36).slice(2, 10)}`,
    };
    setDomains((current) => [...current, newDomain]);
    setNewHostname("");
    setShowAddModal(false);
    setSelectedDomainId(id);
  };

  const copyRecord = async (label: string, value: string) => {
    await navigator.clipboard?.writeText(value);
    setCopiedRecord(label);
    window.setTimeout(() => setCopiedRecord(""), 1500);
  };

  const verifyDomain = () => {
    if (!selectedDomain) return;
    setDomains((current) => current.map((domain) => domain.id === selectedDomain.id ? { ...domain, status: "verified", sslStatus: "active" } : domain));
    notify(`DNS ${selectedDomain.hostname} berhasil diverifikasi dan SSL sudah aktif.`);
    setSelectedDomainId(null);
  };

  const setPrimary = (id: string) => {
    setDomains((current) => current.map((domain) => ({ ...domain, isPrimary: domain.id === id })));
    notify("Domain utama berhasil diperbarui.");
  };

  const removeDomain = (domain: DomainItem) => {
    if (domain.isPrimary) {
      notify("Pilih domain utama lain sebelum menghapus domain ini.");
      return;
    }
    setDomains((current) => current.filter((item) => item.id !== domain.id));
    notify(`${domain.hostname} berhasil dihapus.`);
  };

  return (
    <div className="space-y-6 pb-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-indigo-600"><Globe className="h-4 w-4" /> Domain & DNS</div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Domain Kustom</h1>
          <p className="mt-1 text-sm text-slate-500">Hubungkan domain milik Anda, verifikasi DNS, dan pantau sertifikat SSL.</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/20"><Plus className="h-4 w-4" /> Tambah Domain</button>
      </header>

      {notice && <div role="status" aria-live="polite" className="flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-medium text-indigo-700"><CheckCircle2 className="h-4 w-4" /> {notice}</div>}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {domains.map((domain) => (
          <article key={domain.id} className="flex flex-col justify-between gap-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div className="flex min-w-0 items-start gap-4">
                <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600"><Globe className="h-6 w-6" /></div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2"><h2 className="truncate text-base font-bold text-slate-900">{domain.hostname}</h2>{domain.isPrimary && <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-700">Utama</span>}</div>
                  <div className={`mt-2 inline-flex items-center gap-1.5 text-xs font-semibold ${domain.sslStatus === "active" ? "text-emerald-700" : "text-amber-700"}`}>
                    {domain.sslStatus === "active" ? <ShieldCheck className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                    SSL {domain.sslStatus === "active" ? "aktif" : "sedang diterbitkan"}
                  </div>
                </div>
              </div>
              <span className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold ${domain.status === "verified" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}>
                {domain.status === "verified" ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}{domain.status === "verified" ? "Terverifikasi" : "Menunggu DNS"}
              </span>
            </div>
            <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
              <button onClick={() => setSelectedDomainId(domain.id)} className="rounded-lg bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100">{domain.status === "verified" ? "Lihat Catatan DNS" : "Verifikasi DNS"}</button>
              {!domain.isPrimary && <button onClick={() => setPrimary(domain.id)} className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200">Jadikan Utama</button>}
              <button onClick={() => removeDomain(domain)} className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50"><Trash2 className="h-3.5 w-3.5" /> Hapus</button>
            </div>
          </article>
        ))}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="add-domain-title">
          <form onSubmit={handleAddDomain} className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 p-5"><div><h2 id="add-domain-title" className="text-lg font-bold text-slate-900">Tambah Domain Kustom</h2><p className="mt-1 text-xs text-slate-500">Masukkan domain yang sudah Anda miliki.</p></div><button type="button" onClick={() => setShowAddModal(false)} aria-label="Tutup" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button></div>
            <div className="p-5"><label className="space-y-1.5 text-xs font-semibold text-slate-700"><span className="block">Nama domain</span><div className="relative"><Globe className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" /><input required autoFocus type="text" placeholder="promo.tokosaya.id" value={newHostname} onChange={(event) => setNewHostname(event.target.value)} className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-3 font-mono text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20" /></div></label></div>
            <div className="flex justify-end gap-3 border-t border-slate-100 p-5"><button type="button" onClick={() => setShowAddModal(false)} className="rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100">Batal</button><button type="submit" className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">Tambahkan</button></div>
          </form>
        </div>
      )}

      {selectedDomain && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="dns-title">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 p-5"><div><h2 id="dns-title" className="text-lg font-bold text-slate-900">Verifikasi DNS</h2><p className="mt-1 text-xs text-slate-500">Tambahkan kedua catatan berikut di penyedia DNS untuk {selectedDomain.hostname}.</p></div><button onClick={() => setSelectedDomainId(null)} aria-label="Tutup" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button></div>
            <div className="space-y-4 p-5">
              {[
                { label: "CNAME", name: "@", value: "ingress.dotads.com" },
                { label: "TXT", name: "_dotads-challenge", value: selectedDomain.verificationToken },
              ].map((record) => (
                <div key={record.label} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="grid gap-3 text-xs sm:grid-cols-[80px_1fr_2fr_auto] sm:items-end">
                    <div><p className="font-semibold text-slate-500">Jenis</p><p className="mt-1 font-bold text-indigo-700">{record.label}</p></div>
                    <div><p className="font-semibold text-slate-500">Nama/Host</p><code className="mt-1 block text-slate-900">{record.name}</code></div>
                    <div className="min-w-0"><p className="font-semibold text-slate-500">Target/Nilai</p><code className="mt-1 block overflow-x-auto text-slate-900">{record.value}</code></div>
                    <button onClick={() => copyRecord(record.label, record.value)} className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-white px-3 py-2 font-semibold text-slate-700 shadow-xs hover:bg-slate-100">{copiedRecord === record.label ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}{copiedRecord === record.label ? "Disalin" : "Salin"}</button>
                  </div>
                </div>
              ))}
              <p className="text-xs leading-relaxed text-slate-500">Perubahan DNS dapat memerlukan waktu hingga 24 jam. Anda dapat memeriksa ulang kapan saja tanpa mengubah catatan tersebut.</p>
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-100 p-5"><button onClick={() => setSelectedDomainId(null)} className="rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100">Tutup</button>{selectedDomain.status === "pending" && <button onClick={verifyDomain} className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">Periksa DNS Sekarang</button>}</div>
          </div>
        </div>
      )}
    </div>
  );
}
