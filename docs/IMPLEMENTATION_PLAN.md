# AACMA Prototype — Implementation Plan

**Basis:** *AACMA Prototype Requirements & Engineering Handoff Specification V1.0* (2 Nov 2026) and *AACMA Director Pitch (Amharic) FINAL* (5 Nov 2026)
**Status:** Draft for Meleph review. No code is written until this plan and the §5.1 UI previews are approved.
**Prepared:** 7 Nov 2026 · **Prototype due:** 12 Nov 2026 · **Director package:** 15 Nov 2026

This plan covers the spec's **BUILD NOW** scope only. Requirement IDs (D, WEB, AI, C, TR, T) refer to the spec.

---

## 1. Stack

| Concern | Choice | Why |
|---|---|---|
| App | **Next.js (App Router) + TypeScript + Tailwind** | One codebase for both pages and the server API route. The root layout persists across routes, so the chat keeps its state between the homepage and the Training Centre (WEB-04). |
| Hosting | **Vercel**, a single private staging project | Gives a staging URL with no extra work. Deployment Protection (password) covers D13. Server-side env vars keep the key out of the browser (AI-01). |
| LLM | **OpenAI Responses API** with structured (JSON-schema) output. Model is set by `OPENAI_MODEL`, default a `gpt-5-mini`-class model | The mini model is cheap and fast. On 10 Nov we compare it with the full model on the Amharic test questions and keep whichever is better (see §11). |
| Embeddings | `text-embedding-3-large` | Better multilingual retrieval than `-small`. The corpus is small, so cost doesn't matter. |
| Retrieval store | **Static JSON index built at deploy time** (chunks, embeddings, provenance), searched in memory | The corpus is tens of documents, not thousands, so no vector DB is needed. It's easy to inspect, and it keeps the source inventory next to the code (§12.2-5). |
| Keyword search | Small BM25 over the same chunks | Embeddings alone are weak on Amharic, so we combine both (§4). |
| Tests | Vitest (logic) + Playwright (flows, mobile viewport) | Covers T01–T14 (§8). |

Not used: a database, auth, a CMS, a vector DB, maps APIs, SMS or any other outbound integration. That follows D09 and §3, and it also means nothing in the stack can create a real record.

---

## 2. Repository layout

```
app/
  layout.tsx              # root layout; mounts <AssistantProvider> + floating widget
  page.tsx                # S01 AACMA homepage (English)
  training/page.tsx       # S06 Virtual Training Centre (separate theme)
  api/chat/route.ts       # only server endpoint: retrieval + OpenAI call
components/assistant/     # widget, message list, chips, PhotoInput, LocationInput, ReviewCard, Receipt
lib/complaint/
  machine.ts              # deterministic complaint state machine (reducer)
  validators.ts           # phone / name / description / photo checks
lib/i18n/
  strings.am.json         # Appendix B — verbatim, locked
  strings.en.json         # Appendix A + gaps (pending approval, see §10)
  detectLang.ts           # Ethiopic-script detection
lib/rag/
  search.ts               # hybrid embedding + BM25 search
  prompt.ts               # system prompt + excerpt formatting
corpus/
  sources.yaml            # Appendix C inventory (the source of truth for coverage)
  raw/                    # supplied files (not committed if licensing unclear)
scripts/
  ingest.ts               # extract → chunk → embed → data/index.json
  eval.ts                 # retrieval + answer smoke tests (EN/AM)
data/index.json           # built artifact
tests/                    # vitest + playwright
docs/                     # this plan, run/deploy notes, test evidence, cost note
```

---

## 3. Conversational assistant: architecture

### 3.1 Principle: the app owns the state, the model owns the language

The spec requires a model that answers freely (D04, AI-03) **and** a complaint intake that always behaves the same way (§7: "field order, state, validation and no-live-submission boundary must be dependable"). Each job goes to a different part:

