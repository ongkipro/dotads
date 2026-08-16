import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SessionUnavailable } from "@/components/SessionUnavailable";
import { WorkspacePicker } from "@/components/WorkspacePicker";
import { fetchSessionContext } from "@/lib/session-context";
import { tenantAdminLandingPath } from "@/lib/admin-route-access";

export default async function RootPage() {
  const session = await fetchSessionContext((await cookies()).toString());

  if (session.status === "unauthenticated") redirect("/login");
  if (session.status === "workspace_selection_required") return <WorkspacePicker />;
  if (session.status === "unavailable") return <SessionUnavailable message={session.message} />;
  if (session.context.role === "SUPER_ADMIN") redirect("/super-admin");
  if (session.context.role === "END_BUYER") {
    return <SessionUnavailable message="Akun pembeli tidak memiliki workspace CMS." />;
  }

  redirect(tenantAdminLandingPath(session.context.role));
}
