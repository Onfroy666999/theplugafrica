// Regression tests for the bugs found in the debug session (issue #94).
import { describe, expect, it } from "vitest";
import { hasBenefits } from "@/lib/membership-plan";
import { safeNext } from "@/lib/signin-code";
import { jsonLd } from "@/lib/site";
import { canBeVerified } from "@/lib/status";
import { ConciergeSchema, WaitlistSchema } from "@/lib/validation";

describe("debug session fixes", () => {
  it("won't mark a business Verified with no credentials at all", () => {
    expect(canBeVerified([])).toBe(false);
  });

  it("escapes < in structured data, so a business name can't end the script tag", () => {
    const html = jsonLd({ name: "</script><script>alert(1)</script>" }).__html;
    expect(html).not.toContain("<");
    expect(html).toContain("\\u003c/script>");
    expect(JSON.parse(html)).toEqual({ name: "</script><script>alert(1)</script>" });
  });

  it("refuses sign-in return paths that browsers would turn into another site", () => {
    for (const bad of ["/\t/evil.example", "/\n/evil.example", "/ /evil.example", "/x\\evil", "/%0A".replace("%0A", "\n")]) expect(safeNext(bad)).toBe("/account");
    expect(safeNext("/explore?q=a%20b")).toBe("/explore?q=a%20b");
  });

  it("ends an active membership's benefits if renewals stop arriving", () => {
    const now = new Date("2026-12-20T00:00:00Z");
    expect(hasBenefits({ status: "active", currentPeriodEnd: new Date("2026-12-10T00:00:00Z") }, now)).toBe(false);
    expect(hasBenefits({ status: "active", currentPeriodEnd: new Date("2026-12-18T00:00:00Z") }, now)).toBe(true);
  });

  it("checks optional emails on request forms", () => {
    const base = { name: "Ama", phone: "024", city: "Accra", category: "rentals", details: "x", when: "Soon" };
    expect(ConciergeSchema.safeParse({ ...base, email: "none" }).success).toBe(false);
    expect(ConciergeSchema.safeParse({ ...base, email: "" }).success).toBe(true);
    expect(ConciergeSchema.safeParse({ ...base, email: " Ama@Example.com " }).data?.email).toBe("ama@example.com");
    expect(WaitlistSchema.safeParse({ business: "B", category: "rentals", city: "Accra", name: "A", phone: "024", email: "0244 123 456" }).success).toBe(false);
  });
});
