# AACMA website, AI assistant & Virtual Training Centre

Next.js 16 site built to the *AACMA Engineering Handoff V1.0* (see `docs/IMPLEMENTATION_PLAN.md`).

- `/` — English-first AACMA homepage
- `/training` — Virtual Training Centre homepage (separate look, AACMA green)
- `/admin` — **operations dashboard** for AACMA staff (password): director overview with KPIs and charts, AI management summary (English/Amharic), case management (photo, map, AI assessment, assignment, priority override, status, notes, timeline) and escalations by resolution target
- Floating **AI assistant** on every page (Google **Gemini** by default; OpenAI optional), server-side:
  - free-form questions in English or Amharic, grounded in `data/index.json`
  - **"What waste is this?"** — a resident sends a photo; the AI identifies the items, recyclability and how to separate them
  - the citizen **complaint journey** (photo → location → description → name → phone → review/edit → `DEMO-AACMA-001`), followed by an **AI preliminary assessment for staff** (visible waste, priority, risks, suggested action)

Complaints are **demonstrations**: nothing is stored or sent to AACMA. Photos are sent to the AI provider only for analysis (not stored); the name and phone number are never sent to the AI.

## Run locally

```bash
npm install
cp .env.example .env.local      # add GEMINI_API_KEY (Google AI Studio)
npm run ai:check                # verifies the key, lists models, tests JSON + embeddings
npm run dev                     # http://localhost:3000
```

Without a key the site still works: the assistant shows an "AI unavailable" notice and the complaint flow continues on local rules (AI-08).

## Commands

| Command | What it does |
|---|---|
| `npm run dev` / `build` / `start` | Develop / production build / serve |
| `npm test` | Unit tests: complaint state machine, validators, locked Amharic copy |
| `npm run typecheck`, `npm run lint` | Static checks |
| `npm run db:check` | Check the case database (Firebase or local) and whether it is publicly readable |
| `npm run ai:check` | Check the AI key/model and list available Gemini models |
| `npm run ingest` | Build the knowledge index from `corpus/sources.json` + `corpus/raw/*`; writes `docs/source-inventory.md` |
| `npm run eval` | Ask `eval/questions.json` against a running server; writes `docs/evidence/eval-*.md` |

## Knowledge base

1. Put approved files (PDF, TXT, MD, HTML) in `corpus/raw/` (git-ignored).
2. Add one entry per file to `corpus/sources.json` (Appendix C metadata) with `"include": true`.
3. `npm run ingest`, then commit `data/index.json` and `docs/source-inventory.md`.

Amharic PDFs that don't extract as Ethiopic text are marked **failed** (they need OCR) rather than indexed as garbage.

## Deploy (private staging)

Vercel (or any Node host):

- Environment variables from `.env.example`. **API keys must only be set server-side.**
- **Gemini free tier:** fine for client demos. Google may use free-tier inputs to improve its products, and per-minute/per-day quotas are low — use test data, and check quotas in AI Studio before a presentation. Switch to a paid key (or `AI_PROVIDER=openai`) before real public use.
- Set `STAGING_USER` + `STAGING_PASSWORD` to put the whole site behind HTTP Basic auth (D13); or use Vercel Deployment Protection.
- `AI_RATE_PER_MINUTE` / `AI_DAILY_LIMIT` cap usage per instance.

## Admin dashboard

- Sign in at `/admin` with `ADMIN_PASSWORD` from `.env.local`.
- Shows ~80 **fictional sample cases** (marked SAMPLE) plus every report confirmed on the website (marked WEBSITE, reference `DEMO-AACMA-001`, `-002`, …). New website reports appear within ~8 seconds with a notification.
- Website reports are stored in **Firebase Realtime Database** when configured (top bar shows "Firebase"), otherwise in `.data/cases.json` (git-ignored, top bar shows "Local storage"). Sample cases are never written to the database.

### Photos (Cloudinary)

When `CLOUDINARY_CLOUD_NAME` and `CLOUDINARY_UPLOAD_PRESET` are set (cloud `q1pfgbro`, unsigned preset `AAMCA project`), report photos are uploaded to Cloudinary (folder `aacma-reports`) and the case stores only the URL. URLs are public but unguessable. If an upload fails, the photo is kept in the case store instead. Unsigned presets cannot delete files — remove old demo photos in the Cloudinary Media Library.

### Firebase setup

1. Firebase console → Project settings → **Service accounts** → *Generate new private key*.
2. Save the downloaded file as `.secrets/firebase-service-account.json` (git-ignored). For hosting, put the JSON (or its base64) in `FIREBASE_SERVICE_ACCOUNT` instead.
3. `FIREBASE_DATABASE_URL` is already set in `.env.example`.
4. Realtime Database → **Rules** → publish the contents of `database.rules.json` (deny all public access). The server uses the Admin SDK, which is not affected by these rules.
5. Restart `npm run dev`, then `npm run db:check` — it tests read/write and warns if the database is still publicly readable.

The web config (`apiKey`, `appId`, …) is not needed: browsers never talk to the database directly.
- The ↺ button in the dashboard top bar clears website reports and regenerates the sample data (for rehearsals).
- Priority targets (4 h / 24 h / 48 h / 72 h) and severity criteria are **demonstration values**; AACMA defines the real ones.

## Demo rehearsal

- The ↺ button in the assistant header restarts the conversation (clears the photo and all fields).
- Reload the page for a completely fresh state; nothing persists between visits.
- Use fictional names and a test-pattern phone number (e.g. `0911 00 00 00`).

## Where things live

| Path | |
|---|---|
| `lib/complaint/machine.ts` | The complaint state machine — owns step order, fields, confirmation, reference |
| `lib/complaint/validators.ts` | Ethiopian phone formats, name/photo checks |
| `lib/i18n/strings.ts` | Assistant copy: Appendix B Amharic (locked by test), English, pending drafts |
| `app/api/chat/route.ts` | Text turns: retrieval + AI classification/answer |
| `app/api/vision/route.ts` | Photo analysis: waste identification and staff assessment |
| `lib/ai/provider.ts` | Gemini / OpenAI switch (`AI_PROVIDER`) |
| `lib/ai/prompt.ts`, `lib/ai/vision.ts` | Prompts and JSON schemas |
| `lib/rag/search.ts` | Hybrid embedding + BM25 retrieval |
| `components/assistant/*` | Widget UI and conversation orchestration |
| `lib/cases/*` | Case store, sample data, SLA rules, statistics |
| `app/admin/*`, `components/admin/*` | Operations dashboard |
| `content/site.ts` | Agency facts used on the site (items marked CONFIRM) |
| `app/globals.css` | Design tokens (plan §6) |
