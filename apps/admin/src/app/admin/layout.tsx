"use client";

import React, { useState } from "react";
import type { Role } from "@dotads/auth";
import { AdminSidebar } from "@/components/AdminSidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<Role>("TENANT_OWNER");

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminSidebar currentRole={role} onRoleChange={setRole} />
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
