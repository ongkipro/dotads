import type { ReactNode } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { SessionUnavailable } from "@/components/SessionUnavailable";
import { TenantAdminShell } from "@/components/TenantAdminShell";
import { WorkspacePicker } from "@/components/WorkspacePicker";
import { fetchSessionContext } from "@/lib/session-context";
import { canAccessTenantAdminPath, tenantAdminLandingPath } from "@/lib/admin-route-access";
import { ADMIN_PATHNAME_HEADER } from "@/lib/request-path";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const cookieHeader = (await cookies()).toString();
  const session = await fetchSessionContext(cookieHeader);

  if (session.status === "unauthenticated") redirect("/login");
  if (session.status === "workspace_selection_required") return <WorkspacePicker />;
  if (session.status === "unavailable") return <SessionUnavailable message={session.message} />;
  if (session.context.role === "SUPER_ADMIN") redirect("/super-admin");
  if (session.context.role === "END_BUYER") {
    return <SessionUnavailable message="Akun pembeli tidak memiliki akses ke workspace admin." />;
  }
  if (session.context.tenantStatus !== "active") {
    return <SessionUnavailable message="Workspace toko sedang tidak aktif. Hubungi pengelola platform untuk memulihkan akses." />;
  }

  const pathname = (await headers()).get(ADMIN_PATHNAME_HEADER) || "/admin";
  const landing = tenantAdminLandingPath(session.context.role);
  if ((pathname === "/admin" && landing !== "/admin") || !canAccessTenantAdminPath(session.context.role, pathname)) redirect(landing);

  return <TenantAdminShell context={session.context}>{children}</TenantAdminShell>;
}
