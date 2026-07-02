import DashboardShell from "@/components/dashboard-shell";
import { getDashboardPayload, getViewer } from "@/lib/dashboard";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [payload, viewer] = await Promise.all([
    getDashboardPayload(),
    getViewer()
  ]);

  return <DashboardShell initialPayload={payload} viewer={viewer} />;
}
