"use client";

import { useRef } from "react";
import { Camera, CheckCircle2, ExternalLink, ImagePlus, Loader2, MapPin, RefreshCw, Trash2 } from "lucide-react";
import type { GpsFix, Message, State } from "@/lib/complaint/machine";
import { formatPhone } from "@/lib/complaint/validators";
import { detectLang } from "@/lib/i18n/detectLang";
import { DEMO_REFERENCE, t, type Lang } from "@/lib/i18n/strings";
import { useAssistant } from "./AssistantProvider";
import { AssessmentCard, IdentifyItems, PhotoChipContent, PhotoQuestionButton } from "./vision";

const chip =
  "rounded-full border border-brand-blue-text/60 px-3.5 py-2 text-sm text-brand-blue-text transition-colors hover:bg-brand-blue-text/10 hover:border-brand-blue-text disabled:opacity-40 text-left";
const primary =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-brand-blue px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-blue-hover disabled:opacity-50";

export function langOf(text: string, fallback: Lang): Lang {
  return detectLang(text) ?? fallback;
}

export function mapsUrl(fix: GpsFix): string {
  return `https://www.google.com/maps?q=${fix.lat.toFixed(6)},${fix.lng.toFixed(6)}`;
}

function GpsCard({ fix, lang }: { fix: GpsFix; lang: Lang }) {
  return (
    <div className="mt-2 flex items-start gap-2 rounded-lg border border-line bg-base/60 p-2.5 text-xs text-slate-300">
      <MapPin className="mt-0.5 size-4 shrink-0 text-brand-blue-text" aria-hidden />
      <div>
        <div className="font-mono">
          {fix.lat.toFixed(5)}, {fix.lng.toFixed(5)}
        </div>
        <div className="text-slate-400">
          {t(lang, "gps_accuracy")} ±{fix.accuracy} m ·{" "}
          <a href={mapsUrl(fix)} target="_blank" rel="noopener noreferrer" className="text-brand-blue-text underline-offset-2 hover:underline">
            {t(lang, "gps_map_link")}
          </a>
        </div>
      </div>
    </div>
  );
}

function Receipt({ lang, reference }: { lang: Lang; reference: string }) {
  return (
    <div className="w-full rounded-xl border border-brand-green-text/40 bg-brand-green/10 p-4" lang={lang}>
      <div className="flex items-center gap-2 text-brand-green-text">
        <CheckCircle2 className="size-5" aria-hidden />
        <span className="text-sm">{t(lang, "receipt_thanks")}</span>
      </div>
      <div className="mt-3 text-xs text-slate-400">{t(lang, "receipt_reference")}</div>
      <div className="mt-1 font-mono text-xl tracking-wide text-white">{reference}</div>
      <p className="mt-3 rounded-md bg-deep/60 px-3 py-2 text-sm text-slate-200">{t(lang, "receipt_notice")}</p>
    </div>
  );
}

