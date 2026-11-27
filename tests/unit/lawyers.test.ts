import { describe, expect, it } from "vitest";
import { availabilityOf } from "@/lib/availability";
import { LISTING_CATS, listsBusinesses } from "@/lib/directory";

describe("lawyers in Business (issue #132)", () => {
  it("lists businesses only in Business's listing services", () => {
    expect(listsBusinesses("new-business", "lawyers")).toBe(true);
    expect(listsBusinesses("new-business", "legal")).toBe(false);
    expect(listsBusinesses("new-business", "business-setup")).toBe(false);
    expect(listsBusinesses("rentals", "homes")).toBe(true);
    expect(listsBusinesses("nope", "x")).toBe(false);
  });

  it("offers Business in the business form, and never Emergency", () => {
    const keys = LISTING_CATS.map((c) => c.key);
    expect(keys).toContain("new-business");
    expect(keys).not.toContain("emergency");
  });

  it("reads availability, defaulting to available", () => {
    expect(availabilityOf("limited").label).toBe("Limited availability");
    expect(availabilityOf(undefined).value).toBe("available");
    expect(availabilityOf("garbage").value).toBe("available");
  });
});
