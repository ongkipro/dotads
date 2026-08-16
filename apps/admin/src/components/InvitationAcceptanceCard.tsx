"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, LogIn, ShieldCheck } from "lucide-react";
import { acceptInvitation, InvitationAcceptanceError } from "@/lib/invitation-acceptance";

function errorCopy(error: unknown) {
  if (!(error instanceof InvitationAcceptanceError)) return { title: "Undangan belum dapat diterima", detail: "Terjadi gangguan yang tidak dikenali. Coba lagi." };
  if (error.code === "SESSION_REQUIRED") return { title: "Sesi Anda berakhir", detail: "Masuk kembali memakai email yang menerima undangan ini." };
  if (error.code === "UNTRUSTED_ORIGIN") return { title: "Permintaan ditolak", detail: "Buka undangan dari alamat resmi DotAds, lalu coba kembali." };
  if (error.code === "INVITATION_NOT_FOUND") return { title: "Undangan tidak ditemukan", detail: "Undangan tidak ada atau email akun yang masuk tidak sama dengan email penerima." };
  if (error.code === "INVITATION_NOT_ACCEPTABLE") return { title: "Undangan tidak dapat diterima", detail: "Undangan mungkin kedaluwarsa, dibatalkan, sudah diproses akun lain, atau workspace tidak aktif." };
  if (error.code === "INVALID_REQUEST") return { title: "Permintaan undangan tidak valid", detail: "Tautan undangan tidak dapat diproses." };
  return { title: "Layanan undangan sedang bermasalah", detail: error.message };
}

export function InvitationAcceptanceCard({ id }: { id: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const returnTo = `/invitations/${id}`;

  async function accept() {
    setPending(true); setError(null);
    try {
      await acceptInvitation(id);
      window.location.replace("/");
    } catch (cause) {
      setError(cause); setPending(false);
    }
  }

  const copy = error ? errorCopy(error) : null;
  return <main className="flex min-h-[100dvh] items-center justify-center bg-slate-50 p-4"><section className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8" aria-labelledby="accept-title"><span className="grid h-12 w-12 place-items-center rounded-xl bg-indigo-50 text-indigo-700"><ShieldCheck className="h-6 w-6" /></span><p className="mt-5 text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">Undangan workspace DotAds</p><h1 id="accept-title" className="mt-2 text-2xl font-extrabold tracking-tight text-slate-950">Terima akses workspace</h1><p className="mt-3 text-sm leading-6 text-slate-600">Pastikan Anda masuk menggunakan alamat email yang menerima tautan ini. Detail tenant dan peran akan diverifikasi oleh server setelah Anda memilih Terima undangan.</p><div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">Tautan ini bersifat pribadi. Jangan teruskan ke akun atau alamat email lain.</div>{copy && <div role="alert" className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-4"><div className="flex gap-2"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-700" /><div><h2 className="font-bold text-rose-900">{copy.title}</h2><p className="mt-1 text-sm leading-6 text-rose-800">{copy.detail}</p></div></div></div>}<div className="mt-6 grid gap-3 sm:grid-cols-2"><a href="/" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 px-5 text-sm font-bold text-slate-700 hover:bg-slate-50">Kembali</a>{error instanceof InvitationAcceptanceError && error.code === "SESSION_REQUIRED" ? <a href={`/login?returnTo=${encodeURIComponent(returnTo)}`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white"><LogIn className="h-4 w-4" /> Masuk kembali</a> : <button disabled={pending} onClick={() => void accept()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-60">{pending ? <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" /> : <CheckCircle2 className="h-4 w-4" />}{pending ? "Memproses…" : "Terima undangan"}</button>}</div></section></main>;
}

export function InvitationReloadButton() {
  return <button type="button" onClick={() => window.location.reload()} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white">Coba lagi</button>;
}