- **A deterministic state machine in the client** (`machine.ts`) holds the complaint fields and the current step. Steps: `idle → photo → location → (location_confirm) → description → name → phone → review → (edit:<field>) → confirmed`. The model **cannot** skip steps, set `confirmed`, or issue a reference.
- **The LLM** recognises intent, answers informational questions from retrieved sources, and writes the free-form replies.
- **The fixed step prompts** (the "ask for photo", "ask for name" messages, etc.) come from the locked string tables, not from the model. The approved Amharic text is therefore shown exactly as written every time (D14, Appendix B rule).

### 3.2 Turn handling

For each user input:

1. **UI inputs** (photo picker, location buttons, review/edit chips, confirm, restart) go straight to the state machine. No model call.
2. **Free text while a field is pending:**
   - `phone` step: if the input matches the phone pattern (§5.3), accept it locally. No model call.
   - `name` step: if the input is ≤ 5 words with no `?`, accept it locally.
   - Otherwise, or in `description` / `idle` / `review` steps, call `/api/chat`.
3. **`/api/chat`** gets the recent turns (with PII redacted, §3.4), the current step and which fields are filled (as flags only). It returns structured output:
   ```json
   { "action": "answer | start_complaint | provide_field | edit_field | restart | unclear",
     "field": "description | name | phone | location_text | null",
     "reply": "free-form text in the user's language (for answer/unclear)",
     "used_sources": ["SRC-003#p4", ...] }
   ```
4. The client applies the action, then **re-shows the prompt for the step still pending**, in the current language. That covers "answer the side question, then return to the last incomplete field" (§7.3, T09).

**Verbatim rule for citizen fields:** when the action is `provide_field` for `description` or `name`, the app stores **the user's raw message**, never the model's version (C5, US-04). The model only decides *that* the message is the field value.

### 3.3 Language (AI-02, T03, T10)

- The conversation language is taken from the **latest user message's script**: Ethiopic (U+1200–U+139F, U+2D80–U+2DDF) means `am`, otherwise `en`. Clicking a chip keeps the current language.
- The website language never changes (WEB-01). The assistant language is separate React state.
- On a switch, the pending step prompt is re-shown in the new language. Collected fields are untouched.
- The system prompt tells the model to reply in the detected language, and the detected value is passed in explicitly. We don't rely on the model to work it out.

### 3.4 Privacy and safety (§6.2)

- **Photos never leave the browser.** They're held as an in-memory object URL for the preview and review thumbnail. They're never uploaded and never sent to OpenAI. This enforces AI-07 by design, not just by prompt.
- **Name and phone are not sent to OpenAI.** Recent turns are redacted before sending (`[name provided]`, `[phone provided]`), and the state is sent as flags only.
- GPS coordinates stay in the client.
- No server-side logging of message bodies. Logs hold only request count, latency, token usage and error codes.
- Retrieved excerpts are wrapped in clear delimiters and the system prompt treats them as data, not instructions. The system prompt also forbids disclosing itself.
- **Restart** (string 18) clears all state and revokes the photo object URL. Nothing is written to `localStorage`. The in-memory state lasts only while the tab is open.

### 3.5 System prompt rules (summary)

1. Answer only from the supplied excerpts plus general conversational ability. If the excerpts don't support an answer, reply with the "insufficient information" message (string 15 / EN equivalent) and suggest contacting the agency through official channels. **No invented phone numbers, procedures, laws or sorting rules** (AI-04).
2. Keep it to a few sentences, warm and modern, and ask one question at a time (AI-05).
3. Never describe, caption or assess an attached photo (AI-07).
4. Never claim a complaint was submitted or will be acted on (D09).
5. Cite sources when excerpts are used. The UI shows them as small "Source: title, p. N" chips.

### 3.6 Failure handling (AI-08)

- Timeout or error from `/api/chat` shows string 16 (technical problem) and a retry button.
- **The complaint flow keeps working without the model.** In the description, name and phone steps, if the API is down the text is accepted as the field value by local rules. So an outage doesn't block the demo path.
- A banner reading "AI temporarily unavailable — demo intake continues" makes sure the demo never *claims* the model answered when it didn't.
- A recorded fallback video and screenshots of the full path are prepared for T14.

