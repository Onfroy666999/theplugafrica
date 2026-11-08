import { describe, expect, it } from "vitest";
import { REF_PATTERN, ReviewSchema, summariseRatings } from "@/lib/validation";

const ok = { ref: "PLG-7KQ2-M9XA", name: "Ama O.", rating: "5", body: "They arrived on time and fixed everything in one visit." };

describe("review form", () => {
  it("accepts a complete review and tidies the reference", () => {
    const r = ReviewSchema.safeParse({ ...ok, ref: " plg-7kq2-m9xa " });
    expect(r.success && r.data).toMatchObject({ ref: "PLG-7KQ2-M9XA", rating: 5 });
  });

  it("needs a PLG- or CNC- reference", () => {
    expect(REF_PATTERN.test("CNC-ABCD-2345")).toBe(true);
    for (const bad of ["MSG-7KQ2-M9XA", "PLG-7KQ2", "PLG-0000-1111", "hello"]) expect(ReviewSchema.safeParse({ ...ok, ref: bad }).success).toBe(false);
  });

  it("needs a rating from 1 to 5 and a real sentence", () => {
    for (const rating of ["0", "6", "4.5", ""]) expect(ReviewSchema.safeParse({ ...ok, rating }).success).toBe(false);
    expect(ReviewSchema.safeParse({ ...ok, body: "Great" }).success).toBe(false);
  });
});

describe("ratings", () => {
  it("averages approved ratings to one decimal place", () => {
    expect(summariseRatings([])).toEqual({ rating: null, reviewCount: 0 });
    expect(summariseRatings([5, 4])).toEqual({ rating: 4.5, reviewCount: 2 });
    expect(summariseRatings([5, 4, 4])).toEqual({ rating: 4.3, reviewCount: 3 });
  });
});
