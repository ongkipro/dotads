"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  AlertCircle, CheckCircle2, ClipboardCopy, Clock3, Mail, RefreshCw, Search, ShieldCheck,
  Trash2, UserPlus, Users, X,
} from "lucide-react";
import {
  AdminMembersError,
  cancelMemberInvitation,
  inviteAdminMember,
  listAdminMembers,
  removeAdminMember,
  resendMemberInvitation,
  updateAdminMemberRole,
  type AdminMember,
  type InvitationRole,
  type MemberDirectory,
  type MemberInvitation,
  type MemberRole,
} from "@/lib/admin-members";
import { parseSessionContext, type SessionContext } from "@/lib/session-context";
import { isInvitationId } from "@/lib/invitation-acceptance";

const roleLabels: Record<MemberRole, string> = {
  TENANT_OWNER: "Pemilik Toko",
  ADMIN: "Admin Toko",
  ADVERTISER: "Pengelola Iklan",
  CUSTOMER_SERVICE: "Layanan Pelanggan",
};

const roleDescriptions: Record<InvitationRole, string> = {
  ADMIN: "Mengelola operasional toko; pengaturan anggota tetap hanya-baca.",
  ADVERTISER: "Mengelola katalog, builder, dan pelacakan iklan.",
  CUSTOMER_SERVICE: "Menangani pesanan, katalog, dan melihat anggota tim.",
};

const invitationRoles: InvitationRole[] = ["ADMIN", "ADVERTISER", "CUSTOMER_SERVICE"];
const memberRoles: MemberRole[] = ["TENANT_OWNER", ...invitationRoles];
const formatDate = (value: string) => new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta",
}).format(new Date(value)) + " WIB";

function mutationMessage(error: unknown): string {
  if (!(error instanceof AdminMembersError)) return error instanceof Error ? error.message : "Permintaan tidak dapat diproses.";
  if (error.status === 409) {
    const known: Record<string, string> = {
      "The last tenant owner cannot be demoted": "Pemilik terakhir tidak dapat diturunkan perannya.",
      "Use an ownership-transfer workflow to change your own role": "Peran akun Anda sendiri tidak dapat diubah dari layar ini.",
      "Member changed before the role update completed": "Data anggota berubah. Muat ulang sebelum mencoba lagi.",
      "The last tenant owner cannot be removed": "Pemilik terakhir tidak dapat dihapus.",
      "You cannot remove your own active membership": "Anda tidak dapat menghapus keanggotaan sendiri.",
      "Only pending invitations can be resent": "Hanya undangan yang masih tercatat pending yang dapat diperpanjang.",
      "Only unexpired pending invitations can be cancelled": "Undangan ini sudah kedaluwarsa atau tidak lagi pending. Muat ulang data.",
      "This email is already an organization member": "Email ini sudah menjadi anggota organisasi.",
      "A pending invitation already exists for this email": "Undangan pending untuk email ini sudah ada.",
    };
    return known[error.message] ?? "Terjadi konflik data. Muat ulang sebelum mencoba lagi.";
  }
  if (error.status === 403) return "Akun Anda tidak memiliki izin untuk tindakan ini.";
  if (error.status === 404) return "Data tidak lagi tersedia. Muat ulang daftar anggota.";
  return error.message;
}

