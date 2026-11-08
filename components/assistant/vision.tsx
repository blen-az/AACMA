"use client";

import { useRef, type ReactNode } from "react";
import { AlertTriangle, Brain, CheckCircle2, CircleSlash, HelpCircle, ImageUp, Loader2, Recycle } from "lucide-react";
import type { Assessment, Message } from "@/lib/complaint/machine";
import { tv, tvAny, type VisionKey } from "@/lib/i18n/vision-strings";
import type { Lang } from "@/lib/i18n/strings";
import { useAssistant } from "./AssistantProvider";

/** Opens the photo picker for "what waste is this?". */
export function PhotoQuestionButton({ className, children, label }: { className: string; children: ReactNode; label?: string }) {
  const { askAboutPhoto, state } = useAssistant();
  const input = useRef<HTMLInputElement>(null);
  return (
    <>
      <button type="button" className={className} onClick={() => input.current?.click()} disabled={state.busy} aria-label={label}>
        {children}
      </button>
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          askAboutPhoto(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </>
  );
}

const RECYCLE_ICON = { yes: Recycle, no: CircleSlash, depends: HelpCircle } as const;
const RECYCLE_COLOR = { yes: "text-brand-green-text", no: "text-slate-400", depends: "text-amber-300" } as const;

export function IdentifyItems({ m }: { m: Message }) {
  if (!m.items?.length) return null;
  return (
    <ul className="mt-3 space-y-2 border-t border-white/10 pt-3">
      {m.items.map((it, i) => {
        const Icon = RECYCLE_ICON[it.recyclable] ?? HelpCircle;
        const hazardous = it.category === "hazardous" || it.category === "electronic";
        return (
          <li key={i} className="rounded-lg bg-base/60 p-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-white">{it.name}</span>
              <span className={`rounded-full px-2 py-0.5 text-[11px] ${hazardous ? "bg-red-500/15 text-red-300" : "bg-white/10 text-slate-300"}`}>
                {tvAny(m.lang, `cat_${it.category}`)}
              </span>
              <span className={`inline-flex items-center gap-1 text-[11px] ${RECYCLE_COLOR[it.recyclable]}`}>
                <Icon className="size-3.5" aria-hidden /> {tv(m.lang, `recyclable_${it.recyclable}` as VisionKey)}
              </span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-slate-300">{it.handling}</p>
          </li>
        );
      })}
    </ul>
  );
}

const SEVERITY_STYLE = {
  low: "bg-emerald-500/15 text-emerald-300 border-emerald-400/30",
  medium: "bg-amber-500/15 text-amber-200 border-amber-400/30",
  high: "bg-orange-500/20 text-orange-200 border-orange-400/40",
  urgent: "bg-red-500/20 text-red-200 border-red-400/50",
} as const;

export function AssessmentCard({ a, lang }: { a: Assessment; lang: Lang }) {
  return (
    <div className="mt-3 rounded-xl border border-brand-blue-text/30 bg-deep/70 p-4" lang={lang}>
      <div className="flex items-start gap-2">
        <Brain className="mt-0.5 size-4 shrink-0 text-brand-blue-text" aria-hidden />
        <div>
          <div className="text-sm text-white">{tv(lang, "assessment_title")}</div>
          <div className="text-[11px] text-slate-400">{tv(lang, "assessment_for_staff")}</div>
        </div>
      </div>

      {a.status === "loading" && (
        <div className="mt-3 flex items-center gap-2 text-sm text-slate-300" role="status">
          <Loader2 className="size-4 animate-spin" aria-hidden /> {tv(lang, "analysing")}
        </div>
      )}
      {a.status === "error" && <p className="mt-3 text-sm text-slate-400">{tv(lang, "assessment_failed")}</p>}

      {a.status === "done" && a.data && (
        <div className="mt-3 space-y-3 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400">{tv(lang, "label_priority")}</span>
            <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${SEVERITY_STYLE[a.data.severity]}`}>
              {a.data.severity === "urgent" && <AlertTriangle className="size-3.5" aria-hidden />}
              {tv(lang, `severity_${a.data.severity}` as VisionKey)}
            </span>
            <span className="text-xs text-slate-500">
              · {tv(lang, "label_confidence")}: {tv(lang, `conf_${a.data.confidence}` as VisionKey)}
            </span>
          </div>
          <p className="text-slate-200">{a.data.scene_summary}</p>

          {a.data.visible_waste.length > 0 && (
            <div>
              <div className="text-xs text-slate-400">
                {tv(lang, "label_visible")} · {tv(lang, "label_volume")}: {tv(lang, `volume_${a.data.estimated_volume}` as VisionKey)}
              </div>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {a.data.visible_waste.map((w, i) => (
                  <span key={i} className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-slate-200">
                    {w.item} <span className="text-slate-400">· {tvAny(lang, `cat_${w.category}`)}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {a.data.severity_reasons.length > 0 && (
            <div>
              <div className="text-xs text-slate-400">{tv(lang, "label_reasons")}</div>
              <ul className="mt-1 list-disc space-y-0.5 pl-5 text-slate-300">
                {a.data.severity_reasons.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </div>
          )}
          {a.data.risks.length > 0 && (
            <div>
              <div className="text-xs text-slate-400">{tv(lang, "label_risks")}</div>
              <ul className="mt-1 space-y-0.5 text-slate-300">
                {a.data.risks.map((r, i) => (
                  <li key={i} className="flex gap-1.5"><AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-300" aria-hidden />{r}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="rounded-lg bg-brand-blue/10 p-2.5">
            <div className="flex items-center gap-1.5 text-xs text-brand-blue-text">
              <CheckCircle2 className="size-3.5" aria-hidden /> {tv(lang, "label_action")}
            </div>
            <p className="mt-1 text-slate-200">{a.data.recommended_action}</p>
          </div>
          <p className="text-[11px] text-slate-500">{tv(lang, "assessment_note")}</p>
        </div>
      )}
    </div>
  );
}

export function PhotoChipContent({ lang }: { lang: Lang }) {
  return (
    <>
      <ImageUp className="size-4" aria-hidden /> {tv(lang, "opt_identify")}
    </>
  );
}
