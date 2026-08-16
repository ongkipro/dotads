import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PlatformShell } from "@/components/PlatformShell";
import { SessionUnavailable } from "@/components/SessionUnavailable";
import { WorkspacePicker } from "@/components/WorkspacePicker";
import { fetchSessionContext } from "@/lib/session-context";

export default async function SuperAdminLayout({ children }: { children: ReactNode }) {
  const cookieHeader = (await cookies()).toString();
  const session = await fetchSessionContext(cookieHeader);

  if (session.status === "unauthenticated") redirect("/login");
  if (session.status === "workspace_selection_required") return <WorkspacePicker />;
  if (session.status === "unavailable") return <SessionUnavailable message={session.message} />;
  if (session.context.role !== "SUPER_ADMIN") redirect("/admin");

  return <PlatformShell userEmail={session.context.userEmail}>{children}</PlatformShell>;
}