### 3.7 Usage limits and cost (AI-09)

- Vercel Deployment Protection password on staging.
- Per-IP token bucket in `/api/chat` (about 20 requests/minute) plus a hard **daily request cap** set by env var.
- `max_output_tokens` around 400. At most 6 excerpts of about 400 tokens each per call. Last 10 turns of history.
- Monthly budget limit on a **dedicated OpenAI project** for the demo.
- **Estimate:** about 3–4k tokens per answered turn. Rehearsals plus QA come to roughly 500–1,000 turns, which at mini-model pricing is in the low single-digit USD. The exact figure goes in `docs/cost.md` once checked against current pricing.

---

## 4. Knowledge base and retrieval (D05, AI-03, §6.1, §12.2)

**Pipeline (`scripts/ingest.ts`):**
1. Read `corpus/sources.yaml`, one entry per source using the Appendix C fields (ID, publisher, title, URL/file, language, date/version, pages, type, usage status, owner, current/historical caveat).
2. Extract text with page provenance. **Risk: Amharic PDFs often extract as garbled characters** because of legacy Ethiopic fonts. Every extracted file is checked for garbling and, where needed, OCR'd with Tesseract `amh`. Anything that can't be extracted cleanly is marked `ingest_failed`, **not** quietly left out or filled in by hand (§12.2-2).
3. Chunk at about 400 tokens with overlap, keeping section and page. Embed. Write `data/index.json` plus `docs/source-inventory.md`, which is generated and lists each source as *ingested / failed / missing*.

**Search (`lib/rag/search.ts`):**
- The model is asked for a short **bilingual query rewrite** (EN + AM) as part of the call. Both versions are run through embedding search **and** BM25, the results merged by reciprocal-rank fusion, top 6 kept.
- If nothing scores above a set threshold, no excerpts are sent. The model then gives the "insufficient information" reply instead of guessing.

**Evaluation (`scripts/eval.ts`):** a held-out set of about 20 EN and 20 AM questions, written *after* ingestion by someone other than the implementer if possible. It covers each source category, plus about 6 questions that are deliberately unsupported. We record retrieval hit, groundedness (manual), language correctness and refusal correctness. The results go in the test evidence (T02, T03, US-01).

---

## 5. Complaint flow details (§7)

### 5.1 Photo (C2, T05)
- Two buttons per Appendix B step 2: **"Take photo"** (`<input type="file" accept="image/*" capture="environment">`) and **"Choose from phone"** (`accept="image/*"`, no `capture`). On desktop, "Take photo" falls back to the file picker.
- Checks: image MIME type, ≤ 10 MB. On failure, show string 12.
- Thumbnail with **Replace** and **Remove**. Photo is required before moving on.

### 5.2 Location (C3, C4, D07, §7.2): **proposal, needs approval**
1. Ask "Is the problem at your current location?" with chips **Yes / No, somewhere else** (Appendix B step 3).
2. **Yes:** show an explanation, and only after **"Share my location"** is tapped call `navigator.geolocation.getCurrentPosition` (high accuracy, 10 s timeout). Show the found position as *"Location found (±N m)"* with an optional "View on map" link (plain `maps.google.com/?q=lat,lng`, no API key or embed), then **Yes, correct / No, change location** (Appendix B step 4).
3. **Denied / timeout / unsupported / inaccurate (> 200 m) / "change":** show string 11 and the manual form.
4. **Manual form inside the chat:** **sub-city** (select from the 11 Addis Ababa sub-cities, list to be confirmed by Meleph), **woreda** (optional), **landmark / address** (free text, required). It can also be filled by typing free text in chat.
5. No reverse geocoding: it would send coordinates to a third party and suggest an accuracy we can't promise. A map-pin picker is **not** proposed for November.

