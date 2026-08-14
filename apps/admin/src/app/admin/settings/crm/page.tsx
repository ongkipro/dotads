"use client";

import { useRef, useState } from "react";
import { Check, CheckCircle2, MessageSquare, Save, Sparkles } from "lucide-react";

type TemplateType = "ORDER_CONFIRMATION" | "SHIPPING_UPDATE" | "PAYMENT_REMINDER";

interface Template {
  type: TemplateType;
  label: string;
  content: string;
  enabled: boolean;
}

const CRM_VARIABLES = [
  { label: "Nama pelanggan", key: "{customerName}" },
  { label: "Nomor pesanan", key: "{orderNumber}" },
  { label: "Nama toko", key: "{storeName}" },
  { label: "Jasa pengiriman", key: "{courier}" },
  { label: "Nomor resi", key: "{waybill}" },
  { label: "Total transaksi", key: "{totalAmount}" },
];

export default function CRMSettingsPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const [templates, setTemplates] = useState<Record<TemplateType, Template>>({
    ORDER_CONFIRMATION: {
      type: "ORDER_CONFIRMATION",
      label: "Konfirmasi pesanan COD baru",
      content: "Halo Kak {customerName},\n\nTerima kasih telah berbelanja di {storeName}! Pesanan Anda dengan nomor *{orderNumber}* senilai *{totalAmount}* telah kami terima dan sedang diproses.\n\nMohon konfirmasi apakah alamat pengirimannya sudah benar.",
      enabled: true,
    },
    SHIPPING_UPDATE: {
      type: "SHIPPING_UPDATE",
      label: "Pembaruan resi & pengiriman",
      content: "Halo Kak {customerName},\n\nKabar baik! Paket pesanan *{orderNumber}* dari {storeName} telah dikirim melalui *{courier}* dengan nomor resi *{waybill}*.\n\nSilakan cek status pengiriman secara berkala.",
      enabled: true,
    },
    PAYMENT_REMINDER: {
      type: "PAYMENT_REMINDER",
      label: "Pengingat pembayaran QRIS / VA",
      content: "Halo Kak {customerName},\n\nPembayaran pesanan *{orderNumber}* di {storeName} senilai *{totalAmount}* masih menunggu penyelesaian.\n\nSilakan selesaikan pembayaran sebelum batas waktunya berakhir.",
      enabled: true,
    },
  });

  const [activeTab, setActiveTab] = useState<TemplateType>("ORDER_CONFIRMATION");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const showNotification = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      showNotification("Pengaturan template pesan WhatsApp CRM berhasil disimpan!");
    }, 500);
  };

  const handleTemplateChange = (val: string) => {
    setTemplates({
      ...templates,
      [activeTab]: {
        ...templates[activeTab],
        content: val,
      },
    });
  };

  const insertVariable = (variableKey: string) => {
    const textarea = textareaRef.current;
    const currentText = templates[activeTab].content;
    const selectionStart = textarea?.selectionStart ?? currentText.length;
    const selectionEnd = textarea?.selectionEnd ?? currentText.length;
    const nextText = `${currentText.slice(0, selectionStart)}${variableKey}${currentText.slice(selectionEnd)}`;
    setTemplates({
      ...templates,
      [activeTab]: {
        ...templates[activeTab],
        content: nextText,
      },
    });
    setCopiedKey(variableKey);
    window.setTimeout(() => {
      setCopiedKey(null);
      textarea?.focus();
      textarea?.setSelectionRange(selectionStart + variableKey.length, selectionStart + variableKey.length);
    }, 0);
  };

  const currentTpl = templates[activeTab];

  return (
    <div className="space-y-6 pb-8 max-w-5xl relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white text-sm font-semibold px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-top-3 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            Pengaturan Pesan WhatsApp CRM
          </h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
            Atur pesan WhatsApp otomatis untuk konfirmasi COD, pembaruan resi, dan pengingat pembayaran.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-colors"
        >
          {isSaving ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          <span>{isSaving ? "Menyimpan..." : "Simpan Pengaturan"}</span>
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Left Tab List */}
        <div className="md:col-span-1 space-y-2">
          {(Object.keys(templates) as TemplateType[]).map((type) => {
            const t = templates[type];
            return (
              <button
                key={type}
                onClick={() => setActiveTab(type)}
                className={`w-full text-left p-3.5 rounded-xl border font-bold text-xs transition-all ${
                  activeTab === type
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs"
                    : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Right Editor & Preview */}
        <div className="md:col-span-3 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-2xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">{currentTpl.label}</h2>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={currentTpl.enabled}
                  onChange={(e) =>
                    setTemplates({
                      ...templates,
                      [activeTab]: {
                        ...currentTpl,
                        enabled: e.target.checked,
                      },
                    })
                  }
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                />
                <span>Aktifkan Pesan Otomatis</span>
              </label>
            </div>

            {/* Variable Chips */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Sisipkan variabel dinamis
              </label>
              <div className="flex flex-wrap gap-2">
                {CRM_VARIABLES.map((v) => (
                  <button
                    key={v.key}
                    onClick={() => insertVariable(v.key)}
                    className="inline-flex items-center gap-1 text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 rounded-lg transition-colors"
                  >
                    {copiedKey === v.key ? <Check className="w-3 h-3 text-emerald-500" /> : <Sparkles className="w-3 h-3 text-indigo-500" />}
                    <span>{v.label} ({v.key})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Message Content Textarea */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
                Isi Draf Pesan WhatsApp
              </label>
              <textarea
                ref={textareaRef}
                rows={7}
                value={currentTpl.content}
                onChange={(e) => handleTemplateChange(e.target.value)}
                className="w-full px-3 py-2.5 text-xs font-medium border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 leading-relaxed font-sans"
              />
            </div>
          </div>

          {/* WhatsApp Chat Bubble Mock Preview */}
          <div className="bg-emerald-950/20 border border-emerald-900/30 rounded-xl p-6 shadow-inner">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-4">
              <MessageSquare className="w-4 h-4" />
              <span>Pratinjau pesan pelanggan</span>
            </div>

            <div className="max-w-md bg-emerald-100 dark:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 text-slate-900 dark:text-slate-100 rounded-2xl rounded-tl-none p-4 text-xs leading-relaxed shadow-sm">
              <div className="whitespace-pre-wrap">
                {currentTpl.content
                  .replaceAll("{customerName}", "Budi Santoso")
                  .replaceAll("{orderNumber}", "ORD-991021")
                  .replaceAll("{storeName}", "Alpha Store")
                  .replaceAll("{courier}", "JNE Express")
                  .replaceAll("{waybill}", "MNTR-8899211")
                  .replaceAll("{totalAmount}", "Rp270.000")}
              </div>
              <div className="text-[10px] text-emerald-700 dark:text-emerald-300 text-right font-medium mt-2">
                10:15 ✔✔
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
