"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ShieldAlert, Loader2, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function SuperAdminSetupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [securityConfirm, setSecurityConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    
    if (securityConfirm !== "SAYA MENGERTI") {
      setError("Ketik 'SAYA MENGERTI' untuk mengonfirmasi pemberian akses penuh.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/v1/public/auth/bootstrap-superadmin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.status === 403) {
         throw new Error("Sistem sudah diinisialisasi. Super admin lain tidak dapat dibuat melalui halaman ini.");
      }

      if (!res.ok) {
        throw new Error(data.error || data.message || "Gagal menyiapkan super admin.");
      }

      setSuccess("Super admin berhasil dibuat. Anda sekarang dapat masuk.");
      
      setTimeout(() => {
        router.replace("/");
        router.refresh();
      }, 1500);
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950 p-4 py-12">
      <Card className="w-full max-w-lg border-red-200 dark:border-red-900 shadow-sm">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <ShieldAlert className="h-6 w-6 text-red-600 dark:text-red-500" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Inisialisasi super admin</CardTitle>
          <CardDescription className="text-red-600 dark:text-red-400 font-medium">
            Pengaturan awal administrator sistem. Proses ini hanya dapat dilakukan sekali.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <ShieldAlert className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert className="border-green-500/50 text-green-600 dark:border-green-500/50 dark:text-green-500 bg-green-50 dark:bg-green-950/20">
                <CheckCircle2 className="h-4 w-4 !text-green-600 dark:!text-green-500" />
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">Nama lengkap</Label>
              <Input
                id="name"
                placeholder="Nama administrator"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isLoading || !!success}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Alamat email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@dotads.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading || !!success}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Kata sandi utama</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading || !!success}
              />
            </div>
            <div className="space-y-2 p-4 bg-gray-100 dark:bg-gray-900 rounded-lg mt-6">
              <Label htmlFor="securityConfirm" className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">Konfirmasi keamanan</Label>
              <p className="text-sm mb-3">Ketik <strong className="select-all">SAYA MENGERTI</strong> untuk mengonfirmasi pemberian akses penuh ke akun ini.</p>
              <Input
                id="securityConfirm"
                placeholder="SAYA MENGERTI"
                value={securityConfirm}
                onChange={(e) => setSecurityConfirm(e.target.value)}
                required
                disabled={isLoading || !!success}
              />
            </div>
            <Button className="w-full" variant="destructive" type="submit" disabled={isLoading || !!success}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Buat super admin pertama
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <div className="text-sm text-center text-gray-500 dark:text-gray-400">
             <Link href="/login" className="hover:underline">
              Kembali ke halaman masuk
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
