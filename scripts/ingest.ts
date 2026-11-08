/**
 * Builds data/index.json from corpus/sources.json + corpus/raw/* (plan §4, spec §12.2).
 *
 *   npm run ingest            # requires the AI provider key (GEMINI_API_KEY by default)
 *
 * Also writes docs/source-inventory.md, which lists every source as
 * ingested / failed / missing / excluded — never claiming coverage that does not exist.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { extname, join } from "node:path";
import { extractText, getDocumentProxy } from "unpdf";
import { embeddingModelId, embedTexts } from "../lib/ai/provider";
import type { Chunk, KnowledgeIndex } from "../lib/rag/types";

try {
  process.loadEnvFile(".env.local");
} catch {
  // no .env.local: rely on the environment
}

type Source = {
  id: string;
  title: string;
  issuer: string;
  lang: "en" | "am" | "mixed";
  type: string;
  file: string;
  url: string | null;
  date: string;
  pages: string;
  usage: string;
  owner: string;
  status: "current" | "historical" | "unknown";
  caveat: string;
  include: boolean;
};

type Result = { source: Source; outcome: "ingested" | "failed" | "missing" | "excluded"; detail: string; chunks: number };

const ROOT = process.cwd();
const RAW = join(ROOT, "corpus", "raw");
const CHUNK_CHARS = 1500;
const OVERLAP_CHARS = 200;

async function readPages(path: string): Promise<string[]> {
  const ext = extname(path).toLowerCase();
  const buf = readFileSync(path);
  if (ext === ".pdf") {
    const pdf = await getDocumentProxy(new Uint8Array(buf));
    const { text } = await extractText(pdf, { mergePages: false });
    return text as string[];
  }
  const raw = buf.toString("utf8");
  if (ext === ".html" || ext === ".htm") {
    return [raw.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ")];
  }
  return [raw]; // .txt, .md
}

/** Amharic PDFs with legacy fonts often extract as Latin garbage; detect that rather than index nonsense. */
function looksGarbled(pages: string[], lang: Source["lang"]): string | null {
  const text = pages.join(" ");
  const letters = text.match(/\p{L}/gu)?.length ?? 0;
  if (letters < 50) return "no extractable text (scanned PDF? needs OCR)";
  if (lang === "am") {
    const ethiopic = text.match(/[ሀ-᎟]/g)?.length ?? 0;
    if (ethiopic / letters < 0.4) return "Amharic text did not extract as Ethiopic script (legacy font encoding — needs OCR)";
  }
  return null;
}

function chunkPage(text: string): string[] {
  const clean = text.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  if (!clean) return [];
  const paras = clean.split(/\n\s*\n/);
  const out: string[] = [];
  let cur = "";
  for (const p of paras) {
    if (cur && cur.length + p.length > CHUNK_CHARS) {
      out.push(cur.trim());
      cur = cur.slice(-OVERLAP_CHARS) + "\n\n";
    }
    if (p.length > CHUNK_CHARS) {
      for (let i = 0; i < p.length; i += CHUNK_CHARS - OVERLAP_CHARS) out.push(p.slice(i, i + CHUNK_CHARS));
      cur = "";
    } else {
      cur += p + "\n\n";
    }
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

async function main() {
  const { sources } = JSON.parse(readFileSync(join(ROOT, "corpus", "sources.json"), "utf8")) as { sources: Source[] };
  const results: Result[] = [];
  const pending: Omit<Chunk, "embedding">[] = [];

  for (const s of sources) {
    if (!s.include) {
      results.push({ source: s, outcome: "excluded", detail: "include=false", chunks: 0 });
      continue;
    }
    const path = s.file ? join(RAW, s.file) : "";
    if (!path || !existsSync(path)) {
      results.push({ source: s, outcome: "missing", detail: `file not found: corpus/raw/${s.file || "(none)"}`, chunks: 0 });
      continue;
    }
    try {
      const pages = await readPages(path);
      const garbled = looksGarbled(pages, s.lang);
      if (garbled) {
        results.push({ source: s, outcome: "failed", detail: garbled, chunks: 0 });
        continue;
      }
      let n = 0;
      pages.forEach((page, pi) => {
        chunkPage(page).forEach((text, ci) => {
          pending.push({
            id: `${s.id}#p${pi + 1}-c${ci + 1}`,
            sourceId: s.id,
            title: s.title,
            issuer: s.issuer,
            lang: s.lang,
            url: s.url,
            page: pages.length > 1 ? pi + 1 : null,
            status: s.status,
            text,
          });
          n++;
        });
      });
      results.push({ source: s, outcome: "ingested", detail: `${pages.length} page(s)`, chunks: n });
    } catch (err) {
      results.push({ source: s, outcome: "failed", detail: String(err).slice(0, 200), chunks: 0 });
    }
  }

  const chunks: Chunk[] = [];
  for (let i = 0; i < pending.length; i += 64) {
    const batch = pending.slice(i, i + 64);
    const vectors = await embedTexts(batch.map((c) => `${c.title}\n${c.text}`), "document");
    batch.forEach((c, j) => chunks.push({ ...c, embedding: vectors[j].map((v) => Math.round(v * 1e5) / 1e5) }));
    console.log(`embedded ${Math.min(i + 64, pending.length)}/${pending.length}`);
  }

  const index: KnowledgeIndex = {
    builtAt: new Date().toISOString(),
    embeddingModel: chunks.length ? embeddingModelId() : null,
    chunks,
  };
  mkdirSync(join(ROOT, "data"), { recursive: true });
  writeFileSync(join(ROOT, "data", "index.json"), JSON.stringify(index));

  const rows = results
    .map(
      (r) =>
        `| ${r.source.id} | ${r.source.title} | ${r.source.issuer || "—"} | ${r.source.lang} | ${r.source.date || "—"} | ${r.source.status} | ${r.source.usage || "—"} | **${r.outcome}** | ${r.chunks} | ${r.detail}${r.source.caveat ? `; ${r.source.caveat}` : ""} |`,
    )
    .join("\n");
  const md = `# Knowledge source inventory

Generated by \`npm run ingest\` on ${index.builtAt}. Embedding model: ${index.embeddingModel ?? "—"}.
Only sources marked **ingested** are available to the assistant. Everything else is listed so coverage is never overstated (spec §6.1).

| ID | Title | Issuer | Lang | Date | Status | Usage | Outcome | Chunks | Detail |
|---|---|---|---|---|---|---|---|---|---|
${rows || "| — | No sources listed in corpus/sources.json | | | | | | | | |"}

**Totals:** ${results.filter((r) => r.outcome === "ingested").length} ingested, ${results.filter((r) => r.outcome === "failed").length} failed, ${results.filter((r) => r.outcome === "missing").length} missing, ${chunks.length} chunks.
`;
  writeFileSync(join(ROOT, "docs", "source-inventory.md"), md);
  console.log(md);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
