import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { AuthGuard } from "@/components/layout/AuthGuard";

export const metadata: Metadata = {
  title: "Dashboard | White Line CRM",
  description: "Operations dashboard for White Line CRM.",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <AppShell>{children}</AppShell>
    </AuthGuard>
  );
}
