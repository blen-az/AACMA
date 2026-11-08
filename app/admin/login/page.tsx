"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Lock } from "lucide-react";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    }).catch(() => null);
    setBusy(false);
    if (res?.ok) {
      router.replace("/admin");
      router.refresh();
      return;
    }
    setError(
      res?.status === 503
        ? "Admin access is not configured (set ADMIN_PASSWORD)."
        : res?.status === 429
          ? "Too many attempts. Please wait a minute."
          : "Incorrect password.",
    );
  }

  return (
    <main className="grid min-h-dvh place-items-center bg-base px-4">
      <form onSubmit={submit} className="w-full max-w-sm animate-fade-up rounded-2xl border border-line bg-surface p-8 shadow-2xl shadow-black/40">
        <div className="flex items-center gap-3">
          <span className="grid size-12 place-items-center rounded-lg bg-white p-1">
            {/* eslint-disable-next-line @next/next/no-img-element -- static SVG logo */}
            <img src="/brand/aacma-logo-tight.svg" alt="AACMA logo" className="size-full" />
          </span>
          <div>
            <h1 className="text-lg text-white">Operations dashboard</h1>
            <p className="text-sm text-slate-400">AACMA staff sign-in</p>
          </div>
        </div>
        <label htmlFor="password" className="mt-8 block text-sm text-slate-300">Password</label>
        <div className="relative mt-2">
          <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" aria-hidden />
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-line bg-base py-2.5 pl-9 pr-3 text-white focus:border-brand-blue-text focus:outline-none"
            required
            autoFocus
          />
        </div>
        {error && <p className="mt-3 text-sm text-red-300" role="alert">{error}</p>}
        <button
          type="submit"
          disabled={busy || !password}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-blue py-2.5 text-white transition-colors hover:bg-brand-blue-hover disabled:opacity-50"
        >
          {busy && <Loader2 className="size-4 animate-spin" aria-hidden />} Sign in
        </button>
      </form>
    </main>
  );
}
