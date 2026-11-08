/**
 * Storage for website reports (live cases). Server-side only.
 *
 * - Firebase Realtime Database via the Admin SDK when a service account is configured
 *   (FIREBASE_SERVICE_ACCOUNT_FILE or FIREBASE_SERVICE_ACCOUNT + FIREBASE_DATABASE_URL).
 *   The Admin SDK bypasses security rules, so the database rules can (and should) deny
 *   all public access — reports contain citizens' names and phone numbers.
 * - Otherwise a local JSON file (.data/cases.json) — fine for demos run from a laptop.
 *
 * Layout in Firebase:  cases/{id} (record, no photo) · photos/{id} · meta/counter
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import type { CaseRecord } from "./types";

export type Photo = { mimeType: string; base64: string };

export interface CaseRepo {
  readonly kind: "firebase" | "file";
  list(): Promise<CaseRecord[]>;
  get(id: string): Promise<CaseRecord | undefined>;
  put(c: CaseRecord): Promise<void>;
  getPhoto(id: string): Promise<Photo | undefined>;
  putPhoto(id: string, photo: Photo): Promise<void>;
  /** Next sequential number for DEMO-AACMA-### references. */
  nextNumber(): Promise<number>;
  clear(): Promise<void>;
}

/** Firebase drops null/undefined keys and stores arrays as objects; restore the shape. */
export function normalize(raw: Partial<CaseRecord> & { id: string }): CaseRecord {
  const arr = <T,>(v: unknown): T[] => (Array.isArray(v) ? v : v && typeof v === "object" ? Object.values(v) : []) as T[];
  return {
    reference: "",
    source: "web",
    createdAt: new Date(0).toISOString(),
    status: "new",
    severity: null,
    severitySource: null,
    assessment: null,
    assessmentStatus: "none",
    subcity: null,
    subcityApprox: false,
    description: "",
    reporterName: "",
    reporterPhone: "",
    lang: "en",
    hasPhoto: false,
    assignedTo: null,
    dueAt: null,
    firstActionAt: null,
    resolvedAt: null,
    ...raw,
    location: { mode: "manual", ...(raw.location ?? {}) },
    history: arr(raw.history),
    ...(raw.assessment
      ? {
          assessment: {
            ...raw.assessment,
            visible_waste: arr(raw.assessment.visible_waste),
            severity_reasons: arr(raw.assessment.severity_reasons),
            risks: arr(raw.assessment.risks),
          },
        }
      : {}),
  };
}

const clean = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T; // drops undefined

// ---------------------------------------------------------------- Firebase

function serviceAccount(): Record<string, string> | null {
  const file = process.env.FIREBASE_SERVICE_ACCOUNT_FILE;
  if (file) {
    const path = resolve(process.cwd(), file);
    if (!existsSync(path)) {
      console.warn(JSON.stringify({ event: "firebase_key_missing", path: file }));
      return null;
    }
    return JSON.parse(readFileSync(path, "utf8"));
  }
  const inline = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!inline) return null;
  const text = inline.trim().startsWith("{") ? inline : Buffer.from(inline, "base64").toString("utf8");
  return JSON.parse(text);
}

async function firebaseRepo(): Promise<CaseRepo | null> {
  const url = process.env.FIREBASE_DATABASE_URL;
  const account = url ? serviceAccount() : null;
  if (!url || !account) return null;

  const { cert, getApps, initializeApp } = await import("firebase-admin/app");
  const { getDatabase } = await import("firebase-admin/database");
  const app = getApps().find((a) => a.name === "aacma") ?? initializeApp({ credential: cert(account), databaseURL: url }, "aacma");
  const db = getDatabase(app);

  return {
    kind: "firebase",
    async list() {
      const snap = await db.ref("cases").get();
      const val = (snap.val() ?? {}) as Record<string, CaseRecord>;
      return Object.entries(val).map(([id, c]) => normalize({ ...c, id }));
    },
    async get(id) {
      const snap = await db.ref(`cases/${id}`).get();
      return snap.exists() ? normalize({ ...snap.val(), id }) : undefined;
    },
    async put(c) {
      await db.ref(`cases/${c.id}`).set(clean(c));
    },
    async getPhoto(id) {
      const snap = await db.ref(`photos/${id}`).get();
      return snap.exists() ? (snap.val() as Photo) : undefined;
    },
    async putPhoto(id, photo) {
      await db.ref(`photos/${id}`).set(photo);
    },
    async nextNumber() {
      const res = await db.ref("meta/counter").transaction((n: number | null) => (n ?? 0) + 1);
      return Number(res.snapshot.val());
    },
    async clear() {
      await db.ref().update({ cases: null, photos: null, "meta/counter": 0 });
    },
  };
}

// ---------------------------------------------------------------- Local file

type FileData = { counter: number; cases: CaseRecord[]; photos: Record<string, Photo> };

function fileRepo(): CaseRepo {
  const FILE = process.env.CASES_FILE || join(process.cwd(), ".data", "cases.json");
  let data: FileData | null = null;

  const load = (): FileData => {
    if (data) return data;
    data = { counter: 0, cases: [], photos: {} };
    try {
      if (existsSync(FILE)) {
        const raw = JSON.parse(readFileSync(FILE, "utf8"));
        // Earlier format: an array of cases with inline photos.
        if (Array.isArray(raw)) {
          for (const c of raw as (CaseRecord & { photo?: Photo | null })[]) {
            if (c.photo) data.photos[c.id] = c.photo;
            delete c.photo;
            data.cases.push(normalize({ ...c, hasPhoto: Boolean(data.photos[c.id]) }));
          }
          data.counter = data.cases.length;
        } else {
          data = raw as FileData;
        }
      }
    } catch (err) {
      console.warn(JSON.stringify({ event: "cases_load_failed", message: String(err).slice(0, 200) }));
    }
    return data;
  };
  const save = () => {
    try {
      mkdirSync(dirname(FILE), { recursive: true });
      writeFileSync(FILE, JSON.stringify(load()));
    } catch {
      // read-only file system: memory only
    }
  };

  return {
    kind: "file",
    async list() {
      return load().cases;
    },
    async get(id) {
      return load().cases.find((c) => c.id === id);
    },
    async put(c) {
      const d = load();
      const i = d.cases.findIndex((x) => x.id === c.id);
      if (i >= 0) d.cases[i] = c;
      else d.cases.unshift(c);
      save();
    },
    async getPhoto(id) {
      return load().photos[id];
    },
    async putPhoto(id, photo) {
      load().photos[id] = photo;
      save();
    },
    async nextNumber() {
      const d = load();
      d.counter += 1;
      save();
      return d.counter;
    },
    async clear() {
      data = { counter: 0, cases: [], photos: {} };
      save();
    },
  };
}

// ---------------------------------------------------------------- selection

const g = globalThis as unknown as { __aacmaRepo?: Promise<CaseRepo> };

export function repo(): Promise<CaseRepo> {
  g.__aacmaRepo ??= (async () => {
    try {
      const fb = await firebaseRepo();
      if (fb) {
        console.log(JSON.stringify({ event: "case_store", kind: "firebase" }));
        return fb;
      }
    } catch (err) {
      console.error(JSON.stringify({ event: "firebase_init_failed", message: String(err).slice(0, 300) }));
    }
    console.log(JSON.stringify({ event: "case_store", kind: "file" }));
    return fileRepo();
  })();
  return g.__aacmaRepo;
}
