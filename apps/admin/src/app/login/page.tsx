"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, Loader2, LockKeyhole, ShieldAlert, Store } from "lucide-react";
import Link from "next/link";
import { safeInvitationReturnTo } from "@/lib/invitation-acceptance";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const submittedValue = email.trim();
      const developmentAliases: Record<string, string> = {
        admin: "admin@dotads.local",
        merchant: "merchant@dotads.local",
      };
      const submittedEmail = process.env.NODE_ENV !== "production"
        ? developmentAliases[submittedValue.toLowerCase()] ?? submittedValue
        : submittedValue;
      const res = await fetch("/api/auth/sign-in/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: submittedEmail, password }),
      });

      await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(res.status === 429 ? "Terlalu banyak percobaan masuk. Tunggu sebentar lalu coba lagi." : "Email atau kata sandi tidak sesuai.");
      }

      const returnTo = safeInvitationReturnTo(new URLSearchParams(window.location.search).get("returnTo"));
      router.replace(returnTo);
      router.refresh();
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : "Akun belum dapat diperiksa. Coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="grid min-h-[100dvh] bg-slate-50 lg:grid-cols-[minmax(0,1fr)_minmax(420px,560px)]">
      <section className="hidden bg-slate-950 p-12 text-white lg:flex lg:flex-col lg:justify-between" aria-label="DotAds merchant CMS">
        <div className="flex items-center gap-3 text-lg font-extrabold tracking-tight"><span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-500">.</span>DotAds</div>
        <div className="max-w-xl">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-indigo-300">CMS Toko</p>
          <h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight">Kelola toko dari satu ruang kerja yang jelas.</h1>
          <p className="mt-4 max-w-lg text-base leading-7 text-slate-300">Pantau pesanan, katalog, dan akses tim dengan data dari toko yang sedang aktif.</p>
          <ul className="mt-8 space-y-3 text-sm text-slate-200">
            {["Konteks toko selalu terlihat", "Hak akses mengikuti peran tim", "Menu menyesuaikan peran akun"].map((item) => <li key={item} className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-emerald-400" aria-hidden="true" />{item}</li>)}
          </ul>
        </div>
        <p className="text-xs text-slate-500">DotAds Engine v2</p>
      </section>

      <section className="flex items-center justify-center p-4 sm:p-8" aria-labelledby="login-title">
      <Card className="w-full max-w-md border-slate-200 shadow-xl shadow-slate-200/50">
        <CardHeader className="space-y-3 text-left">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-indigo-50 text-indigo-700 lg:hidden"><Store className="h-5 w-5" aria-hidden="true" /></div>
          <CardTitle id="login-title" className="text-2xl font-extrabold tracking-tight text-slate-950">Masuk ke DotAds</CardTitle>
          <CardDescription className="leading-6">Gunakan akun tim Anda. Setelah masuk, pilih ruang kerja bila akun terhubung ke lebih dari satu toko.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <ShieldAlert className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type={process.env.NODE_ENV === "production" ? "email" : "text"}
                autoComplete="username"
                inputMode={process.env.NODE_ENV === "production" ? "email" : undefined}
                placeholder={process.env.NODE_ENV === "production" ? "nama@toko.id" : "Email, admin, atau merchant"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Kata sandi</Label>
              </div>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <Button className="w-full" type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? "Memeriksa akun…" : "Masuk"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="flex w-full items-start gap-2 rounded-lg bg-slate-50 p-3 text-xs leading-5 text-slate-600">
            <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
            <span>Ruang kerja dan kewenangan ditentukan oleh akun Anda. Hubungi pemilik toko jika menu yang dibutuhkan belum tersedia.</span>
          </div>
          <div className="text-center text-sm text-slate-500">
            Belum punya akun merchant?{" "}
            <Link href="/register" className="font-bold text-indigo-700 hover:underline">
              Buat toko
            </Link>
          </div>
        </CardFooter>
      </Card>
      </section>
    </main>
  );
}
