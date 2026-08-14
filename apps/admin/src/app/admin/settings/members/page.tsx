"use client";

import React, { useState } from "react";
import { Users, Plus, ShieldCheck, Mail, CheckCircle2, UserPlus } from "lucide-react";
import type { Role } from "@dotads/auth";

interface MemberRow {
  id: string;
  name: string;
  email: string;
  role: Role;
  joinedAt: string;
}

const SAMPLE_MEMBERS: MemberRow[] = [
  { id: "mem_1", name: "Alpha Owner", email: "owner@store-alpha.com", role: "TENANT_OWNER", joinedAt: "2026-08-01" },
  { id: "mem_2", name: "Budi Ops Manager", email: "ops@store-alpha.com", role: "ADMIN", joinedAt: "2026-08-05" },
  { id: "mem_3", name: "Siti Media Buyer", email: "ads@store-alpha.com", role: "ADVERTISER", joinedAt: "2026-08-10" },
  { id: "mem_4", name: "Dewi CS Specialist", email: "cs@store-alpha.com", role: "CUSTOMER_SERVICE", joinedAt: "2026-08-12" },
];

export default function AdminMembersPage() {
  const [members, setMembers] = useState<MemberRow[]>(SAMPLE_MEMBERS);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("ADMIN");

  const handleInvite = () => {
    if (!inviteEmail) return;
    const newMember: MemberRow = {
      id: `mem_${Date.now()}`,
      name: inviteEmail.split("@")[0],
      email: inviteEmail,
      role: inviteRole,
      joinedAt: new Date().toISOString().split("T")[0],
    };
    setMembers([...members, newMember]);
    setInviteEmail("");
    setShowInviteModal(false);
  };

  return (
    <div className="space-y-6 pb-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
            <Users className="h-4 w-4" /> Team & Access
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Members & Roles</h1>
          <p className="mt-1 text-sm text-slate-500">Manage organization team members, roles, and invitation lifecycles.</p>
        </div>

        <button
          onClick={() => setShowInviteModal(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/20"
        >
          <UserPlus className="h-4 w-4" />
          <span>Invite Member</span>
        </button>
      </header>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-5 py-3 font-semibold">Member Name</th>
                <th className="px-5 py-3 font-semibold">Email Address</th>
                <th className="px-5 py-3 font-semibold">Assigned Role</th>
                <th className="px-5 py-3 font-semibold">Joined Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {members.map((mem) => (
                <tr key={mem.id} className="transition-colors hover:bg-slate-50/70">
                  <td className="px-5 py-4 font-bold text-slate-900">{mem.name}</td>
                  <td className="px-5 py-4 text-slate-600">{mem.email}</td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      <span>{mem.role}</span>
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-500">{mem.joinedAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="border-b border-slate-100 p-5">
              <h3 className="text-lg font-bold text-slate-900">Invite New Member</h3>
              <p className="mt-1 text-xs text-slate-500">Send an email invitation to join your organization.</p>
            </div>

            <div className="space-y-4 p-5">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">Email Address</label>
                <input
                  type="email"
                  placeholder="colleague@store-alpha.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-normal outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">Role Assignment</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as Role)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20"
                >
                  <option value="ADMIN">ADMIN (Full Store Operations)</option>
                  <option value="ADVERTISER">ADVERTISER (Ads, Pixel, Builders)</option>
                  <option value="CUSTOMER_SERVICE">CUSTOMER_SERVICE (Order Intake & CS)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 p-5">
              <button
                onClick={() => setShowInviteModal(false)}
                className="rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-4 focus:ring-slate-500/20"
              >
                Cancel
              </button>
              <button
                onClick={handleInvite}
                className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/20"
              >
                Send Invitation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
