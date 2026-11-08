import { describe, expect, it } from "vitest";
import { EmergencySchema, needsRecheck, telHref } from "@/lib/emergency";

const base = { city: "Accra", service: "ambulance", name: "National Ambulance Service", phone: "112", verified: "false" };

describe("emergency numbers", () => {
  it("accepts a number for a city or for the whole country", () => {
    expect(EmergencySchema.safeParse(base).success).toBe(true);
    expect(EmergencySchema.safeParse({ ...base, city: "" }).success).toBe(true);
    expect(EmergencySchema.safeParse({ ...base, city: "Lagos" }).success).toBe(false);
    expect(EmergencySchema.safeParse({ ...base, service: "taxi" }).success).toBe(false);
  });

  it("only allows phone-number characters", () => {
    for (const ok of ["112", "+233 30 277 3906", "(030) 277-3906"]) expect(EmergencySchema.safeParse({ ...base, phone: ok }).success).toBe(true);
    for (const bad of ["call us", "12", "+233<script>"]) expect(EmergencySchema.safeParse({ ...base, phone: bad }).success).toBe(false);
  });

  it("can't be marked verified without saying where it was confirmed", () => {
    const r = EmergencySchema.safeParse({ ...base, verified: "true" });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0].message).toContain("where you confirmed");
    expect(EmergencySchema.safeParse({ ...base, verified: "true", source: "Called on 3 Nov" }).success).toBe(true);
  });

  it("only links to http and https sources", () => {
    expect(EmergencySchema.safeParse({ ...base, sourceUrl: "https://ghanapolice.gov.gh" }).success).toBe(true);
    expect(EmergencySchema.safeParse({ ...base, sourceUrl: "javascript:alert(1)" }).success).toBe(false);
  });

  it("flags numbers verified more than 6 months ago", () => {
    const now = new Date("2026-11-08T00:00:00Z");
    expect(needsRecheck(null, now)).toBe(false);
    expect(needsRecheck(new Date("2026-08-01T00:00:00Z"), now)).toBe(false);
    expect(needsRecheck(new Date("2026-04-01T00:00:00Z"), now)).toBe(true);
  });

  it("builds call links phones understand", () => {
    expect(telHref("+233 30 277 3906")).toBe("tel:+233302773906");
    expect(telHref("(030) 277-3906")).toBe("tel:0302773906");
  });
});
