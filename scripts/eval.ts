/**
 * Runs eval/questions.json against a running server and writes docs/evidence/eval-<timestamp>.md.
 *
 *   npm run dev            # in another terminal (with OPENAI_API_KEY set)
 *   npm run eval           # or: BASE_URL=https://staging.example npm run eval
 *
 * Pass/fail here is a first pass only; a person must still read the answers (AI-05).
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

type Q = { id: string; lang: "en" | "am"; q: string; expect: "grounded" | "no_info" | "complaint" };
type R = { action: string; reply: string; sources: { id: string; title: string; page?: number | null }[] };

const BASE = process.env.BASE_URL || "http://localhost:3000";
const AUTH: Record<string, string> =
  process.env.STAGING_USER && process.env.STAGING_PASSWORD
    ? { Authorization: `Basic ${Buffer.from(`${process.env.STAGING_USER}:${process.env.STAGING_PASSWORD}`).toString("base64")}` }
    : {};

function verdict(q: Q, r: R | null): string {
  if (!r) return "FAIL (no response)";
  if (q.expect === "complaint") return r.action === "start_complaint" ? "pass" : "FAIL";
  if (q.expect === "grounded") return r.action === "answer" && r.sources.length > 0 ? "pass" : "FAIL";
  return r.sources.length === 0 ? "check" : "FAIL (cited a source)";
}

async function main() {
  const { questions } = JSON.parse(readFileSync(join(process.cwd(), "eval", "questions.json"), "utf8")) as { questions: Q[] };
  const lines: string[] = [];
  for (const q of questions) {
    let r: R | null = null;
    const started = Date.now();
    try {
      const res = await fetch(`${BASE}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...AUTH },
        body: JSON.stringify({ messages: [{ role: "user", content: q.q }], step: "idle", lang: q.lang, filled: {} }),
      });
      if (res.ok) r = (await res.json()) as R;
      else console.error(q.id, res.status, await res.text());
    } catch (err) {
      console.error(q.id, err);
    }
    const ms = Date.now() - started;
    const v = verdict(q, r);
    console.log(`${q.id.padEnd(16)} ${v.padEnd(22)} ${r?.action ?? "-"} (${ms} ms)`);
    lines.push(
      `### ${q.id} — ${v}\n\n- Expect: ${q.expect} · Action: ${r?.action ?? "—"} · ${ms} ms\n- Q: ${q.q}\n- A: ${(r?.reply || "—").replace(/\n/g, " ")}\n- Sources: ${r?.sources.map((s) => `${s.title}${s.page ? ` p.${s.page}` : ""}`).join("; ") || "—"}\n`,
    );
  }
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  mkdirSync(join(process.cwd(), "docs", "evidence"), { recursive: true });
  const file = join(process.cwd(), "docs", "evidence", `eval-${stamp}.md`);
  writeFileSync(file, `# Assistant eval — ${new Date().toISOString()}\n\nServer: ${BASE}\n\n"check" = declined without citing; a reviewer must confirm nothing was invented.\n\n${lines.join("\n")}`);
  console.log(`\nWrote ${file}`);
}

main();
