/**
 * Checks the case database:  npm run db:check
 * - which store is active (Firebase or local file)
 * - Firebase: write/read/delete a test value with the Admin SDK
 * - Firebase: warns if the database is readable WITHOUT credentials (open rules)
 */
try {
  process.loadEnvFile(".env.local");
} catch {
  // no .env.local
}

async function main() {
  const { repo } = await import("../lib/cases/repo");
  const r = await repo();
  console.log(`Case store: ${r.kind}`);
  if (r.kind === "file") {
    console.log("Firebase is not configured (needs FIREBASE_DATABASE_URL and a service account). Using .data/cases.json.");
    return;
  }

  const { getApps } = await import("firebase-admin/app");
  const { getDatabase } = await import("firebase-admin/database");
  const db = getDatabase(getApps().find((a) => a.name === "aacma")!);
  const ref = db.ref("meta/healthcheck");
  const stamp = new Date().toISOString();
  await ref.set(stamp);
  const back = (await ref.get()).val();
  await ref.remove();
  console.log(back === stamp ? "Admin SDK write/read/delete: OK" : "Admin SDK read-back mismatch");
  console.log(`Website reports stored: ${(await r.list()).length}`);

  const url = process.env.FIREBASE_DATABASE_URL!.replace(/\/$/, "");
  const res = await fetch(`${url}/.json?shallow=true`);
  if (res.ok) {
    console.warn(
      "\n⚠ The database is readable WITHOUT credentials (open security rules).\n" +
        "  Reports contain names and phone numbers. In the Firebase console → Realtime Database → Rules,\n" +
        '  publish the rules in database.rules.json ({ ".read": false, ".write": false }).',
    );
    process.exitCode = 2;
  } else {
    console.log(`Public access blocked (HTTP ${res.status}): OK`);
  }
  process.exit();
}

main().catch((err) => {
  console.error(`\n✗ ${err instanceof Error ? err.message : err}`);
  process.exit(1);
});
