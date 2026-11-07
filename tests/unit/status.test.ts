import { describe, expect, it } from "vitest";
import { BUSINESS_STATUS, PUBLIC_STATUSES, canBeVerified, find } from "@/lib/status";

describe("Verified needs every credential checked", () => {
  it("allows Verified when every credential is Checked", () => {
    expect(canBeVerified([{ state: "verified" }, { state: "verified" }])).toBe(true);
  });

  it("blocks Verified while any credential is not checked or still in review", () => {
    expect(canBeVerified([{ state: "verified" }, { state: "pending" }])).toBe(false);
    expect(canBeVerified([{ state: "in_review" }, { state: "verified" }])).toBe(false);
  });
});

describe("what's public", () => {
  it("shows only In review and Verified businesses on the site", () => {
    expect([...PUBLIC_STATUSES].sort()).toEqual(["in_review", "verified"]);
    expect(BUSINESS_STATUS.map((s) => s.value)).toEqual(["draft", "in_review", "verified", "hidden"]);
  });
});

describe("status labels", () => {
  it("finds a status's label and falls back for unknown values", () => {
    expect(find(BUSINESS_STATUS, "in_review").label).toBe("In review");
    expect(find(BUSINESS_STATUS, "archived")).toEqual({ value: "archived", label: "archived", tone: "muted" });
  });
});
