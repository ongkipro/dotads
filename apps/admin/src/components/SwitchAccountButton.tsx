"use client";

import { useId, useState } from "react";
import { LoaderCircle, LogOut } from "lucide-react";
import { requestSignOut } from "@/lib/sign-out";

interface SwitchAccountButtonProps {
  buttonClassName?: string;
  className?: string;
  showLabel?: boolean;
  tone?: "light" | "dark";
}

export function SwitchAccountButton({
  buttonClassName = "",
  className = "",
  showLabel = true,
  tone = "light",
}: SwitchAccountButtonProps) {
  const errorId = useId();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const switchAccount = async () => {
    setPending(true);
    setError(null);

    try {
      const response = await requestSignOut();

      if (!response.ok) throw new Error("Sign-out failed");
      window.location.assign("/login");
    } catch {
      setError("Anda belum berhasil keluar. Coba lagi.");
      setPending(false);
    }
  };

  const toneClasses = tone === "dark"
    ? "text-slate-300 hover:bg-slate-900 hover:text-white focus-visible:ring-indigo-400"
    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950 focus-visible:ring-indigo-500";

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => void switchAccount()}
        disabled={pending}
        aria-label={pending ? "Sedang keluar" : "Keluar dan gunakan akun lain"}
        aria-busy={pending}
        aria-describedby={error ? errorId : undefined}
        title="Keluar dan gunakan akun lain"
        className={`inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60 ${toneClasses} ${buttonClassName}`}
      >
        {pending ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <LogOut className="h-4 w-4" aria-hidden="true" />}
        {showLabel && <span>{pending ? "Sedang keluar…" : "Keluar dan ganti akun"}</span>}
      </button>
      {error && (
        <p id={errorId} role="alert" className="fixed bottom-20 right-4 z-[60] max-w-[calc(100vw-2rem)] rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800 shadow-lg md:bottom-4">
          {error}
        </p>
      )}
    </div>
  );
}
