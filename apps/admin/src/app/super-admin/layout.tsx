"use client";

import React, { useState } from "react";
import type { Role } from "@dotads/auth";
import { AdminSidebar } from "@/components/AdminSidebar";

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<Role>("SUPER_ADMIN");

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans text-slate-900">
      <AdminSidebar currentRole={role} onRoleChange={setRole} />
      <main className="flex-1 overflow-y-auto w-full">
        <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
          {children}
        </div>
      </main>
    </div>
  );
}
