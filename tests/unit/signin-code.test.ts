import { describe, expect, it } from "vitest";
import { cleanCode, hashCode, makeCode, normaliseEmail, safeNext } from "@/lib/signin-code";

describe("sign-in codes (issue #82)", () => {
  it("makes 6-digit codes, keeping leading zeros", () => {
    const codes = Array.from({ length: 2000 }, makeCode);
    expect(codes.every((c) => /^\d{6}$/.test(c))).toBe(true);
    // 2,000 draws from a million: repeats are possible but rare; a broken generator repeats a lot.
    expect(new Set(codes).size).toBeGreaterThan(1990);
  });

  it("spreads codes across all first digits", () => {
    const firsts = new Set(Array.from({ length: 3000 }, () => makeCode()[0]));
    expect(firsts.size).toBe(10);
  });

  it("hashes the same code and email the same way, whatever the email's case or spaces", async () => {
    const a = await hashCode("s".repeat(40), "Ama@Example.com ", "123456");
    const b = await hashCode("s".repeat(40), "ama@example.com", "123456");
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
  });

  it("gives a different hash for another code, email or secret", async () => {
    const base = await hashCode("s".repeat(40), "ama@example.com", "123456");
    expect(await hashCode("s".repeat(40), "ama@example.com", "123457")).not.toBe(base);
    expect(await hashCode("s".repeat(40), "kofi@example.com", "123456")).not.toBe(base);
    expect(await hashCode("t".repeat(40), "ama@example.com", "123456")).not.toBe(base);
  });

  it("accepts codes typed with spaces or dashes", () => {
    expect(cleanCode(" 123 456 ")).toBe("123456");
    expect(cleanCode("123-456")).toBe("123456");
    expect(cleanCode(undefined)).toBe("");
  });

  it("normalises emails", () => {
    expect(normaliseEmail("  Ama@Example.COM ")).toBe("ama@example.com");
  });

  it("only sends people back to pages on this site, never the admin or another site", () => {
    expect(safeNext("/explore?cat=rentals")).toBe("/explore?cat=rentals");
    expect(safeNext("/listing/ridge-suites")).toBe("/listing/ridge-suites");
    for (const bad of ["https://evil.example", "//evil.example", "/\\evil.example", "/admin", "/admin/team", "/account/sign-in", "", undefined, 42])
      expect(safeNext(bad)).toBe("/account");
  });
});
