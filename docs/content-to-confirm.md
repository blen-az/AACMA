# Content and inputs to confirm before release

Nothing below was invented as fact; each item is either drafted from Meleph's own documents or deliberately left out. Spec WEB-02 / §2.1 / §11.2.

| # | Item | Current state | Where | Needed from |
|---|---|---|---|---|
| 1 | Official English agency name | "Addis Ababa City Cleansing Management Agency" (assumed expansion of AACMA) | `content/site.ts` | Meleph / AACMA |
| 2 | Official name lock-up / wordmark | Logo SVG + text set in the site font | Header, footer | Meleph |
| 3 | Brand hex values | Taken from `docs/logo.svg` (traced) | `app/globals.css` | Meleph (brand guide, if any) |
| 4 | About text | Drafted from the Amharic director pitch (woreda awareness, training, participation; Smart City / Digital Ethiopia 2030) | `app/page.tsx` About | Meleph |
| 5 | Contact details | **Not shown** — "Official office contact details will be published here." | Contact section | AACMA |
| 6 | News items | Three items about the digital services themselves (no dates, no invented agency news) | News & Updates | Meleph |
| 7 | Publications | Category cards marked "Library in preparation" | Publications | Approved documents (same as knowledge base) |
| 8 | Hero image | Code-drawn skyline (no stock photo) | `components/site/Skyline.tsx` | Licensed Addis Ababa photo (optional) |
| 9 | Training course titles | Six illustrative titles, labelled illustrative, not clickable | `app/training/page.tsx` | Meleph / AACMA |
| 10 | Knowledge-base documents | **None loaded** — the assistant declines factual questions until sources are ingested | `corpus/` | Meleph (Appendix C metadata) |
| 11 | Demo photo & persona | Use a permitted garbage photo, fictional name, test-pattern phone | Rehearsal | Meleph |
| 12 | Pending strings | See `docs/strings-pending-approval.md` | Assistant | Meleph lead + Amharic reviewer |
| 13 | OpenAI account / budget / staging host | Not configured | `.env` / hosting | Meleph |
