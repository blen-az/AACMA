"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, ArrowLeft, Brain, ImageOff, Loader2, MapPin, Phone, RefreshCw, User } from "lucide-react";
import { adminFetch, useAdminData } from "@/components/admin/data";
import { OverdueBadge, Panel, SeverityBadge, SourceBadge, StatusBadge, dueIn, fmtDate, timeAgo } from "@/components/admin/ui";
import { formatPhone } from "@/lib/complaint/validators";
import { SUBCITY_NAMES, TEAMS } from "@/lib/cases/geo";
import { SLA_HOURS } from "@/lib/cases/sla";
import { SEVERITIES, SEVERITY_LABEL, STATUSES, STATUS_LABEL, type CaseDetail } from "@/lib/cases/types";

const select = "w-full rounded-lg border border-line bg-base px-3 py-2 text-sm text-slate-200 focus:border-brand-blue-text focus:outline-none disabled:opacity-50";
const CATEGORY: Record<string, string> = {
  organic: "Organic", plastic: "Plastic", paper_cardboard: "Paper & cardboard", metal: "Metal", glass: "Glass", textile: "Textile",
  electronic: "Electronic", hazardous: "Hazardous", construction_debris: "Construction debris", mixed_household: "Mixed household", other: "Other",
};

function Map({ lat, lng }: { lat: number; lng: number }) {
  const d = 0.008;
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - d},${lat - d},${lng + d},${lat + d}&layer=mapnik&marker=${lat},${lng}`;
  return (
    <div className="overflow-hidden rounded-lg border border-line">
      <iframe title="Report location" src={src} className="h-56 w-full [filter:invert(0.9)_hue-rotate(180deg)_brightness(0.95)]" loading="lazy" />
      <a href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}`} target="_blank" rel="noopener noreferrer" className="block bg-deep px-3 py-1.5 text-xs text-brand-blue-text hover:underline">
        Open larger map · {lat.toFixed(5)}, {lng.toFixed(5)}
      </a>
    </div>
  );
}

