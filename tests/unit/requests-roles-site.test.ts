import { describe, expect, it } from "vitest";
import { describeRequest, elsewhereLabel, modesFor } from "@/lib/requests";
import { aRole, can, roleLabel } from "@/lib/roles";
import { cityFromSlug, citySlug } from "@/lib/site";

describe("request summaries for the admin and emails", () => {
  it("joins mode, meeting place, area, city and landmark", () => {
    const d = describeRequest({ serviceMode: "my_place", city: "Accra", area: "East Legon", landmark: "near A&C Mall", preferredDate: "2026-12-01", timeOfDay: "Morning" });
    expect(d.place).toBe("At my place · East Legon, Accra · near A&C Mall");
    expect(d.when).toBe("2026-12-01, morning");
  });

  it("leaves out 'Any time' and capitalises the first word", () => {
    expect(describeRequest({ timeOfDay: "Evening" }).when).toBe("Evening");
    expect(describeRequest({ timeOfDay: "Any time" }).when).toBe("");
    expect(describeRequest({}).place).toBe("");
  });

  it("offers the likely choices per category, and all of them otherwise", () => {
    expect(modesFor("rentals")).toEqual(["their_place", "elsewhere", "remote"]);
    expect(modesFor("unknown")).toHaveLength(4);
    expect(modesFor()).toHaveLength(4);
  });

  it("asks drivers for a pickup point", () => {
    expect(elsewhereLabel("Chauffeur for a day")).toBe("Where should they pick you up?");
    expect(elsewhereLabel("Plumbing")).toBe("Where should you meet?");
  });
});

describe("team roles", () => {
  it("owners can do everything", () => {
    expect(["edit", "delete", "team"].every((p) => can("owner", p as "edit"))).toBe(true);
  });
  it("editors edit but can't delete or manage the team", () => {
    expect(can("editor", "edit")).toBe(true);
    expect(can("editor", "delete")).toBe(false);
    expect(can("editor", "team")).toBe(false);
  });
  it("viewers and unknown roles can't change anything", () => {
    for (const role of ["viewer", "admin", ""]) for (const p of ["edit", "delete", "team"] as const) expect(can(role, p)).toBe(false);
  });
  it("reads well in sentences", () => {
    expect(roleLabel("editor")).toBe("Editor");
    expect([aRole("owner"), aRole("editor"), aRole("viewer")]).toEqual(["an owner", "an editor", "a viewer"]);
  });
});

describe("city pages", () => {
  it("round-trips city names and web addresses", () => {
    expect(citySlug("Accra")).toBe("accra");
    expect(cityFromSlug("accra")).toBe("Accra");
    expect(cityFromSlug("atlantis")).toBeNull();
  });
});
