"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { AlertTriangle, ExternalLink, FolderKanban, LayoutDashboard, LogOut, Menu, RefreshCw, X } from "lucide-react";
import { AdminDataProvider, useAdminData } from "./data";

const NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/cases", label: "Cases", icon: FolderKanban },
  { href: "/admin/escalations", label: "Escalations", icon: AlertTriangle },
];

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { stats } = useAdminData();
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
            {href === "/admin/escalations" && stats && stats.totals.overdue > 0 && (
              <span className="ml-auto rounded-full bg-red-500/20 px-2 text-xs tabular-nums text-red-300">{stats.totals.overdue}</span>
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

function TopBar({ onMenu }: { onMenu: () => void }) {
  const { lastUpdated, refresh, error, store } = useAdminData();
  return (
    <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-line bg-deep/90 px-4 py-3 backdrop-blur sm:px-6">
      <button type="button" className="rounded-md p-1.5 text-slate-300 lg:hidden" onClick={onMenu} aria-label="Open menu">
        <Menu className="size-5" aria-hidden />
      </button>
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <span className="relative flex size-2">
          {!error && <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />}
          <span className={`relative inline-flex size-2 rounded-full ${error ? "bg-red-400" : "bg-emerald-400"}`} />
        </span>
        {error ? "Connection problem" : "Live"}
        {lastUpdated && <span className="hidden sm:inline">· updated {lastUpdated.toLocaleTimeString("en-GB")}</span>}
      </div>
      {store && (
        <span
          className={`hidden rounded-full px-2.5 py-0.5 text-[11px] sm:inline ${store === "firebase" ? "bg-amber-500/15 text-amber-200" : "bg-white/5 text-slate-400"}`}
          title={store === "firebase" ? "Website reports are stored in Firebase Realtime Database" : "Website reports are stored in .data/cases.json on this computer"}
        >
          {store === "firebase" ? "Firebase" : "Local storage"}
        </span>
      )}
      <div className="ml-auto flex items-center gap-1">
        <button type="button" onClick={() => void refresh()} className="rounded-md p-2 text-slate-400 transition-colors hover:text-white" aria-label="Refresh" title="Refresh">
          <RefreshCw className="size-4" aria-hidden />
        </button>
      </div>
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
          <TopBar onMenu={() => setOpen(true)} />
          <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">{children}</main>
        </div>
      </div>
    </AdminDataProvider>
  );
}
