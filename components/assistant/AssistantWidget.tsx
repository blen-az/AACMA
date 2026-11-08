"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AlertTriangle, ImageUp, Maximize2, MessageCircle, Minimize2, RotateCcw, SendHorizontal, X } from "lucide-react";
import { t } from "@/lib/i18n/strings";
import { useAssistant } from "./AssistantProvider";
import { ActionArea, MessageBubble, TypingIndicator } from "./parts";
import { PhotoQuestionButton } from "./vision";
import { tv } from "@/lib/i18n/vision-strings";

export function AssistantWidget() {
  const a = useAssistant();
  const pathname = usePathname();
  const { state, open, setOpen } = a;
  const L = state.lang;
  const [draft, setDraft] = useState("");
  const [wide, setWide] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);

  // Keep the newest message in view, including when images or cards finish rendering.
  const contentRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = listRef.current;
    const content = contentRef.current;
    if (!el || !content) return;
    const toBottom = () => el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    toBottom();
    const ro = new ResizeObserver(toBottom);
    ro.observe(content);
    return () => ro.disconnect();
  }, [open]);

  // Focus the input when opened for a question.
  useEffect(() => {
    if (open && a.focusToken) inputRef.current?.focus({ preventScroll: true });
  }, [open, a.focusToken]);

  // Esc closes; focus returns to the launcher.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        launcherRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  // Lock page scroll behind the full-screen sheet on phones.
  useEffect(() => {
    if (!open) return;
    const mq = window.matchMedia("(max-width: 639px)");
    if (!mq.matches) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const submit = () => {
    if (!draft.trim() || state.busy) return;
    a.sendText(draft);
    setDraft("");
    requestAnimationFrame(() => inputRef.current?.focus({ preventScroll: true }));
  };

  const inputMode = state.step === "phone" ? "tel" : "text";

  // The citizen assistant is not part of the staff dashboard.
  if (pathname.startsWith("/admin")) return null;

  return (
    <>
      {!open && (
        <button
          ref={launcherRef}
          type="button"
          onClick={() => a.openAssistant()}
          className="group fixed bottom-5 right-5 z-50 flex items-center gap-3 rounded-full bg-brand-blue py-3.5 pl-4 pr-5 text-white shadow-xl shadow-black/40 transition-colors hover:bg-brand-blue-hover animate-pulse-ring"
          aria-label={t("en", "assistant_title")}
        >
          <MessageCircle className="size-6" aria-hidden />
          <span className="hidden text-sm font-medium sm:inline">Ask AACMA AI</span>
        </button>
      )}

      {open && (
        <section
          role="dialog"
          aria-label={t(L, "assistant_title")}
          className={`fixed inset-0 z-50 flex animate-panel flex-col overflow-hidden bg-surface sm:inset-auto sm:bottom-5 sm:right-5 sm:rounded-2xl sm:border sm:border-line sm:shadow-2xl sm:shadow-black/50 ${
            wide ? "sm:h-[min(820px,calc(100dvh-2.5rem))] sm:w-[min(720px,calc(100vw-2.5rem))]" : "sm:h-[min(680px,calc(100dvh-2.5rem))] sm:w-[420px]"
          }`}
        >
          {/* Header */}
          <header className="relative flex items-center gap-3 bg-deep px-4 py-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-white p-1">
              {/* eslint-disable-next-line @next/next/no-img-element -- static SVG logo */}
              <img src="/brand/aacma-logo-tight.svg" alt="" className="size-full" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-[15px] leading-tight text-white" lang={L}>{t(L, "assistant_title")}</h2>
              <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-slate-400" lang={L}>
                <span className="rounded bg-white/10 px-1 py-px text-[10px] uppercase tracking-wide text-slate-300">{t(L, "demo_badge")}</span>
                <span className="truncate">{t(L, "assistant_subtitle")}</span>
              </p>
            </div>
            {/* Assistant language only — the website language is unaffected (WEB-01). */}
            <div className="flex rounded-md border border-line text-xs" role="group" aria-label="Assistant language">
              {(["en", "am"] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => a.setLang(l)}
                  aria-pressed={L === l}
                  lang={l}
                  className={`px-2 py-1 transition-colors ${L === l ? "bg-brand-blue text-white" : "text-slate-300 hover:text-brand-blue-text"}`}
                >
                  {l === "en" ? "EN" : "አማ"}
                </button>
              ))}
            </div>
            <div className="flex items-center">
              <button type="button" onClick={a.askRestart} className="rounded-md p-2 text-slate-400 transition-colors hover:text-white" title={t(L, "restart")} aria-label={t(L, "restart")}>
                <RotateCcw className="size-4" aria-hidden />
              </button>
              <button type="button" onClick={() => setWide((w) => !w)} className="hidden rounded-md p-2 text-slate-400 transition-colors hover:text-white lg:block" aria-label={wide ? "Shrink" : "Expand"}>
                {wide ? <Minimize2 className="size-4" aria-hidden /> : <Maximize2 className="size-4" aria-hidden />}
              </button>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  requestAnimationFrame(() => launcherRef.current?.focus());
                }}
                className="rounded-md p-2 text-slate-400 transition-colors hover:text-white"
                aria-label={t(L, "close")}
              >
                <X className="size-5" aria-hidden />
              </button>
            </div>
            <span className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-brand-blue to-brand-green" aria-hidden />
          </header>

          {state.aiDown && (
            <div className="flex items-start gap-2 border-b border-amber-400/20 bg-amber-950/40 px-4 py-2 text-xs text-amber-100" role="status" lang={L}>
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden /> {t(L, "ai_down_banner")}
            </div>
          )}

          {/* Conversation */}
          <div ref={listRef} className="flex-1 overflow-y-auto overscroll-contain px-4 py-4" aria-live="polite">
            <div ref={contentRef} className="space-y-3">
              {state.messages.map((m) => (
                <MessageBubble key={m.id} m={m} state={state} />
              ))}
              {state.busy && <TypingIndicator lang={L} />}
              <div className="pt-1">
                <ActionArea />
              </div>
            </div>
          </div>

          {/* Input */}
          <form
            className="flex items-end gap-2 border-t border-line bg-deep/60 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            {(state.step === "idle" || state.step === "confirmed") && (
              <PhotoQuestionButton
                label={tv(L, "identify_button")}
                className="grid size-11 shrink-0 place-items-center rounded-xl border border-line text-slate-300 transition-colors hover:border-brand-blue-text hover:text-brand-blue-text disabled:opacity-40"
              >
                <ImageUp className="size-5" aria-hidden />
              </PhotoQuestionButton>
            )}
            <label htmlFor="assistant-input" className="sr-only">{t(L, "input_placeholder")}</label>
            <textarea
              id="assistant-input"
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  submit();
                }
              }}
              rows={1}
              maxLength={1500}
              inputMode={inputMode}
              autoComplete={state.step === "phone" ? "tel" : state.step === "name" ? "name" : "off"}
              placeholder={t(L, "input_placeholder")}
              lang={L}
              className="max-h-32 min-h-11 flex-1 resize-none rounded-xl border border-line bg-base px-3.5 py-2.5 text-[15px] text-white placeholder:text-slate-500 focus:border-brand-blue-text focus:outline-none [field-sizing:content]"
            />
            <button
              type="submit"
              disabled={!draft.trim() || state.busy}
              className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-blue text-white transition-colors hover:bg-brand-blue-hover disabled:opacity-40"
              aria-label={t(L, "send")}
            >
              <SendHorizontal className="size-5" aria-hidden />
            </button>
          </form>
        </section>
      )}
    </>
  );
}
