"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { SwitchAccountButton } from "@/components/SwitchAccountButton";

export function SessionUnavailable({ message }: { message: string }) {
  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-slate-50 p-4">
      <section role="alert" className="w-full max-w-lg rounded-xl border border-amber-200 bg-white p-6 shadow-sm">
        <span className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
          <AlertTriangle className="h-5 w-5" aria-hidden="true" />
        </span>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">Workspace belum dapat dibuka</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">{message}</p>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Identitas toko dan hak akses tidak akan diperkirakan. Coba muat ulang, atau masuk kembali jika sesi sudah berakhir.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button type="button" onClick={() => window.location.reload()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700">
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Coba lagi
          </button>
          <SwitchAccountButton />
        </div>
      </section>
    </main>
  );
}
