import { Suspense } from "react";
import { AdminShell } from "@/components/admin/Shell";

// The dashboard reads the URL (active nav, case id), so it renders inside Suspense (Cache Components).
export default function DashLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-base" />}>
      <AdminShell>{children}</AdminShell>
    </Suspense>
  );
}
