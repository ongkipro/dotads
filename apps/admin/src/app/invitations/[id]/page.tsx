import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { InvitationAcceptanceCard, InvitationReloadButton } from "@/components/InvitationAcceptanceCard";
import { fetchInvitationAuthState, isInvitationId } from "@/lib/invitation-acceptance";

export default async function InvitationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isInvitationId(id)) return <InvitationUnavailable title="Tautan undangan tidak valid" detail="Periksa kembali tautan lengkap yang dibagikan kepada Anda." />;
  const path = `/invitations/${id}`;
  const authState = await fetchInvitationAuthState((await cookies()).toString());
  if (authState === "unauthenticated") redirect(`/login?returnTo=${encodeURIComponent(path)}`);
  if (authState === "unavailable") return <InvitationUnavailable title="Sesi belum dapat diverifikasi" detail="Layanan sesi belum dapat memastikan akun yang sedang masuk." retry />;
  return <InvitationAcceptanceCard id={id} />;
}

function InvitationUnavailable({ title, detail, retry = false }: { title: string; detail: string; retry?: boolean }) {
  return <main className="flex min-h-[100dvh] items-center justify-center bg-slate-50 p-4"><section role="alert" className="w-full max-w-lg rounded-2xl border border-amber-200 bg-white p-6 shadow-sm"><AlertTriangle className="h-10 w-10 text-amber-700" /><h1 className="mt-4 text-xl font-bold text-slate-950">{title}</h1><p className="mt-2 text-sm leading-6 text-slate-600">{detail}</p><div className="mt-6 flex flex-col gap-3 sm:flex-row"><a href="/" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 px-4 text-sm font-bold text-slate-700">Kembali</a>{retry && <InvitationReloadButton />}</div></section></main>;
}
