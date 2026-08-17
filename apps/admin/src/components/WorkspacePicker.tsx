"use client";

import { useEffect, useState } from "react";
import { Building2, CheckCircle2, LoaderCircle, RefreshCw, ShieldAlert } from "lucide-react";
import { SwitchAccountButton } from "@/components/SwitchAccountButton";
import {
  listWorkspaces,
  selectWorkspace,
  type WorkspaceOption,
} from "@/lib/workspace-selection";

const ROLE_LABELS: Record<WorkspaceOption["role"], string> = {
  TENANT_OWNER: "Pemilik Toko",
  ADMIN: "Admin Toko",
  ADVERTISER: "Pengelola Iklan",
  CUSTOMER_SERVICE: "Layanan Pelanggan",
};

export function WorkspacePicker() {
  const [workspaces, setWorkspaces] = useState<WorkspaceOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectingId, setSelectingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setWorkspaces(await listWorkspaces());
    } catch (cause) {
      setError("Daftar ruang kerja belum dapat dimuat. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const choose = async (workspace: WorkspaceOption) => {
    setSelectingId(workspace.organizationId);
    setError(null);
    try {
      await selectWorkspace(workspace.organizationId);
      window.location.replace("/");
    } catch (cause) {
      setError("Ruang kerja belum berhasil dipilih. Coba lagi.");
      setSelectingId(null);
    }
  };

  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-slate-100 p-4 sm:p-6">
      <section aria-labelledby="workspace-picker-title" className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60">
        <header className="border-b border-slate-200 p-5 sm:p-6">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
            <Building2 className="h-5 w-5" aria-hidden="true" />
          </span>
          <p className="mt-4 text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">DotAds CMS</p>
          <h1 id="workspace-picker-title" className="mt-1 text-2xl font-bold tracking-tight text-slate-950">Pilih ruang kerja</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">Akun ini terhubung ke beberapa toko. Pilih ruang kerja untuk melanjutkan.</p>
        </header>

        <div className="space-y-4 p-5 sm:p-6" aria-busy={loading || Boolean(selectingId)}>
          {loading && (
            <div className="space-y-3" role="status" aria-label="Memuat daftar ruang kerja">
              {[0, 1].map((item) => <div key={item} className="h-20 animate-pulse rounded-xl bg-slate-100" />)}
            </div>
          )}

          {!loading && error && (
            <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
              <p className="font-semibold">{error}</p>
              {!selectingId && (
                <button type="button" onClick={() => void load()} className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-lg border border-rose-200 bg-white px-4 font-semibold hover:bg-rose-100">
                  <RefreshCw className="h-4 w-4" aria-hidden="true" /> Coba lagi
                </button>
              )}
            </div>
          )}

          {!loading && !error && workspaces.length === 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-center">
              <ShieldAlert className="mx-auto h-7 w-7 text-amber-700" aria-hidden="true" />
              <h2 className="mt-3 font-bold text-slate-900">Belum ada ruang kerja</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">Akun ini belum memiliki akses ke CMS toko.</p>
            </div>
          )}

          {!loading && workspaces.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {workspaces.map((workspace) => {
                const active = workspace.tenantStatus === "active";
                const statusLabel = active ? "Aktif" : workspace.tenantStatus === "suspended" ? "Ditangguhkan" : workspace.tenantStatus === "cancelled" ? "Dibatalkan" : "Tidak tersedia";
                const selecting = selectingId === workspace.organizationId;
                const workspaceName = workspace.organizationName || workspace.tenantName;
                const tenantDetail = workspaceName === workspace.tenantName ? null : workspace.tenantName;
                return (
                  <button
                    key={workspace.organizationId}
                    type="button"
                    onClick={() => void choose(workspace)}
                    disabled={!active || Boolean(selectingId)}
                    aria-label={`${workspaceName}, ${ROLE_LABELS[workspace.role]}, ${statusLabel}`}
                    className="group flex min-h-20 min-w-0 w-full items-center gap-3 rounded-xl border border-slate-200 p-4 text-left transition-colors hover:border-indigo-300 hover:bg-indigo-50/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-60"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700 group-disabled:bg-slate-200 group-disabled:text-slate-500">
                      {selecting ? <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" /> : <Building2 className="h-5 w-5" aria-hidden="true" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-bold text-slate-900">{workspaceName}</span>
                      <span className="mt-1 block truncate text-xs text-slate-500">{tenantDetail ? `${tenantDetail} · ` : ""}{ROLE_LABELS[workspace.role]} · {statusLabel}</span>
                    </span>
                    {active && !selecting && <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />}
                  </button>
                );
              })}
            </div>
          )}

          {!loading && (
            <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs leading-5 text-slate-500">Bukan ruang kerja yang dicari? Gunakan akun lain.</p>
              <SwitchAccountButton />
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
