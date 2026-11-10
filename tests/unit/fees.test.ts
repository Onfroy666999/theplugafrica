import { describe, expect, it } from "vitest";
import { CONCIERGE_FEE_PERCENT, OVERDUE_DAYS, businessRate, customerRate, feeAmount, isOverdue, parseCedis, percentLabel, toBasisPoints } from "@/lib/fees";

describe("concierge fees (issue #84)", () => {
  it("takes 10% from each side by default", () => {
    expect(CONCIERGE_FEE_PERCENT).toBe(10);
    expect(businessRate()).toBe(1000);
    expect(customerRate(false)).toBe(1000);
  });

  it("works out the fee in pesewas, rounding to the nearest pesewa", () => {
    expect(feeAmount(3_600_000, 1000)).toBe(360_000); // GHS 36,000 → GHS 3,600
    expect(feeAmount(12_345, 1000)).toBe(1_235); // GHS 123.45 → GHS 12.35 (12.345 rounds up)
    expect(feeAmount(100_000, 750)).toBe(7_500); // a 7.5% rate, if ever set
  });

  it("reads deal values typed in different ways", () => {
    expect(parseCedis("36000")).toBe(3_600_000);
    expect(parseCedis("36,000")).toBe(3_600_000);
    expect(parseCedis("GHS 12,500.50")).toBe(1_250_050);
    expect(parseCedis("₵ 1 200")).toBe(120_000);
    expect(parseCedis("99.9")).toBe(9_990);
  });

  it("refuses values that aren't a sensible amount", () => {
    for (const bad of ["", "0", "-50", "abc", "12.345", "1e6", "20000000", undefined]) expect(parseCedis(bad)).toBeNull();
  });

  it("labels rates as percentages", () => {
    expect(percentLabel(toBasisPoints(10))).toBe("10%");
    expect(percentLabel(750)).toBe("7.5%");
  });

  it(`counts a fee as overdue ${OVERDUE_DAYS} days after it was sent`, () => {
    const now = new Date("2026-11-30T12:00:00Z");
    const ago = (d: number) => new Date(now.getTime() - d * 86_400_000);
    expect(isOverdue({ status: "due", sentAt: ago(OVERDUE_DAYS + 1), createdAt: ago(20) }, now)).toBe(true);
    expect(isOverdue({ status: "due", sentAt: ago(OVERDUE_DAYS - 1), createdAt: ago(20) }, now)).toBe(false);
    expect(isOverdue({ status: "due", sentAt: null, createdAt: ago(OVERDUE_DAYS + 1) }, now)).toBe(true);
    expect(isOverdue({ status: "paid", sentAt: ago(30), createdAt: ago(30) }, now)).toBe(false);
  });
});
