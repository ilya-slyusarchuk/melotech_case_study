import { DashboardShell } from "../../components/layout/dashboard-shell";

/**
 * Dashboard route group layout.
 *
 * All pages under (dashboard) share the authenticated shell with
 * top navigation and credit balance. Client-side auth checks happen
 * inside DashboardShell so server pages stay simple.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell>{children}</DashboardShell>;
}
