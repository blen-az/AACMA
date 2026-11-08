import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { AM_APPROVED, AM_PENDING, EN, t } from "@/lib/i18n/strings";

/**
 * Appendix B strings are approved by the Meleph project lead and must not change
 * silently (D14). If this test fails, either revert the edit or get approval and
 * update the hash together with docs/strings-pending-approval.md.
 */
const APPROVED_HASH = "7c95e5b8669c6a91ed534e259d1cd44fd641ced6a4d94ae106d62ec4fd590089";

describe("approved Amharic copy", () => {
  it("is unchanged", () => {
    const hash = createHash("sha256").update(JSON.stringify(AM_APPROVED)).digest("hex");
    expect(hash).toBe(APPROVED_HASH);
  });

  it("contains the exact Appendix B greeting and demo notice", () => {
    expect(AM_APPROVED.greeting_hello).toBe("ሰላም! እንኳን ደህና መጡ።");
    expect(AM_APPROVED.receipt_notice).toBe("ይህ የሙከራ ማሳያ ብቻ ነው። ቅሬታው ለኤጀንሲው አልተላከም።");
  });

  it("does not let pending drafts override approved keys", () => {
    for (const key of Object.keys(AM_PENDING)) expect(key in AM_APPROVED).toBe(false);
  });

  it("has an English string for every key", () => {
    for (const key of [...Object.keys(AM_APPROVED), ...Object.keys(AM_PENDING)]) {
      expect(EN[key as keyof typeof EN], key).toBeTruthy();
    }
  });

  it("returns approved text for Amharic", () => {
    expect(t("am", "ask_name")).toBe("እባክዎ ሙሉ ስምዎን ይጻፉ።");
  });
});
