import Link from "next/link";
import { AGENCY } from "@/content/site";
import { AssistantTrigger } from "./AssistantTrigger";

export function SiteFooter({ accent = "blue" }: { accent?: "blue" | "green" }) {
  const head = accent === "green" ? "text-brand-green-text" : "text-brand-blue-text";
  const hover = accent === "green" ? "hover:text-brand-green-text" : "hover:text-brand-blue-text";
  return (
    <footer className="border-t border-slate-800 bg-deep">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-3">
            <span className="grid size-12 place-items-center rounded-lg bg-white p-1">
              {/* eslint-disable-next-line @next/next/no-img-element -- static SVG logo */}
              <img src="/brand/aacma-logo-tight.svg" alt="" className="size-full" />
            </span>
            <div>
              <div className={`tracking-wide ${head}`}>{AGENCY.short}</div>
              <div className="text-sm text-slate-400">{AGENCY.name}</div>
            </div>
          </div>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-400">
            Information, cleansing-problem reporting and learning for the residents of Addis Ababa — in English and Amharic.
          </p>
        </div>
        <div>
          <h3 className={head}>Quick links</h3>
          <ul className="mt-4 space-y-2 text-sm">
            {[
              ["Services", "/#services"],
              ["About", "/#about"],
              ["Publications", "/#publications"],
              ["Virtual Training Centre", "/training"],
            ].map(([label, href]) => (
              <li key={href}>
                <Link href={href} className={`uppercase tracking-wide text-slate-400 transition-colors ${hover}`}>
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className={head}>Get help</h3>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <AssistantTrigger mode="question" className={`text-slate-400 transition-colors ${hover}`}>
                Ask the AI assistant
              </AssistantTrigger>
            </li>
            <li>
              <AssistantTrigger mode="complaint" className={`text-slate-400 transition-colors ${hover}`}>
                Report a cleansing problem
              </AssistantTrigger>
            </li>
          </ul>
        </div>
      </div>
      <div className="mx-auto max-w-7xl border-t border-slate-800 px-4 py-6 text-center text-xs text-slate-500 sm:px-6 lg:px-8">
        <p>© {2026} {AGENCY.short}</p>
      </div>
    </footer>
  );
}
