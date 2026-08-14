"use client";

import { useState, type FormEvent } from "react";
import { CheckCircle2, Mail, Search, ShieldCheck, Trash2, UserPlus, Users, X } from "lucide-react";
import type { Role } from "@dotads/auth";

interface MemberRow {
  id: string;
  name: string;
  email: string;
  role: Role;
  joinedAt: string;
  status: "active" | "invited";
}

const roleLabels: Partial<Record<Role, string>> = {
  TENANT_OWNER: "Pemilik Toko",
  ADMIN: "Administrator",
  ADVERTISER: "Pengelola Iklan",
  CUSTOMER_SERVICE: "Layanan Pelanggan",
};

const roleDescriptions: Partial<Record<Role, string>> = {
  ADMIN: "Mengelola operasional toko dan seluruh pengaturan.",
  ADVERTISER: "Mengelola iklan, pelacakan, dan pembuat halaman.",
  CUSTOMER_SERVICE: "Menangani pesanan dan komunikasi pelanggan.",
};

const invitationRoles: Role[] = ["ADMIN", "ADVERTISER", "CUSTOMER_SERVICE"];

const initialMembers: MemberRow[] = [
  { id: "mem_1", name: "Alpha Owner", email: "owner@store-alpha.com", role: "TENANT_OWNER", joinedAt: "1 Agustus 2026", status: "active" },
  { id: "mem_2", name: "Budi Ops", email: "ops@store-alpha.com", role: "ADMIN", joinedAt: "5 Agustus 2026", status: "active" },
  { id: "mem_3", name: "Siti Media", email: "ads@store-alpha.com", role: "ADVERTISER", joinedAt: "10 Agustus 2026", status: "active" },
  { id: "mem_4", name: "Dewi CS", email: "cs@store-alpha.com", role: "CUSTOMER_SERVICE", joinedAt: "12 Agustus 2026", status: "active" },
];

export default function AdminMembersPage() {
  const [members, setMembers] = useState(initialMembers);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("ADMIN");
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("");

  const filteredMembers = members.filter((member) => `${member.name} ${member.email}`.toLowerCase().includes(search.toLowerCase()));

  const notify = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3000);
  };

  const handleInvite = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const email = inviteEmail.trim().toLowerCase();
    if (members.some((member) => member.email === email)) {
      notify("Email tersebut sudah menjadi anggota atau telah diundang.");
      return;
    }
    setMembers((current) => [...current, {
      id: `mem_${Date.now()}`,
      name: email.split("@")[0],
      email,
      role: inviteRole,
      joinedAt: "Menunggu diterima",
      status: "invited",
    }]);
    setInviteEmail("");
    setInviteRole("ADMIN");
    setShowInviteModal(false);
    notify(`Undangan berhasil dikirim ke ${email}.`);
  };

  const updateRole = (id: string, role: Role) => {
    setMembers((current) => current.map((member) => member.id === id ? { ...member, role } : member));
    notify("Peran anggota berhasil diperbarui.");
  };

  const removeMember = (member: MemberRow) => {
    if (member.role === "TENANT_OWNER") {
      notify("Pemilik toko tidak dapat dihapus dari tim.");
      return;
    }
    setMembers((current) => current.filter((item) => item.id !== member.id));
    notify(member.status === "invited" ? "Undangan dibatalkan." : `${member.name} telah dihapus dari tim.`);
  };

  return (
    <div className="space-y-6 pb-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-indigo-600"><Users className="h-4 w-4" /> Tim & Hak Akses</div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Anggota & Peran</h1>
          <p className="mt-1 text-sm text-slate-500">Undang rekan kerja dan atur akses sesuai tanggung jawabnya.</p>
        </div>
        <button onClick={() => setShowInviteModal(true)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/20"><UserPlus className="h-4 w-4" /> Undang Anggota</button>
      </header>

      {notice && <div role="status" aria-live="polite" className="flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-medium text-indigo-700"><CheckCircle2 className="h-4 w-4" /> {notice}</div>}

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5">
          <label className="relative block max-w-sm"><span className="sr-only">Cari anggota</span><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari nama atau email..." className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20" /></label>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50/80 text-xs uppercase tracking-wider text-slate-500"><tr><th className="px-5 py-3 font-semibold">Anggota</th><th className="px-5 py-3 font-semibold">Peran</th><th className="px-5 py-3 font-semibold">Status</th><th className="px-5 py-3 font-semibold">Bergabung</th><th className="px-5 py-3 text-right font-semibold">Tindakan</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMembers.map((member) => (
                <tr key={member.id} className="transition-colors hover:bg-slate-50/70">
                  <td className="px-5 py-4"><p className="font-bold text-slate-900">{member.name}</p><p className="mt-0.5 text-xs text-slate-500">{member.email}</p></td>
                  <td className="px-5 py-4">
                    {member.role === "TENANT_OWNER" ? <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-700"><ShieldCheck className="h-3.5 w-3.5" /> {roleLabels[member.role]}</span> : (
                      <select value={member.role} onChange={(event) => updateRole(member.id, event.target.value as Role)} className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20">
                        {invitationRoles.map((role) => <option key={role} value={role}>{roleLabels[role]}</option>)}
                      </select>
                    )}
                  </td>
                  <td className="px-5 py-4"><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${member.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{member.status === "active" ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Mail className="h-3.5 w-3.5" />}{member.status === "active" ? "Aktif" : "Undangan dikirim"}</span></td>
                  <td className="px-5 py-4 text-slate-500">{member.joinedAt}</td>
                  <td className="px-5 py-4 text-right"><button onClick={() => removeMember(member)} aria-label={member.status === "invited" ? "Batalkan undangan" : "Hapus anggota"} title={member.status === "invited" ? "Batalkan undangan" : "Hapus anggota"} className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 className="h-4 w-4" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredMembers.length === 0 && <div className="p-8 text-center text-sm text-slate-500">Tidak ada anggota yang cocok dengan pencarian.</div>}
        </div>
      </section>

      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="invite-title">
          <form onSubmit={handleInvite} className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 p-5"><div><h2 id="invite-title" className="text-lg font-bold text-slate-900">Undang Anggota Baru</h2><p className="mt-1 text-xs text-slate-500">Undangan akan dikirim melalui email dan berlaku selama 7 hari.</p></div><button type="button" onClick={() => setShowInviteModal(false)} aria-label="Tutup" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button></div>
            <div className="space-y-5 p-5">
              <label className="space-y-1.5 text-xs font-semibold text-slate-700"><span className="block">Alamat email</span><input required autoFocus type="email" placeholder="rekan@tokoanda.id" value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-normal outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20" /></label>
              <fieldset><legend className="mb-2 text-xs font-semibold text-slate-700">Pilih peran</legend><div className="space-y-2">{invitationRoles.map((role) => <label key={role} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors ${inviteRole === role ? "border-indigo-300 bg-indigo-50" : "border-slate-200 hover:bg-slate-50"}`}><input type="radio" name="invite-role" value={role} checked={inviteRole === role} onChange={() => setInviteRole(role)} className="mt-1 accent-indigo-600" /><span><span className="block text-sm font-semibold text-slate-900">{roleLabels[role]}</span><span className="mt-0.5 block text-xs text-slate-500">{roleDescriptions[role]}</span></span></label>)}</div></fieldset>
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-100 p-5"><button type="button" onClick={() => setShowInviteModal(false)} className="rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100">Batal</button><button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"><Mail className="h-4 w-4" /> Kirim Undangan</button></div>
          </form>
        </div>
      )}
    </div>
  );
}