export default function CaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { refresh } = useAdminData();
  const [c, setC] = useState<CaseDetail | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState("");
  const [rerun, setRerun] = useState(false);

  const load = useCallback(async () => {
    try {
      setC(await adminFetch<CaseDetail>(`/api/admin/cases/${id}`));
    } catch (e) {
      if (String(e).includes("404")) setNotFound(true);
    }
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial load + polling while the AI assessment runs
    void load();
    const t = setInterval(() => void load(), 8000);
    return () => clearInterval(t);
  }, [load]);

  async function patch(body: Record<string, unknown>) {
    setSaving(true);
    try {
      setC(await adminFetch<CaseDetail>(`/api/admin/cases/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }));
      void refresh();
    } finally {
      setSaving(false);
    }
  }

  if (notFound) return <p className="text-slate-400">Case not found. <Link href="/admin/cases" className="text-brand-blue-text">Back to cases</Link></p>;
  if (!c) return <p className="flex items-center gap-2 text-slate-400"><Loader2 className="size-4 animate-spin" aria-hidden /> Loading case…</p>;

  const a = c.assessment;
  const open = c.status !== "resolved" && c.status !== "closed";

  return (
    <div className="space-y-6">
      <Link href="/admin/cases" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white">
        <ArrowLeft className="size-4" aria-hidden /> All cases
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-mono text-2xl text-white">{c.reference}</h1>
            <SourceBadge source={c.source} />
          </div>
          <p className="mt-1 text-sm text-slate-400">Received {fmtDate(c.createdAt)} ({timeAgo(c.createdAt)}) · reported in {c.lang === "am" ? "Amharic" : "English"}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SeverityBadge severity={c.severity} source={c.severitySource} />
          <StatusBadge status={c.status} />
          {c.overdue && <OverdueBadge />}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <Panel title="Report">
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                {c.hasPhoto ? (
                  <a href={`/api/admin/cases/${c.id}/photo`} target="_blank" rel="noopener noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element -- authenticated API image */}
                    <img src={`/api/admin/cases/${c.id}/photo`} alt="Photo submitted with the report" className="max-h-72 w-full rounded-lg border border-line object-cover" />
                  </a>
                ) : (
                  <div className="grid h-48 place-items-center rounded-lg border border-dashed border-line text-sm text-slate-500">
                    <span className="flex flex-col items-center gap-2"><ImageOff className="size-6" aria-hidden />{c.source === "sample" ? "Sample case — no photo" : "No photo"}</span>
                  </div>
                )}
              </div>
              <div className="space-y-4 text-sm">
                <div>
                  <div className="text-xs text-slate-400">Citizen&apos;s description</div>
                  <p className="mt-1 whitespace-pre-wrap text-slate-100" lang={c.lang}>{c.description}</p>
                </div>
                <div>
                  <div className="text-xs text-slate-400">Location</div>
                  <p className="mt-1 flex gap-1.5 text-slate-100">
                    <MapPin className="mt-0.5 size-4 shrink-0 text-brand-blue-text" aria-hidden />
                    <span lang={c.lang}>
                      {c.location.text ?? "Device location (GPS)"}
                      {c.location.accuracy ? <span className="text-slate-400"> · ±{c.location.accuracy} m</span> : null}
                    </span>
                  </p>
                </div>
                <div>
                  <div className="text-xs text-slate-400">Reporter</div>
                  <p className="mt-1 flex items-center gap-1.5 text-slate-100"><User className="size-4 text-slate-500" aria-hidden />{c.reporterName}</p>
                  {c.reporterPhone && (
                    <a href={`tel:${c.reporterPhone}`} className="mt-1 flex items-center gap-1.5 text-brand-blue-text hover:underline">
                      <Phone className="size-4" aria-hidden />{formatPhone(c.reporterPhone)}
                    </a>
                  )}
                </div>
              </div>
            </div>
            {c.location.lat !== undefined && c.location.lng !== undefined && <div className="mt-5"><Map lat={c.location.lat} lng={c.location.lng} /></div>}
          </Panel>

          <Panel
            title="AI preliminary assessment"
            subtitle="Suggests a priority from the photo and description. Staff decide."
            action={
              c.hasPhoto ? (
                <button
                  type="button"
                  disabled={rerun || c.assessmentStatus === "pending"}
                  onClick={async () => {
                    setRerun(true);
                    try {
                      setC(await adminFetch<CaseDetail>(`/api/admin/cases/${c.id}/assess`, { method: "POST" }));
                      void refresh();
                    } finally {
                      setRerun(false);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs text-slate-300 transition-colors hover:border-brand-blue-text hover:text-brand-blue-text disabled:opacity-50"
                >
                  <RefreshCw className={`size-3.5 ${rerun ? "animate-spin" : ""}`} aria-hidden /> Re-run
                </button>
              ) : null
            }
          >
            {(c.assessmentStatus === "pending" || rerun) && (
              <p className="flex items-center gap-2 text-sm text-slate-300"><Loader2 className="size-4 animate-spin" aria-hidden /> AI is analysing the photo…</p>
            )}
            {c.assessmentStatus === "error" && !rerun && <p className="text-sm text-slate-400">The AI assessment could not be completed. You can re-run it.</p>}
            {c.assessmentStatus === "none" && <p className="text-sm text-slate-400">No photo, so no AI assessment.</p>}
            {a && !rerun && c.assessmentStatus === "done" && (
              <div className="space-y-4 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <Brain className="size-4 text-brand-blue-text" aria-hidden />
                  <span className="text-slate-400">Suggested priority</span>
                  <SeverityBadge severity={a.severity} />
                  <span className="text-xs text-slate-500">confidence {a.confidence} · volume {a.estimated_volume.replace("_", " ")}</span>
                </div>
                <p className="text-slate-100">{a.scene_summary}</p>
                {a.visible_waste.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {a.visible_waste.map((w, i) => (
                      <span key={i} className={`rounded-full px-2 py-0.5 text-xs ${w.category === "hazardous" ? "bg-red-500/15 text-red-300" : "bg-white/10 text-slate-200"}`}>
                        {w.item} <span className="text-slate-400">· {CATEGORY[w.category] ?? w.category}</span>
                      </span>
                    ))}
                  </div>
                )}
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <div className="text-xs text-slate-400">Why</div>
                    <ul className="mt-1 list-disc space-y-0.5 pl-5 text-slate-300">{a.severity_reasons.map((r, i) => <li key={i}>{r}</li>)}</ul>
                  </div>
                  {a.risks.length > 0 && (
                    <div>
                      <div className="text-xs text-slate-400">Risks</div>
                      <ul className="mt-1 space-y-0.5 text-slate-300">
                        {a.risks.map((r, i) => <li key={i} className="flex gap-1.5"><AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-300" aria-hidden />{r}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
                <div className="rounded-lg bg-brand-blue/10 p-3">
                  <div className="text-xs text-brand-blue-text">Suggested action</div>
                  <p className="mt-1 text-slate-100">{a.recommended_action}</p>
                </div>
              </div>
            )}
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Manage case">
            <div className="space-y-4 text-sm">
              <label className="block">
                <span className="text-xs text-slate-400">Status</span>
                <select className={`${select} mt-1`} value={c.status} disabled={saving} onChange={(e) => void patch({ status: e.target.value })}>
                  {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="text-xs text-slate-400">Assigned to</span>
                <select className={`${select} mt-1`} value={c.assignedTo ?? ""} disabled={saving} onChange={(e) => void patch({ assignedTo: e.target.value || null })}>
                  <option value="">Not assigned</option>
                  {TEAMS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <span className="mt-1 block text-[11px] text-slate-500">Central dispatch vs. direct sub-city routing: to be confirmed with AACMA.</span>
              </label>
              <label className="block">
                <span className="text-xs text-slate-400">Sub-city {c.subcityApprox && <span className="text-slate-500">(suggested from GPS — please confirm)</span>}</span>
                <select className={`${select} mt-1`} value={c.subcity ?? ""} disabled={saving} onChange={(e) => void patch({ subcity: e.target.value || null })}>
                  <option value="">Not set</option>
                  {SUBCITY_NAMES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="text-xs text-slate-400">Priority {c.severitySource === "ai" && <span className="text-slate-500">(AI suggestion — change to override)</span>}</span>
                <select className={`${select} mt-1`} value={c.severity ?? ""} disabled={saving} onChange={(e) => e.target.value && void patch({ severity: e.target.value })}>
                  {!c.severity && <option value="">Pending</option>}
                  {SEVERITIES.map((s) => <option key={s} value={s}>{SEVERITY_LABEL[s]} — target {SLA_HOURS[s]} h</option>)}
                </select>
              </label>
              <div className={`rounded-lg border p-3 ${c.overdue ? "border-red-400/40 bg-red-500/10" : "border-line bg-base"}`}>
                <div className="text-xs text-slate-400">Resolution target</div>
                <div className={`mt-0.5 ${c.overdue ? "text-red-200" : "text-white"}`}>
                  {open ? (c.dueAt ? `${fmtDate(c.dueAt)} · ${dueIn(c.dueAt)}` : "Set once priority is known") : `Resolved ${c.resolvedAt ? fmtDate(c.resolvedAt) : ""}`}
                </div>
              </div>
            </div>
          </Panel>

          <Panel title="Timeline">
            <form
              className="mb-5 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (!note.trim()) return;
                void patch({ note }).then(() => setNote(""));
              }}
            >
              <label className="sr-only" htmlFor="note">Add a note</label>
              <input id="note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note for the team…" className="flex-1 rounded-lg border border-line bg-base px-3 py-2 text-sm text-white focus:border-brand-blue-text focus:outline-none" />
              <button type="submit" disabled={saving || !note.trim()} className="rounded-lg bg-brand-blue px-3 py-2 text-sm text-white transition-colors hover:bg-brand-blue-hover disabled:opacity-50">Add</button>
            </form>
            <ol className="relative space-y-4 border-l border-line pl-5">
              {[...c.history].reverse().map((h, i) => (
                <li key={i} className="relative">
                  <span className={`absolute -left-[25px] top-1.5 size-2.5 rounded-full border-2 border-surface ${h.actor.startsWith("AI") ? "bg-brand-blue-text" : h.actor === "Citizen" ? "bg-brand-green-text" : "bg-slate-400"}`} />
                  <div className="text-sm text-slate-100">{h.action}</div>
                  {h.note && <div className="mt-0.5 text-sm text-slate-300">{h.note}</div>}
                  <div className="text-xs text-slate-500">{h.actor} · {fmtDate(h.at)}</div>
                </li>
              ))}
            </ol>
          </Panel>
        </div>
      </div>
    </div>
  );
}