export function MessageBubble({ m, state }: { m: Message; state: State }) {
  const { removePhoto, attachPhoto } = useAssistant();
  const replaceRef = useRef<HTMLInputElement>(null);
  const lang = langOf(m.text, m.lang);

  if (m.kind === "receipt") {
    const assessment = state.assessments[m.id];
    return (
      <div className="animate-bubble">
        <Receipt lang={m.lang} reference={state.references[m.id] ?? DEMO_REFERENCE} />
        {assessment && <AssessmentCard a={assessment} lang={m.lang} />}
      </div>
    );
  }

  if (m.kind === "photo" && m.photoUrl) {
    const current = state.data.photo?.url === m.photoUrl && state.step !== "confirmed";
    return (
      <div className="flex animate-bubble flex-col items-end gap-1.5">
        {/* eslint-disable-next-line @next/next/no-img-element -- local object URL preview */}
        <img
          src={m.photoUrl}
          alt={t(state.lang, "label_photo").replace("፦", "")}
          className="max-h-44 max-w-[70%] rounded-xl border border-line object-cover"
        />
        {current && (
          <div className="flex gap-3 text-xs">
            <button type="button" onClick={() => replaceRef.current?.click()} className="inline-flex items-center gap-1 text-slate-400 transition-colors hover:text-brand-blue-text">
              <RefreshCw className="size-3.5" aria-hidden /> {t(state.lang, "photo_replace")}
            </button>
            <button type="button" onClick={removePhoto} className="inline-flex items-center gap-1 text-slate-400 transition-colors hover:text-red-400">
              <Trash2 className="size-3.5" aria-hidden /> {t(state.lang, "photo_remove")}
            </button>
            <input
              ref={replaceRef}
              type="file"
              accept="image/*"
              className="sr-only"
              tabIndex={-1}
              aria-hidden
              onChange={(e) => {
                attachPhoto(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </div>
        )}
      </div>
    );
  }

  const isUser = m.role === "user";
  return (
    <div className={`flex animate-bubble ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        lang={lang}
        className={`${m.kind === "identify" ? "max-w-[95%]" : "max-w-[85%]"} whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-[15px] leading-relaxed ${
          isUser
            ? "rounded-br-md bg-brand-blue text-white"
            : m.tone === "error"
              ? "rounded-bl-md border border-red-400/30 bg-red-950/40 text-red-100"
              : "rounded-bl-md bg-slate-700/80 text-white"
        }`}
      >
        {m.text}
        {m.kind === "gps" && m.gps && <GpsCard fix={m.gps} lang={m.lang} />}
        {m.kind === "identify" && <IdentifyItems m={m} />}
        {m.sources && m.sources.length > 0 && (
          <div className="mt-2 border-t border-white/10 pt-2 text-xs text-slate-300">
            <span className="text-slate-400">{t(m.lang, "sources")}: </span>
            {m.sources.map((s, i) => (
              <span key={`${s.id}-${s.page}`}>
                {i > 0 && " · "}
                {s.url ? (
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 text-brand-blue-text hover:underline">
                    {s.title}
                    {s.page ? `, p. ${s.page}` : ""} <ExternalLink className="size-3" aria-hidden />
                  </a>
                ) : (
                  <>
                    {s.title}
                    {s.page ? `, p. ${s.page}` : ""}
                  </>
                )}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function TypingIndicator({ lang }: { lang: Lang }) {
  return (
    <div className="flex justify-start" role="status" aria-label={t(lang, "thinking")}>
      <div className="flex gap-1 rounded-2xl rounded-bl-md bg-slate-700/80 px-4 py-3">
        {[0, 1, 2].map((i) => (
          <span key={i} className="size-1.5 animate-dot rounded-full bg-slate-300" style={{ animationDelay: `${i * 150}ms` }} />
        ))}
      </div>
    </div>
  );
}

function ReviewCard() {
  const { state, confirm, editDetails } = useAssistant();
  const { data, lang } = state;
  const loc = data.location;
  const rows: [string, React.ReactNode][] = [
    [t(lang, "label_name"), data.name],
    [t(lang, "label_phone"), formatPhone(data.phone)],
    [
      t(lang, "label_location"),
      loc?.mode === "gps" ? (
        <span>
          {t(lang, "location_current")} · <span className="font-mono text-xs">{loc.lat.toFixed(5)}, {loc.lng.toFixed(5)}</span>{" "}
          <span className="text-slate-400">(±{loc.accuracy} m)</span>{" "}
          <a href={mapsUrl(loc)} target="_blank" rel="noopener noreferrer" className="text-brand-blue-text hover:underline">
            {t(lang, "gps_map_link")}
          </a>
        </span>
      ) : (
        loc?.text
      ),
    ],
    [t(lang, "label_description"), data.description],
  ];
  return (
    <div className="animate-bubble rounded-xl border border-line bg-base p-4" lang={lang}>
      <dl className="space-y-2.5 text-sm">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs text-slate-400">{label}</dt>
            <dd className="whitespace-pre-wrap break-words text-white" lang={typeof value === "string" ? langOf(value, lang) : lang}>
              {value}
            </dd>
          </div>
        ))}
        <div>
          <dt className="text-xs text-slate-400">{t(lang, "label_photo")}</dt>
          <dd className="mt-1">
            {data.photo && (
              // eslint-disable-next-line @next/next/no-img-element -- local object URL preview
              <img src={data.photo.url} alt="" className="h-20 w-28 rounded-lg border border-line object-cover" />
            )}
          </dd>
        </div>
      </dl>
      <p className="mt-4 text-sm text-slate-200">{t(lang, "review_question")}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={confirm} className="inline-flex items-center gap-2 rounded-lg bg-brand-green-button px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-green-button-hover">
          <CheckCircle2 className="size-4" aria-hidden /> {t(lang, "opt_confirm")}
        </button>
        <button type="button" onClick={editDetails} className="rounded-lg border border-line px-4 py-2.5 text-sm text-slate-200 transition-colors hover:border-brand-blue-text hover:text-brand-blue-text">
          {t(lang, "opt_edit")}
        </button>
      </div>
    </div>
  );
}

function PhotoPicker() {
  const { state, attachPhoto } = useAssistant();
  const camera = useRef<HTMLInputElement>(null);
  const gallery = useRef<HTMLInputElement>(null);
  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    attachPhoto(e.target.files?.[0]);
    e.target.value = "";
  };
  return (
    <div className="flex flex-wrap gap-2">
      {/* On phones `capture` opens the camera; on desktop it falls back to the file picker. */}
      <button type="button" className={primary} onClick={() => camera.current?.click()}>
        <Camera className="size-4" aria-hidden /> {t(state.lang, "opt_take_photo")}
      </button>
      <button type="button" className={chip + " inline-flex items-center gap-2"} onClick={() => gallery.current?.click()}>
        <ImagePlus className="size-4" aria-hidden /> {t(state.lang, "opt_choose_photo")}
      </button>
      <input ref={camera} type="file" accept="image/*" capture="environment" className="sr-only" tabIndex={-1} aria-hidden onChange={onPick} />
      <input ref={gallery} type="file" accept="image/*" className="sr-only" tabIndex={-1} aria-hidden onChange={onPick} />
    </div>
  );
}

/** Controls for whatever the current step is waiting for. */
export function ActionArea() {
  const a = useAssistant();
  const { state } = a;
  const L = state.lang;
  if (state.busy) return null;

  if (state.restartPrompt) {
    return (
      <div className="flex flex-wrap gap-2">
        <button type="button" className={chip} onClick={() => a.answerRestart(true)}>{t(L, "opt_restart_yes")}</button>
        <button type="button" className={chip} onClick={() => a.answerRestart(false)}>{t(L, "opt_restart_no")}</button>
      </div>
    );
  }

  switch (state.step) {
    case "idle": {
      if (state.messages.some((m) => m.role === "user")) return null;
      return (
        <div className="flex flex-wrap gap-2">
          <button type="button" className={chip} onClick={a.chooseQuestion}>{t(L, "opt_question")}</button>
          <button type="button" className={chip} onClick={a.startComplaint}>{t(L, "opt_report")}</button>
          <PhotoQuestionButton className={chip + " inline-flex items-center gap-2"}>
            <PhotoChipContent lang={L} />
          </PhotoQuestionButton>
        </div>
      );
    }
    case "photo":
      return <PhotoPicker />;
    case "location_ask":
      return (
        <div className="flex flex-wrap gap-2">
          <button type="button" className={chip} onClick={() => a.chooseLocation("here")}>{t(L, "opt_here")}</button>
          <button type="button" className={chip} onClick={() => a.chooseLocation("elsewhere")}>{t(L, "opt_elsewhere")}</button>
        </div>
      );
    case "location_gps":
      return (
        <div className="flex flex-wrap gap-2">
          <button type="button" className={primary} onClick={a.shareLocation} disabled={a.gpsBusy}>
            {a.gpsBusy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <MapPin className="size-4" aria-hidden />}
            {a.gpsBusy ? t(L, "gps_locating") : t(L, "opt_share_location")}
          </button>
          <button type="button" className={chip} onClick={() => a.chooseLocation("elsewhere")} disabled={a.gpsBusy}>{t(L, "opt_elsewhere")}</button>
        </div>
      );
    case "location_confirm":
      return (
        <div className="flex flex-wrap gap-2">
          <button type="button" className={chip} onClick={() => a.confirmGps(true)}>{t(L, "opt_gps_yes")}</button>
          <button type="button" className={chip} onClick={() => a.confirmGps(false)}>{t(L, "opt_gps_change")}</button>
        </div>
      );
    case "review":
      return <ReviewCard />;
    case "edit_menu":
      return (
        <div className="flex flex-wrap gap-2">
          {(["name", "phone", "location", "description", "photo"] as const).map((f) => (
            <button key={f} type="button" className={chip} onClick={() => a.editField(f)}>
              {t(L, `field_${f}`)}
            </button>
          ))}
        </div>
      );
    case "confirmed":
      return (
        <div className="flex flex-wrap gap-2">
          <button type="button" className={chip} onClick={a.chooseQuestion}>{t(L, "opt_question")}</button>
          <button type="button" className={chip} onClick={a.startComplaint}>{t(L, "opt_report")}</button>
          <PhotoQuestionButton className={chip + " inline-flex items-center gap-2"}>
            <PhotoChipContent lang={L} />
          </PhotoQuestionButton>
        </div>
      );
    default:
      return null;
  }
}
