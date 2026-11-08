"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { AGENCY } from "@/content/site";

export type NavItem = { label: string; href: string; external?: boolean };

export function SiteHeader({
  nav,
  subtitle = AGENCY.shortTagline,
  title = AGENCY.short,
  accent = "blue",
  homeHref = "/",
}: {
  nav: NavItem[];
  subtitle?: string;
  title?: string;
  accent?: "blue" | "green";
  homeHref?: string;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string>("");
  const accentText = accent === "green" ? "text-brand-green-text" : "text-brand-blue-text";
  const hover = accent === "green" ? "hover:text-brand-green-text" : "hover:text-brand-blue-text";

  // Highlight the section in view, as the template highlights the current page.
  useEffect(() => {
    // Watch the whole <section> each anchor sits in; a thin band near the top of the viewport decides.
    const targets = new Map<Element, string>();
    for (const n of nav) {
      const id = n.href.split("#")[1];
      const el = id ? document.getElementById(id) : null;
      if (el) targets.set(el.closest("section") ?? el, n.href);
    }
    if (targets.size === 0) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(targets.get(e.target) ?? "");
      },
      { rootMargin: "-25% 0px -70% 0px" },
    );
    targets.forEach((_, el) => io.observe(el));
    return () => io.disconnect();
  }, [nav]);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-deep/95 backdrop-blur supports-[backdrop-filter]:bg-deep/85">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link href={homeHref} className="flex min-w-0 items-center gap-3" onClick={() => setOpen(false)}>
          <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-white p-1 shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element -- static SVG logo */}
            <img src="/brand/aacma-logo-tight.svg" alt="AACMA logo" className="size-full" />
          </span>
          <span className="min-w-0">
            <span className={`block truncate tracking-wide ${accentText}`}>{title}</span>
            <span className="block truncate text-xs text-slate-400">{subtitle}</span>
          </span>
        </Link>

        <nav className="ml-auto hidden items-center gap-6 lg:flex" aria-label="Main">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              aria-current={active === n.href ? "true" : undefined}
              className={`text-sm uppercase tracking-wide transition-colors ${hover} ${active === n.href ? accentText : "text-slate-300"}`}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          className="ml-auto rounded-md p-2 text-slate-300 lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <X className="size-6" aria-hidden /> : <Menu className="size-6" aria-hidden />}
        </button>
      </div>

      {open && (
        <nav id="mobile-nav" className="animate-fade-up border-t border-slate-800 px-4 pb-4 lg:hidden" aria-label="Main">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              onClick={() => setOpen(false)}
              className={`block border-b border-slate-800/60 py-3 text-sm uppercase tracking-wide text-slate-300 transition-colors ${hover}`}
            >
              {n.label}
            </Link>
          ))}
        </nav>
      )}
      <span className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-brand-blue/0 via-brand-blue/70 to-brand-green/0" aria-hidden />
    </header>
  );
}
