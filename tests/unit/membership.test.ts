import { describe, expect, it } from "vitest";
import { BENEFITS, GRACE_DAYS, MEMBERSHIP_USD, canJoin, describeMembership, formatGhs, hasBenefits } from "@/lib/membership-plan";

const now = new Date("2026-11-10T12:00:00Z");
const days = (n: number) => new Date(now.getTime() + n * 86_400_000);

describe("concierge membership rules (issue #83)", () => {
  it("costs $8 a month and lists its benefits", () => {
    expect(MEMBERSHIP_USD).toBe(8);
    expect(BENEFITS.length).toBeGreaterThan(0);
  });

  it("gives the benefits while active", () => {
    expect(hasBenefits({ status: "active", currentPeriodEnd: days(20) }, now)).toBe(true);
    expect(hasBenefits({ status: "active", currentPeriodEnd: null }, now)).toBe(true);
  });

  it("keeps the benefits after cancelling, until the paid month ends", () => {
    expect(hasBenefits({ status: "cancelled", currentPeriodEnd: days(5) }, now)).toBe(true);
    expect(hasBenefits({ status: "non_renewing", currentPeriodEnd: days(5) }, now)).toBe(true);
    expect(hasBenefits({ status: "cancelled", currentPeriodEnd: days(-1) }, now)).toBe(false);
    expect(hasBenefits({ status: "cancelled", currentPeriodEnd: null }, now)).toBe(false);
  });

  it(`gives ${GRACE_DAYS} days' grace when a renewal fails`, () => {
    expect(hasBenefits({ status: "past_due", currentPeriodEnd: days(-(GRACE_DAYS - 1)) }, now)).toBe(true);
    expect(hasBenefits({ status: "past_due", currentPeriodEnd: days(-(GRACE_DAYS + 1)) }, now)).toBe(false);
  });

  it("gives nothing before the first payment", () => {
    expect(hasBenefits({ status: "pending", currentPeriodEnd: null }, now)).toBe(false);
    expect(hasBenefits(null, now)).toBe(false);
  });

  it("never lets someone start a second subscription while one is charging", () => {
    expect(canJoin(null, now)).toBe(true);
    expect(canJoin({ status: "pending", currentPeriodEnd: null }, now)).toBe(true);
    expect(canJoin({ status: "active", currentPeriodEnd: days(10) }, now)).toBe(false);
    expect(canJoin({ status: "past_due", currentPeriodEnd: days(-10) }, now)).toBe(false);
    expect(canJoin({ status: "cancelled", currentPeriodEnd: days(3) }, now)).toBe(false);
    expect(canJoin({ status: "cancelled", currentPeriodEnd: days(-3) }, now)).toBe(true);
  });

  it("describes the membership in plain words", () => {
    expect(describeMembership({ status: "active", currentPeriodEnd: new Date("2026-12-10T09:00:00Z") }, now)).toBe("Active. Renews on 10 December 2026.");
    expect(describeMembership({ status: "cancelled", currentPeriodEnd: new Date("2026-11-20T09:00:00Z") }, now)).toMatch(/until 20 November 2026/);
    expect(describeMembership(null, now)).toBe("Not a member");
  });

  it("shows Paystack's pesewas as cedis", () => {
    expect(formatGhs(12000)).toBe("GHS 120");
    expect(formatGhs(12345)).toBe("GHS 123.45");
  });
});
