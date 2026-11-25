"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { AlertTriangle, ExternalLink, FolderKanban, LayoutDashboard, LogOut, Menu, X } from "lucide-react";
import { AdminDataProvider, useAdminData } from "./data";

const NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/cases", label: "Reports", icon: FolderKanban },
  { href: "/admin/escalations", label: "Deadlines", icon: AlertTriangle },
];

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { cases } = useAdminData();
  const overdue = cases?.filter((c) => c.overdue).length ?? 0;
  return (
    <nav className="flex h-full flex-col gap-1 p-4" aria-label="Admin">
      <Link href="/admin" className="mb-6 flex items-center gap-3 px-2" onClick={onNavigate}>
        <span className="grid size-10 place-items-center rounded-lg bg-white p-1">
          {/* eslint-disable-next-line @next/next/no-img-element -- static SVG logo */}
          <img src="/brand/aacma-logo-tight.svg" alt="" className="size-full" />
        </span>
        <span>
          <span className="block tracking-wide text-brand-blue-text">AACMA</span>
          <span className="block text-xs text-slate-400">Operations dashboard</span>
        </span>
      </Link>
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${active ? "bg-brand-blue/15 text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}
          >
            <Icon className={`size-4 ${active ? "text-brand-blue-text" : ""}`} aria-hidden />
            {label}
            {href === "/admin/escalations" && overdue > 0 && (
              <span className="ml-auto rounded-full bg-red-500/20 px-2 text-xs tabular-nums text-red-300">{overdue}</span>
            )}
          </Link>
        );
      })}
      <div className="mt-auto space-y-1 border-t border-line pt-4">
        <Link href="/" target="_blank" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-400 transition-colors hover:text-white">
          <ExternalLink className="size-4" aria-hidden /> Public website
        </Link>
        <button
          type="button"
          onClick={async () => {
            await fetch("/api/admin/login", { method: "DELETE" });
            router.replace("/admin/login");
            router.refresh();
          }}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-400 transition-colors hover:text-white"
        >
          <LogOut className="size-4" aria-hidden /> Sign out
        </button>
      </div>
    </nav>
  );
}

function ReportLoadError() {
  const { cases, error, refresh } = useAdminData();
  if (!error) return null;

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-300/30 bg-amber-300/10 px-4 py-3 text-sm text-amber-100" role="status">
      <p>{cases ? "Reports could not be refreshed. Showing the last loaded results." : "Reports could not be loaded."}</p>
      <button type="button" onClick={() => void refresh()} className="font-medium underline underline-offset-4">Try again</button>
    </div>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <AdminDataProvider>
      <div className="flex min-h-dvh bg-base">
        <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 border-r border-line bg-deep lg:block">
          <Sidebar />
        </aside>
        {open && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} aria-hidden />
            <aside className="absolute inset-y-0 left-0 w-72 animate-panel border-r border-line bg-deep">
              <button type="button" className="absolute right-3 top-3 rounded-md p-1.5 text-slate-400" onClick={() => setOpen(false)} aria-label="Close menu">
                <X className="size-5" aria-hidden />
              </button>
              <Sidebar onNavigate={() => setOpen(false)} />
            </aside>
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="sticky top-0 z-30 border-b border-line bg-deep px-4 py-2 lg:hidden">
            <button type="button" className="inline-flex items-center gap-2 rounded-md p-2 text-sm text-slate-200" onClick={() => setOpen(true)} aria-expanded={open}>
              <Menu className="size-5" aria-hidden /> Menu
            </button>
          </div>
          <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
            <ReportLoadError />
            {children}
          </main>
        </div>
      </div>
    </AdminDataProvider>
  );
}
