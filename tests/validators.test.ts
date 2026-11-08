import { describe, expect, it } from "vitest";
import {
  checkPhoto,
  formatPhone,
  isPlainNameAnswer,
  isValidName,
  looksLikePhoneAttempt,
  normalizePhone,
} from "@/lib/complaint/validators";
import { detectLang } from "@/lib/i18n/detectLang";

describe("normalizePhone (C6, T08)", () => {
  it.each([
    ["0911234567", "+251911234567"],
    ["0911 23 45 67", "+251911234567"],
    ["091-123-4567", "+251911234567"],
    ["911234567", "+251911234567"],
    ["+251911234567", "+251911234567"],
    ["+251 91 123 4567", "+251911234567"],
    ["251911234567", "+251911234567"],
    ["00251911234567", "+251911234567"],
    ["0711234567", "+251711234567"],
    ["+251711234567", "+251711234567"],
  ])("accepts %s", (input, expected) => {
    expect(normalizePhone(input)).toBe(expected);
  });

  it.each(["12345", "0811234567", "091123456", "09112345678", "+1 555 123 4567", "call me", "0911abc567", ""])(
    "rejects %s",
    (input) => {
      expect(normalizePhone(input)).toBeNull();
    },
  );

  it("formats for display", () => {
    expect(formatPhone("+251911234567")).toBe("+251 91 123 4567");
  });

  it("recognises a phone attempt", () => {
    expect(looksLikePhoneAttempt("091 123")).toBe(true);
    expect(looksLikePhoneAttempt("when do trucks come?")).toBe(false);
  });
});

describe("names", () => {
  it("accepts Latin and Ethiopic names", () => {
    expect(isValidName("Abebe Kebede")).toBe(true);
    expect(isValidName("አበበ ከበደ")).toBe(true);
  });
  it("rejects empty, too short or numeric", () => {
    expect(isValidName("")).toBe(false);
    expect(isValidName("A")).toBe(false);
    expect(isValidName("0911234567")).toBe(false);
  });
  it("treats questions as not-a-name", () => {
    expect(isPlainNameAnswer("Why do you need my name?")).toBe(false);
    expect(isPlainNameAnswer("ስሜን ለምን ይፈልጋሉ?")).toBe(false);
    expect(isPlainNameAnswer("Selam Tesfaye")).toBe(true);
  });
});

describe("photos", () => {
  it("accepts images up to 10 MB", () => {
    expect(checkPhoto({ type: "image/jpeg", size: 2_000_000 }).ok).toBe(true);
    expect(checkPhoto({ type: "application/pdf", size: 1000 }).ok).toBe(false);
    expect(checkPhoto({ type: "image/png", size: 11 * 1024 * 1024 }).ok).toBe(false);
  });
});

describe("detectLang (AI-02)", () => {
  it("detects Amharic, English, and neither", () => {
    expect(detectLang("በአካባቢያችን ያለው ቆሻሻ አልተሰበሰበም")).toBe("am");
    expect(detectLang("Garbage has not been collected")).toBe("en");
    expect(detectLang("0911234567")).toBeNull();
    expect(detectLang("ok")).toBeNull();
  });
});