### 5.3 Description, name, phone (C5, C6, T08)
- Description: required, at least 5 characters, stored word for word.
- Name: required, at least 2 characters, stored word for word.
- Phone: strip spaces and dashes, then accept `09XXXXXXXX`, `07XXXXXXXX`, `+2519XXXXXXXX`, `+2517XXXXXXXX`, `2519…`/`2517…`; store normalised as `+251…`. If invalid, show string 13 and ask again. Rehearsals use a test-pattern number agreed with Meleph.
- Missing field at review: string 14 with the field name filled in.

### 5.4 Review, edit, confirm (C7, C8, T11, T12)
- The review card shows **name, phone, location, description, photo thumbnail**, all exactly as entered. No AI text appears on the card.
- **"Change information"** brings up the string 17 chips (Name / Phone / Location / Description / Photo). It jumps to that single step with the current value pre-filled, then **returns to review**. It doesn't walk through the whole flow again.
- **"Yes, confirm"** is disabled after the first click, which prevents duplicate confirmations. It then sets `confirmed`, shows `DEMO-AACMA-001` and the no-submission notice (string 10 / Appendix A final line), and disables the review controls.
- **No network request is made on confirm.** T12 is checked in DevTools: the confirmed state triggers no fetch.
- A **Restart** button is always visible in the widget header (string 18 confirmation).

---

## 6. Visual design: based on the "E-Government Services Website" template

**Reference:** Figma Community, *E-Government Services Website* by Embergen Nurzhan (a Figma Make file; live preview at `door-fir-91038361.figma.site`). Values below were measured from the live preview on 7 Nov 2026. The template is built on Tailwind's default palette, so the tokens map straight onto Tailwind classes.

### 6.1 Colour tokens (dark theme, AACMA brand accent)

**Decision (7 Nov):** keep the template's navy layout, type and motion, but **replace its yellow accent with the AACMA logo colours**. The master logo is `docs/logo.svg` (two filled paths, transparent background). Brand colours are taken from its fills:

- **AACMA blue** `#1076BD` (truck and inner swoosh)
- **AACMA green** `#1C8E63` (outer swoosh and truck bin)

