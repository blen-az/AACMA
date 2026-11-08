"use client";

/**
 * Shared dashboard data: case list + stats, refreshed every 8 s so a report made on
 * the public site appears within seconds (with a toast).
 */
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { Stats } from "@/lib/cases/stats";
import type { CaseSummary } from "@/lib/cases/types";

type Toast = { id: string; reference: string; subcity: string | null };

type Ctx = {
  cases: CaseSummary[] | null;
  stats: Stats | null;
  error: string | null;
  lastUpdated: Date | null;
  store: "firebase" | "file" | null;
  refresh: () => Promise<void>;
  toasts: Toast[];
  dismissToast: (id: string) => void;
};

const AdminData = createContext<Ctx | null>(null);

export function useAdminData(): Ctx {
  const c = useContext(AdminData);
  if (!c) throw new Error("useAdminData outside provider");
  return c;
}

export async function adminFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { cache: "no-store", ...init });
  if (res.status === 401) {
    // Session expired: full reload so the proxy sends the user to the sign-in page.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = "/admin/login";
    throw new Error("unauthorized");
  }
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json() as Promise<T>;
}

export function AdminDataProvider({ children }: { children: ReactNode }) {
  const [cases, setCases] = useState<CaseSummary[] | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [store, setStore] = useState<"firebase" | "file" | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const known = useRef<Set<string> | null>(null);
  const router = useRouter();

  const refresh = useCallback(async () => {
    try {
      const [c, s] = await Promise.all([
        adminFetch<{ cases: CaseSummary[]; store: "firebase" | "file" }>("/api/admin/cases"),
        adminFetch<Stats>("/api/admin/stats"),
      ]);
      const live = c.cases.filter((x) => x.source === "web");
      if (known.current) {
        const fresh = live.filter((x) => !known.current!.has(x.id));
        if (fresh.length) setToasts((t) => [...fresh.map((x) => ({ id: x.id, reference: x.reference, subcity: x.subcity })), ...t].slice(0, 3));
      }
      known.current = new Set(live.map((x) => x.id));
      setCases(c.cases);
      setStore(c.store);
      setStats(s);
      setError(null);
      setLastUpdated(new Date());
    } catch (e) {
      setError(String(e));
    }
  }, []);

  useEffect(() => {
    void refresh();
    const t = setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, 8000);
    return () => clearInterval(t);
  }, [refresh]);

  useEffect(() => {
    if (toasts.length === 0) return;
    const t = setTimeout(() => setToasts((x) => x.slice(0, -1)), 20000);
    return () => clearTimeout(t);
  }, [toasts]);

  return (
    <AdminData.Provider
      value={{ cases, stats, error, lastUpdated, store, refresh, toasts, dismissToast: (id) => setToasts((t) => t.filter((x) => x.id !== id)) }}
    >
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex w-80 flex-col gap-2" aria-live="polite">
        {toasts.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setToasts((x) => x.filter((y) => y.id !== t.id));
              router.push(`/admin/cases/${t.id}`);
            }}
            className="animate-fade-up rounded-xl border border-brand-blue-text/40 bg-surface p-4 text-left shadow-2xl shadow-black/50 transition-colors hover:border-brand-blue-text"
          >
            <div className="flex items-center gap-2 text-xs text-brand-blue-text">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-brand-blue-text opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-brand-blue-text" />
              </span>
              New report from the website
            </div>
            <div className="mt-1 font-mono text-white">{t.reference}</div>
            <div className="text-sm text-slate-400">{t.subcity ?? "Sub-city not set"} · open case →</div>
          </button>
        ))}
      </div>
    </AdminData.Provider>
  );
}