export default function AdminMembersPage() {
  const [directory, setDirectory] = useState<MemberDirectory | null>(null);
  const [session, setSession] = useState<SessionContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [notice, setNotice] = useState("");
  const [actionError, setActionError] = useState("");
  const [pendingKey, setPendingKey] = useState("");
  const [search, setSearch] = useState("");
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<InvitationRole>("ADMIN");

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const [data, sessionResponse] = await Promise.all([
        listAdminMembers(),
        fetch("/api/v1/session", { credentials: "same-origin", cache: "no-store" }),
      ]);
      const context = sessionResponse.ok ? parseSessionContext(await sessionResponse.json().catch(() => null)) : null;
      if (!context) throw new Error("Konteks sesi tidak tersedia. Masuk kembali untuk melanjutkan.");
      setDirectory(data);
      setSession(context);
    } catch (error) {
      setLoadError(mutationMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const canMutate = session?.role === "TENANT_OWNER";
  const ownerCount = directory?.members.filter((member) => member.role === "TENANT_OWNER").length ?? 0;
  const query = search.trim().toLowerCase();
  const filteredMembers = useMemo(() => directory?.members.filter((member) =>
    `${member.name} ${member.email} ${roleLabels[member.role]}`.toLowerCase().includes(query)
  ) ?? [], [directory, query]);
  const filteredInvitations = useMemo(() => directory?.invitations.filter((invitation) =>
    `${invitation.email} ${roleLabels[invitation.role]}`.toLowerCase().includes(query)
  ) ?? [], [directory, query]);

  async function mutate(key: string, request: () => Promise<unknown>, success: string): Promise<boolean> {
    setPendingKey(key);
    setActionError("");
    setNotice("");
    try {
      await request();
      setNotice(success);
      await load();
      return true;
    } catch (error) {
      setActionError(mutationMessage(error));
      if (error instanceof AdminMembersError && (error.status === 404 || error.status === 409)) await load();
      return false;
    } finally {
      setPendingKey("");
    }
  }

  async function handleInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = inviteEmail.trim().toLowerCase();
    const saved = await mutate("invite", () => inviteAdminMember({ email, role: inviteRole }),
      "Catatan undangan disimpan. Email belum dikirim; salin tautan penerimaan dan bagikan secara manual hanya kepada pemilik alamat email yang diundang.");
    if (!saved) return;
    setInviteEmail("");
    setInviteRole("ADMIN");
    setShowInvite(false);
  }

  if (loading && !directory) return <MembersState icon={<RefreshCw className="h-6 w-6 animate-spin" />} title="Memuat anggota tim" detail="Mengambil data anggota dan undangan terbaru." />;
  if (loadError && !directory) return <MembersState icon={<AlertCircle className="h-6 w-6" />} title="Anggota tim tidak dapat dimuat" detail={loadError} action={<button onClick={() => void load()} className="min-h-11 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white">Coba lagi</button>} />;

  return (
    <div className="space-y-6 pb-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-indigo-600"><Users className="h-4 w-4" /> Tim & Hak Akses</div><h1 className="text-2xl font-bold tracking-tight text-slate-900">Anggota & Peran</h1><p className="mt-1 max-w-2xl text-sm text-slate-500">Kelola akses organisasi berdasarkan tanggung jawab. Perubahan selalu divalidasi ulang oleh server.</p></div>
        {canMutate && <button disabled={!!pendingKey} onClick={() => setShowInvite(true)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 disabled:opacity-60"><UserPlus className="h-4 w-4" /> Buat Undangan</button>}
      </header>

      {!canMutate && <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600"><strong className="text-slate-800">Akses hanya-baca.</strong> Hanya Pemilik Toko yang dapat membuat undangan, mengubah peran, atau menghapus anggota.</div>}
      {loadError && directory && <div role="alert" className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between"><span>Data terbaru belum dapat dimuat: {loadError}</span><button onClick={() => void load()} className="min-h-11 shrink-0 rounded-xl border border-amber-300 px-4 font-semibold hover:bg-amber-100">Muat ulang</button></div>}
      {notice && <div role="status" aria-live="polite" className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> {notice}</div>}
      {actionError && <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> <span>{actionError}</span></div>}

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <label className="relative block max-w-md"><span className="sr-only">Cari anggota atau undangan</span><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari nama, email, atau peran..." className="min-h-11 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20" /></label>
      </div>

      {directory && directory.members.length === 0 && directory.invitations.length === 0 ? (
        <MembersState icon={<Users className="h-6 w-6" />} title="Belum ada anggota" detail="Organisasi ini belum memiliki anggota atau undangan yang dapat ditampilkan." />
      ) : filteredMembers.length === 0 && filteredInvitations.length === 0 ? (
        <MembersState icon={<Search className="h-6 w-6" />} title="Tidak ada hasil" detail={`Tidak ada anggota atau undangan yang cocok dengan “${search.trim()}”.`} action={<button onClick={() => setSearch("")} className="min-h-11 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-700">Hapus pencarian</button>} />
      ) : <>
        {filteredMembers.length > 0 && <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 px-5 py-4"><h2 className="font-bold text-slate-900">Anggota aktif</h2><p className="mt-1 text-xs text-slate-500">{filteredMembers.length} anggota terlihat</p></div><div className="divide-y divide-slate-100">{filteredMembers.map((member) => <MemberItem key={member.id} member={member} canMutate={canMutate} isSelf={session?.userId === member.userId} isLastOwner={member.role === "TENANT_OWNER" && ownerCount <= 1} busy={!!pendingKey} pending={pendingKey === `member:${member.id}`} onRole={(role) => { if (window.confirm(`Ubah peran ${member.name || member.email} menjadi ${roleLabels[role]}?`)) void mutate(`member:${member.id}`, () => updateAdminMemberRole(member.id, role), "Perubahan peran berhasil diproses."); }} onRemove={() => { if (window.confirm(`Hapus ${member.name || member.email} dari organisasi? Aksesnya akan langsung dicabut.`)) void mutate(`member:${member.id}`, () => removeAdminMember(member.id), "Penghapusan anggota berhasil diproses."); }} />)}</div></section>}

        {filteredInvitations.length > 0 && <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 px-5 py-4"><h2 className="font-bold text-slate-900">Undangan</h2><p className="mt-1 text-xs text-slate-500">Email belum dikirim otomatis. Pemilik Toko harus membagikan tautan penerimaan secara manual kepada pemilik persis alamat email yang diundang.</p></div><div className="divide-y divide-slate-100">{filteredInvitations.map((invitation) => <InvitationItem key={invitation.id} invitation={invitation} canMutate={canMutate} busy={!!pendingKey} pending={pendingKey === `invite:${invitation.id}`} onResend={() => void mutate(`invite:${invitation.id}`, () => resendMemberInvitation(invitation.id), "Masa berlaku undangan diperpanjang. Catatan tersimpan, tetapi email belum dikirim.")} onCancel={() => { if (window.confirm(`Batalkan undangan untuk ${invitation.email}?`)) void mutate(`invite:${invitation.id}`, () => cancelMemberInvitation(invitation.id), "Undangan dibatalkan dan dihapus dari daftar pending."); }} />)}</div></section>}
      </>}

      {showInvite && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="invite-title"><form onSubmit={handleInvite} className="max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl"><div className="flex items-start justify-between border-b border-slate-100 p-5"><div><h2 id="invite-title" className="text-lg font-bold text-slate-900">Buat Undangan Anggota</h2><p className="mt-1 text-xs text-slate-500">Berlaku 7 hari. Pengiriman email belum tersedia.</p></div><button type="button" onClick={() => setShowInvite(false)} aria-label="Tutup dialog undangan" className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button></div><div className="space-y-5 p-5"><div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">Catatan undangan akan disimpan, tetapi email tidak dikirim karena layanan delivery belum dikonfigurasi. Setelah tersimpan, salin tautan dan bagikan manual hanya kepada pemilik email yang diundang.</div><label className="space-y-1.5 text-xs font-semibold text-slate-700"><span className="block">Alamat email</span><input required autoFocus type="email" maxLength={255} placeholder="rekan@tokoanda.id" value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} className="min-h-11 w-full rounded-lg border border-slate-200 px-3 text-sm font-normal outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20" /></label><fieldset><legend className="mb-2 text-xs font-semibold text-slate-700">Peran</legend><div className="space-y-2">{invitationRoles.map((role) => <label key={role} className={`flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border p-3 ${inviteRole === role ? "border-indigo-300 bg-indigo-50" : "border-slate-200 hover:bg-slate-50"}`}><input type="radio" name="invite-role" value={role} checked={inviteRole === role} onChange={() => setInviteRole(role)} className="mt-1 accent-indigo-600" /><span><span className="block text-sm font-semibold text-slate-900">{roleLabels[role]}</span><span className="mt-0.5 block text-xs text-slate-500">{roleDescriptions[role]}</span></span></label>)}</div></fieldset></div><div className="flex flex-col-reverse gap-3 border-t border-slate-100 p-5 sm:flex-row sm:justify-end"><button type="button" disabled={pendingKey === "invite"} onClick={() => setShowInvite(false)} className="min-h-11 rounded-xl px-5 text-sm font-semibold text-slate-700 hover:bg-slate-100">Batal</button><button type="submit" disabled={pendingKey === "invite"} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white disabled:opacity-60">{pendingKey === "invite" ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />} Simpan Undangan</button></div></form></div>}
    </div>
  );
}

function MemberItem({ member, canMutate, isSelf, isLastOwner, busy, pending, onRole, onRemove }: { member: AdminMember; canMutate: boolean; isSelf: boolean; isLastOwner: boolean; busy: boolean; pending: boolean; onRole: (role: MemberRole) => void; onRemove: () => void }) {
  const locked = !canMutate || isSelf || isLastOwner || busy;
  return <article className="grid gap-4 p-5 md:grid-cols-[minmax(0,1.4fr)_minmax(180px,.7fr)_auto] md:items-center"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="truncate font-bold text-slate-900">{member.name || "Nama belum tersedia"}</h3>{isSelf && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-600">Anda</span>}</div><p className="mt-1 break-all text-sm text-slate-500">{member.email}</p><p className="mt-1 text-xs text-slate-400">Bergabung {formatDate(member.createdAt)}</p></div><div>{member.role === "TENANT_OWNER" && locked ? <span className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 text-xs font-bold text-indigo-700"><ShieldCheck className="h-3.5 w-3.5" /> {roleLabels[member.role]}</span> : <label className="block text-xs font-semibold text-slate-600"><span className="sr-only">Peran {member.name}</span><select value={member.role} disabled={locked} onChange={(event) => { const role = event.target.value as MemberRole; onRole(role); event.currentTarget.value = member.role; }} className="min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 disabled:bg-slate-50 disabled:text-slate-500">{memberRoles.map((role) => <option key={role} value={role}>{roleLabels[role]}</option>)}</select></label>} {isLastOwner && <p className="mt-1 text-[11px] text-slate-500">Pemilik terakhir dilindungi.</p>}</div>{canMutate && <button type="button" disabled={locked} onClick={onRemove} aria-label={`Hapus ${member.name || member.email}`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-rose-200 px-4 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-45">{pending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Hapus</button>}</article>;
}

function InvitationItem({ invitation, canMutate, busy, pending, onResend, onCancel }: { invitation: MemberInvitation; canMutate: boolean; busy: boolean; pending: boolean; onResend: () => void; onCancel: () => void }) {
  const expired = invitation.status === "expired";
  const [copyState, setCopyState] = useState<{ kind: "idle" | "copied" | "manual"; link: string }>({ kind: "idle", link: "" });
  async function copyLink() { const link = `${window.location.origin}/invitations/${encodeURIComponent(invitation.id)}`; try { if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable"); await navigator.clipboard.writeText(link); setCopyState({ kind: "copied", link }); } catch { setCopyState({ kind: "manual", link }); } }
  return <article className="grid gap-4 p-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="break-all font-bold text-slate-900">{invitation.email}</h3><span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${expired ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"}`}>{expired ? <AlertCircle className="h-3.5 w-3.5" /> : <Clock3 className="h-3.5 w-3.5" />}{expired ? "Kedaluwarsa" : "Pending"}</span></div><p className="mt-1 text-sm text-slate-600">{roleLabels[invitation.role]} · {expired ? "Berakhir" : "Berlaku hingga"} {formatDate(invitation.expiresAt)}</p><p className="mt-1 text-xs text-amber-700">Catatan tersimpan · Email belum dikirim · Bagikan manual hanya kepada pemilik email ini</p>{copyState.kind === "copied" && <p role="status" className="mt-2 text-xs font-semibold text-emerald-700">Tautan berhasil disalin.</p>}{copyState.kind === "manual" && <label className="mt-2 block text-xs font-semibold text-rose-700">Clipboard tidak tersedia. Salin tautan manual:<input readOnly value={copyState.link} onFocus={(event) => event.currentTarget.select()} className="mt-1 min-h-11 w-full rounded-lg border border-rose-200 bg-rose-50 px-3 font-normal text-slate-800" /></label>}</div>{canMutate && <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">{!expired && isInvitationId(invitation.id) && <button type="button" disabled={busy} onClick={() => void copyLink()} className="col-span-2 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-indigo-200 px-4 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 disabled:opacity-50"><ClipboardCopy className="h-4 w-4" /> {copyState.kind === "copied" ? "Tersalin" : "Salin tautan"}</button>}<button type="button" disabled={busy} onClick={onResend} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">{pending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Perpanjang</button><button type="button" disabled={busy || expired} onClick={onCancel} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-rose-200 px-4 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-45"><X className="h-4 w-4" /> Batalkan</button></div>}</article>;
}

function MembersState({ icon, title, detail, action }: { icon: React.ReactNode; title: string; detail: string; action?: React.ReactNode }) {
  return <div className="flex min-h-72 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center"><div className="mb-3 rounded-full bg-slate-100 p-3 text-slate-500">{icon}</div><h2 className="font-bold text-slate-900">{title}</h2><p className="mt-1 max-w-md text-sm text-slate-500">{detail}</p>{action && <div className="mt-5">{action}</div>}</div>;
}