The brand colours themselves are too dark to use as *text* on navy (blue about 3.7:1, green about 4.3:1, both under WCAG AA's 4.5:1). So each colour has a lighter **text tint** for use on dark backgrounds, while the true brand colour is used for filled buttons with white text.

| Token | Value | Used for |
|---|---|---|
| `--bg-deep` | slate-950 `#020617` | Header, footer |
| `--bg` | slate-900 `#0F172A` | Page background |
| `--surface` | slate-800 `#1E293B` | Cards (1px `slate-700` border) |
| `--surface-muted` | slate-800 / 50% | Secondary panels |
| `--border` | slate-700 `#334155` / slate-800 | Card borders, header rule, nav divider |
| `--text` | white | Headings, card titles |
| `--text-muted` | slate-300 `#CBD5E1` / slate-400 `#94A3B8` | Body copy, descriptions |
| `--text-faint` | slate-500 `#64748B` | Footer copyright |
| `--brand-blue` | `#1076BD` | **Primary button fill** (white text, about 4.8:1), chat launcher, user chat bubbles |
| `--brand-blue-hover` | `#0E5E9A` | Button hover (darker, so white text still passes) |
| `--brand-blue-text` | `#4FA3E0` | **Accent text on navy** (about 6.5:1): active nav, section titles, hero second line, icons, dates, links |
| `--brand-green` | `#1C8E63` | Main site: sparing use only (logo, thin divider rule). Training Centre: accent (§6.5) |
| `--brand-green-text` | `#34C38A` | Green text on navy (about 7.5:1) |
| `--brand-green-button` | `#0F7A52` | Green button fill (white text, about 5:1) |
| `--brand-gradient` | `#1076BD → #1C8E63` (to bottom-right) | Thin accent rule under the header; hero CTA focus ring |
| `--notice-bg` / `--notice-edge` | slate-800 / `#4FA3E0` | "Concept prototype" strip (left 4px border) |
| `--error` | red-400 `#F87171` | Form/validation errors in chat |

The hero is a full-bleed photo under a `linear-gradient(rgba(15,23,42,.7), rgba(15,23,42,.9))` overlay. The headline is white with the second line in `--brand-blue-text`.

**Contrast summary:** text tints at 6.5:1 and 7.5:1 on navy, white on the button fills at about 4.8–5:1, slate-400 body text at 6.6:1. Everything passes WCAG AA. These figures are calculated and will be checked with a contrast tool on the previews.

**Logo:** `docs/logo.svg` is the master: a 474×474 viewBox with two paths (blue `#1076BD`, green `#1C8E63`). The recycle arrows and windows are cut-outs, so the background shows through. It was rendered and checked on navy (7 Nov). It reads on navy directly, but the blue truck on dark navy is low-contrast and the cut-outs turn navy. So in the header and chat panel it goes on a **white rounded tile** (in place of the template's gradient tile), where it looks as intended. The artwork fills about x 38–413 / y 42–422 of the viewBox; use `viewBox="30 34 392 396"` on a copy for small sizes (header 40px, favicon) so it isn't shrunk by the padding. The fine brush-stroke tails get thin below about 32px, so the favicon uses the tight crop at 32px minimum. `docs/photo_2026-11-07_13-47-02.jpg` is kept only as the original reference.

### 6.2 Typography

- **The template doesn't use a custom font.** It uses Tailwind's system stack (`ui-sans-serif, system-ui, sans-serif`): Segoe UI on Windows, SF Pro on Apple, Roboto on Android.
- **For AACMA:** we keep the same system stack for Latin text so it looks exactly like the template, and add **Noto Sans Ethiopic** (self-hosted) for Amharic. System fonts render Ethiopic inconsistently, and some Android builds fall back to poor glyphs.
  `font-family: ui-sans-serif, system-ui, "Segoe UI", Roboto, "Noto Sans Ethiopic", sans-serif;`
- **Scale, as in the template:** hero `text-5xl md:text-7xl`, normal weight, uppercase, `tracking-tight`. Section titles `text-3xl` (30px) in `--brand-blue-text`, normal weight. Card titles `text-base`/`lg` white. Body 16px slate-300/400. Nav uppercase, `tracking-wide`.
- Headings are deliberately **weight 400**, not bold. The large size plus the accent colour is what gives the template its calm, modern look. We keep this.
- Amharic is never set uppercase (it has no case) and gets `line-height: 1.7`, because Ethiopic glyphs are taller.

### 6.3 Motion

**The template has almost no animation.** The only motion is a **150 ms colour transition** (`transition-colors`, `cubic-bezier(0.4,0,0.2,1)`) on nav links and buttons on hover. We copy that exactly, and propose these subtle additions in the same style (for Meleph approval):

| Element | Motion | Timing |
|---|---|---|
| Nav links, buttons | Colour change to the accent (as template) | 150 ms ease-out |
| Service / course cards | 2px lift, border changes from `slate-700` to the accent at 40% | 200 ms |
| Sections on scroll | Fade in and move up 12px, once only (IntersectionObserver, no library) | 400 ms, cards staggered 60 ms |
| Hero | Headline and CTA fade in on load | 500 ms |
| Chat launcher | Brand-blue circle with a soft pulse ring, **3 cycles only** after page load | 1.5 s |
| Chat panel | Slides up and fades in from the launcher (on mobile, full-screen sheet slides up) | 220 ms |
| Chat messages | New bubble fades in and moves up 4px; "typing" indicator with three dots | 150 ms |

Everything is turned off under `prefers-reduced-motion: reduce`. All of it is done with CSS transitions, with no animation library.

### 6.4 What we take from the template, and what we don't

| Template element | AACMA treatment |
|---|---|
| Sticky dark header: logo tile + name/subtitle, uppercase nav, active item highlighted | **Keep.** AACMA logo on a white tile + "Addis Ababa City Cleansing Management Agency"; active item in `--brand-blue-text`; nav per spec §4.3 |
| EN / RU language switch | **Remove.** The website is English-only, and the assistant handles Amharic (D02, WEB-01) |
| Full-bleed photo hero, two-colour headline, accent CTA, 3 icon features | **Keep layout.** Needs a licensed Addis Ababa photo from Meleph. Three CTAs per WEB-03 |
| Red alert strip | **Reuse** as the "Concept prototype — not an official AACMA service" notice (WEB-06), in slate with a blue edge rather than red so it doesn't look like an emergency |
| 4 "Most-Used Services" cards (incl. "File Complaint") | **Keep** with AACMA services from Meleph. "Report a cleansing problem" **opens the assistant in complaint mode** (spec §3 scope control) |
| News cards with photo, coloured date, title | **Keep** only if Meleph supplies real items; otherwise a short "Updates" preview with clearly marked placeholders |
| Stats tiles (12,500+, 98%, …) | **Remove.** These would be invented agency figures (WEB-02, §2.1) |
| Footer with address, phone, hours, social | **Keep layout.** Only details Meleph confirms; empty fields are left out, never filled with sample values |

### 6.5 Training Centre (S06) in the same system

It uses the same navy base, header, logo tile and type scale, so it clearly belongs to AACMA, but with **AACMA green as the accent** in place of blue: `--brand-green-text` for titles and active nav, `--brand-green-button` for buttons. The main site uses blue as its accent and the Training Centre uses green, so between them both logo colours are used and each site is instantly recognisable. A "Virtual Training Centre" wordmark and education-style illustrations or icons make it obviously a separate learning space (TR-01). Course cards get a coloured top band per audience (staff / residents / students) and a "Coming soon" badge.

### 6.6 Assistant widget

- Launcher: `--brand-blue` circle with a white chat icon, bottom right.
- Panel: surface `slate-800`; header `slate-950` with a small logo, the restart button and a thin `--brand-gradient` rule.
- Bubbles: user messages `--brand-blue` with white text; assistant messages `slate-700` with white text.
- Option chips: `--brand-blue-text` outline and text. Review card on `slate-900`. Confirm button `--brand-green-button`, since green means "confirm". The DEMO reference is in `--brand-green-text`.
- The widget looks the same on the Training Centre. It's the agency's assistant, so it stays blue there.

---

## 7. Pages

### S01 Homepage (WEB-01…06, §4.3)
- Government-style header with logo, nav (Home, About, Services, News/Updates, Publications, Contact, **Training Centre**). Secondary links scroll to short homepage sections; no dead links.
- Hero with three actions (WEB-03): **Ask the AI assistant** (opens the widget in Q&A mode), **Report a cleansing problem** (opens the widget **in complaint mode**, starting at the photo step; never a form), **Visit the Virtual Training Centre**.
- A persistent "Concept prototype — not an official AACMA service" strip in the footer (WEB-06).
- **All agency copy (About, Services, contacts) comes from Meleph.** Until it's supplied, sections show visibly marked placeholders. Nothing is invented (WEB-02, §2.1).

### S06 Virtual Training Centre (TR-01…05)
- Separate route styled per §6.5 (same navy base, AACMA green accent), AACMA logo and a clear **"← Back to AACMA"** link.
- Audience sections: **Agency & woreda/sub-city staff · Residents · High-school students**.
- Course cards (waste segregation, community cleanliness, field sanitation awareness, school participation), marked "Illustrative — coming soon" and **not clickable**.
- Feature legend previews: lesson video, reading, in-lesson questions, final exam, progress, digital certificate, each labelled as a future capability.
- The assistant widget is also available here, keeping the same conversation.

---

## 8. Fixed strings (D14)

- `strings.am.json` holds Appendix B copied exactly, keyed by section (e.g. `greeting`, `ask_photo`, `opt_take_photo`, …, `restart_confirm`).
- A **checksum test** fails the build if any Amharic string changes without a matching change to the approved hash. This stops strings being edited "silently".
- Placeholders like `[የተጠቃሚው ስም]` become template slots.
- The approved reference text is `DEMO-AACMA-001`. In the extracted PDF text it appears as `DEMO AACMA 001 - -`; that's a PDF-extraction glitch and isn't copied.
- Fonts per §6.2: the system stack for Latin (as in the template) and self-hosted **Noto Sans Ethiopic** for Amharic. Rendering of every string is checked on iOS Safari and Android Chrome.

---

## 9. Acceptance test mapping

| Test | How verified |
|---|---|
| T01 | Playwright at 1440×900 and 390×844 screenshots; manual check on a real phone |
| T02 / T03 | `eval.ts` held-out EN/AM questions plus live manual run in the widget, recorded |
| T04 | Playwright: free-text complaint ("garbage not collected near my home" / Amharic) → photo step |
| T05 | Manual on real Android + iPhone (camera); Playwright for file upload / replace / remove |
| T06 / T07 | Manual on phone (allow, deny, retry); Playwright with geolocation permission granted / denied |
| T08 | Vitest for validators; Playwright for missing / invalid inputs |
| T09 / T10 | Playwright: question mid-flow, language switch mid-flow → fields unchanged (state snapshot) |
| T11 | Playwright: edit each field from review → summary updates → confirm → DEMO ID |
| T12 | Playwright network log assertion: no request after confirm; manual DevTools capture |
| T13 | Playwright: `/training` loads, no course links, back link works |
| T14 | Bundle grep for key patterns; restart test; fallback video and screenshots stored in `docs/evidence/` |

Results go in `docs/test-checklist.md` with pass/fail, evidence links and known limitations (§11.1).

---

## 10. Open questions for Meleph (needed before / during build)

1. **Brand assets and permission:** logo SVG received 7 Nov (`docs/logo.svg`). It appears to be traced from the JPEG (same 474×474 frame). If AACMA has an official vector master or brand guide, prefer it and confirm the hex values. Still needed: the official agency name lock-up or wordmark, and confirmation that use is approved (D01).
2. **Homepage copy:** accurate About/Services text and any contact details we're allowed to show. Otherwise the placeholders stay.
3. **Corpus:** the actual files and links for the knowledge base, with permission and recency notes. Even 5–10 good sources make the Q&A demo credible. **Without a corpus, T02/T03 can't pass.**
4. **English fixed strings:** Appendix A doesn't have English versions of several Amharic turns (initial option chips, GPS "is this correct?", edit menu, restart confirm, error strings 11–16). I'll draft them in `strings.en.json` marked *pending approval*.
5. **Location UI (D07):** approve §5.2, and confirm the sub-city list.
6. **Website language toggle:** confirm that **no** Amharic version of the website is expected in November, since D02 says "English first" and the plan treats Amharic as assistant-only.
7. **Demo photo and fictional persona:** supply a photo you have permission to use, plus a fictional name, test phone number and Bole landmark for the script.
8. **OpenAI account:** who owns the API key and billing project, and what budget cap?
9. **Named acceptance decision-maker** (§11.2).

---

## 11. Schedule (5 working days to 12 Nov)

| Date | Work | Gate |
|---|---|---|
| **Sat 7 Nov** | Plan review. Scaffold repo and staging. Static UI previews: homepage (desktop/mobile), widget (floating/expanded), review/confirm, Training Centre | Previews sent to Meleph |
| **Sun 8 Nov** | **Design approval (§5.1).** In parallel: ingestion pipeline plus whatever sources have arrived; string tables | **Build can't proceed without approval** |
| **Mon 9 Nov** | Complaint state machine, photo/location/validators, review/edit/confirm, restart | Complaint path working end to end without the model |
| **Tue 10 Nov** | `/api/chat`: retrieval, structured turn handling, language logic, rate limits, failure handling. Model comparison on Amharic | Live bilingual Q&A on staging |
| **Wed 11 Nov** | Training Centre page, mobile polish, accessibility, Playwright suite, eval run | T01–T14 first pass |
| **Thu 12 Nov** | Fixes, Amharic runtime QA with Meleph, fallback recording, handoff docs (§11.1) | **Prototype complete** |
| 13–14 Nov | Buffer, rehearsal support | |
| 15 Nov | Director package | |

**Biggest schedule risks:** (1) design approval slipping past 8 Nov, (2) the corpus arriving late or as Amharic PDFs that need OCR, (3) the quality of Amharic the model generates. Item 3 is why the model comparison is on day 4, not the last day.

---

## 12. Notes on the director pitch script (alignment with the build)

These don't need code changes. They're flagged so the presenter and the prototype tell the same story:

- **§2C (photo-based waste identification) and "AI-Powered Severity Assessment"** are described in the present/near-future tense as system functions. The prototype deliberately does **neither** (AI-07, §9.3). If the director uploads a photo and asks "what is this?", the assistant won't identify it. Suggest the presenter introduces both explicitly as *next-phase* capabilities, shown in the visuals, not in the live demo.
- **§3 dashboard and the internal workflow** are Meleph visuals (D12). The script already uses show-cues for them, which is consistent.
- **PDF rendering defect, page 1:** "Digital Ethiopia 2030" renders as a broken glyph followed by "0 3 0", and several words run together ("MelephAI", "Addis AbabaResilience", "MetaAdvertising", "Social MediaCampaigns"). Re-export with embedded fonts before printing.
- The live demo dialogue in §2A matches Appendix B's flow (photo → location → description → name → phone → review → DEMO reference), so the script and the build are consistent there.

---

## 13. Change log

**7 Nov 2026 — decisions by the project owner (supersede the spec where they conflict):**

| Change | Spec item affected | What was built |
|---|---|---|
| AI provider is **Google Gemini** (free tier, for client demos); OpenAI kept as an option (`AI_PROVIDER`) | D04 ("powered by OpenAI API") | `lib/ai/gemini.ts`, `lib/ai/provider.ts`; embeddings `gemini-embedding-001` |
| **Photo analysis is in scope** to show capabilities | AI-07, §3 "Photo intelligence", §9.3 | `/api/vision`: (1) "What waste is this?" identification + separation guidance in the chat; (2) AI preliminary severity assessment shown after confirmation, labelled for staff |
| Citizen review still shows only the citizen's own words | D08 / US-04 (kept) | Assessment appears only after confirmation, never in the review card |
| Site-wide "demonstration service" strip removed | WEB-06 (partly) | The confirmation still states that nothing was submitted (Appendix B §10) |
| Free-tier data use accepted for demos | §6.2 | Photos and citizen text go to Gemini; name and phone still never sent |

Severity criteria in `lib/ai/vision.ts` are **demonstration criteria**; AACMA must define the real ones before production.

**7 Nov 2026 (later) — admin dashboard built** (spec D12 / §9.1–9.2 had this as Meleph visuals only):

- `/admin`, password-protected (`ADMIN_PASSWORD`, signed 12-hour session cookie; `proxy.ts` guards pages, every admin API checks the session).
- Data: fictional sample cases (`lib/cases/seed.ts`, `SAMPLE-` references, no personal data) + live reports from the website assistant (`POST /api/cases`), which now receive sequential `DEMO-AACMA-###` references. The citizen confirmation keeps the approved Appendix B wording ("not sent to the agency") — still true: the dashboard is a demonstration, not AACMA's system.
- The citizen's name and phone now reach the demo dashboard (staff need a contact); they are still never sent to the AI.
- AI: preliminary assessment runs server-side on submission and is stored on the case; staff can override the priority or re-run it; the management summary uses aggregate figures only.
- Central dispatch vs. direct sub-city routing is shown as "to be confirmed"; SLA targets are demonstration values.

**7 Nov 2026 — Firebase storage for website reports.** `lib/cases/repo.ts` stores live cases in Firebase Realtime Database (`aamca-c0678`) through the **Admin SDK** with a service-account key (`cases/{id}`, `photos/{id}`, `meta/counter` for `DEMO-AACMA-###`). Falls back to `.data/cases.json` when no key is configured. The browser never accesses the database, so its rules must deny all public access (`database.rules.json`) — at setup time the database was in open test mode (publicly readable).
