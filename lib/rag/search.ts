/**
 * Hybrid retrieval over the static knowledge index (plan §4):
 * embedding similarity + BM25 keyword scores, merged with reciprocal-rank fusion.
 * BM25 matters for Amharic, where embedding similarity alone is weaker.
 */
import indexJson from "@/data/index.json";
import { embeddingModelId, embedTexts } from "../ai/provider";
import type { Chunk, KnowledgeIndex } from "./types";

const index = indexJson as KnowledgeIndex;
const TOP_K = 6;
const MIN_COSINE = 0.3;
const RRF_K = 60;

export function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []).filter((w) => w.length > 1);
}

class Bm25 {
  private docs: Map<string, number>[];
  private lengths: number[];
  private avg: number;
  private df = new Map<string, number>();
  constructor(texts: string[]) {
    this.docs = texts.map((t) => {
      const tf = new Map<string, number>();
      for (const w of tokenize(t)) tf.set(w, (tf.get(w) ?? 0) + 1);
      return tf;
    });
    this.lengths = this.docs.map((d) => [...d.values()].reduce((a, b) => a + b, 0));
    this.avg = this.lengths.reduce((a, b) => a + b, 0) / Math.max(1, this.lengths.length);
    for (const d of this.docs) for (const w of d.keys()) this.df.set(w, (this.df.get(w) ?? 0) + 1);
  }
  scores(query: string): number[] {
    const q = [...new Set(tokenize(query))];
    const n = this.docs.length;
    return this.docs.map((d, i) => {
      let s = 0;
      for (const w of q) {
        const f = d.get(w);
        if (!f) continue;
        const df = this.df.get(w) ?? 0;
        const idf = Math.log(1 + (n - df + 0.5) / (df + 0.5));
        s += (idf * f * 2.2) / (f + 1.2 * (0.25 + (0.75 * this.lengths[i]) / this.avg));
      }
      return s;
    });
  }
}

let bm25: Bm25 | null = null;

function cosine(a: number[], b: number[]): number {
  let dot = 0,
    na = 0,
    nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
}

export function hasKnowledge(): boolean {
  return index.chunks.length > 0;
}

export async function search(query: string): Promise<Chunk[]> {
  const chunks = index.chunks;
  if (chunks.length === 0 || !query.trim()) return [];
  bm25 ??= new Bm25(chunks.map((c) => `${c.title} ${c.text}`));

  const keyword = bm25
    .scores(query)
    .map((score, i) => ({ i, score }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);

  let semantic: { i: number; score: number }[] = [];
  // Only use vectors made by the current embedding model; otherwise fall back to keywords.
  if (index.embeddingModel === embeddingModelId()) try {
    const [q] = await embedTexts([query], "query");
    semantic = chunks
      .map((c, i) => ({ i, score: cosine(q, c.embedding) }))
      .filter((r) => r.score >= MIN_COSINE)
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);
  } catch (err) {
    console.warn(JSON.stringify({ event: "embed_failed", message: String(err).slice(0, 200) }));
  }

  const fused = new Map<number, number>();
  for (const list of [semantic, keyword]) {
    list.forEach((r, rank) => fused.set(r.i, (fused.get(r.i) ?? 0) + 1 / (RRF_K + rank + 1)));
  }
  return [...fused.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, TOP_K)
    .map(([i]) => chunks[i]);
}
