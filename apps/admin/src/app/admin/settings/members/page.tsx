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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Team Members & RBAC Permissions</h1>
          <p className="text-xs text-slate-500">Manage organization team members, roles, and invitation lifecycles</p>
        </div>

        <button
          onClick={() => setShowInviteModal(true)}
          className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs px-4 py-2 rounded-lg shadow-xs transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          <span>Invite Team Member</span>
        </button>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-semibold uppercase">
                <th className="py-2.5 px-3">Member Name</th>
                <th className="py-2.5 px-3">Email Address</th>
                <th className="py-2.5 px-3">Assigned Role</th>
                <th className="py-2.5 px-3">Joined Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {members.map((mem) => (
                <tr key={mem.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-3 font-semibold text-slate-900">{mem.name}</td>
                  <td className="py-3 px-3 text-slate-600 font-mono">{mem.email}</td>
                  <td className="py-3 px-3">
                    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                      <ShieldCheck className="w-3 h-3" />
                      <span>{mem.role}</span>
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-500">{mem.joinedAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Invite New Member</h3>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Email Address</label>
              <input
                type="email"
                placeholder="colleague@store-alpha.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Role Assignment</label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as Role)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
              >
                <option value="ADMIN">ADMIN (Full Store Operations)</option>
                <option value="ADVERTISER">ADVERTISER (Ads, Pixel, Builders)</option>
                <option value="CUSTOMER_SERVICE">CUSTOMER_SERVICE (Order Intake & CS)</option>
              </select>
            </div>

            <div className="flex justify-end space-x-2 border-t border-slate-100 pt-4">
              <button
                onClick={() => setShowInviteModal(false)}
                className="px-4 py-1.5 text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 rounded font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleInvite}
                className="px-4 py-1.5 text-xs text-white bg-indigo-600 hover:bg-indigo-700 rounded font-semibold"
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
