import { describe, expect, it } from "vitest";
import { BusinessRequestSchema, ConciergeSchema, ContactSchema, WaitlistSchema, makeRef, parseDetails } from "@/lib/validation";

describe("reference codes", () => {
  it("look like PREFIX-XXXX-XXXX with no easily confused characters", () => {
    for (let i = 0; i < 300; i++) {
      const ref = makeRef("CNC");
      expect(ref).toMatch(/^CNC-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/);
      expect(ref.slice(4)).not.toMatch(/[01IO]/);
    }
  });
});

describe("where and when (request details)", () => {
  it("needs a meeting place when the service happens somewhere else", () => {
    expect(parseDetails({ serviceMode: "elsewhere" })).toEqual({ ok: false, error: "Tell us where to meet." });
    const r = parseDetails({ serviceMode: "elsewhere", meetingPlace: "Kotoka Airport, Terminal 3" });
    expect(r.ok && r.data.meetingPlace).toBe("Kotoka Airport, Terminal 3");
  });

  it("drops a meeting place for other modes", () => {
    const r = parseDetails({ serviceMode: "my_place", meetingPlace: "left over from switching modes", area: "Osu" });
    expect(r.ok && r.data).toMatchObject({ serviceMode: "my_place", area: "Osu", meetingPlace: undefined });
  });

  it("uses the typed area when 'Other' is chosen or no area is listed", () => {
    const other = parseDetails({ serviceMode: "my_place", area: "Other", areaOther: "Prampram" });
    expect(other.ok && other.data.area).toBe("Prampram");
    const none = parseDetails({ serviceMode: "my_place", areaOther: "Bolgatanga town" });
    expect(none.ok && none.data.area).toBe("Bolgatanga town");
  });

  it("accepts an empty form (everything is optional)", () => {
    expect(parseDetails({}).ok).toBe(true);
  });

  it("rejects a badly formatted date or an unknown time of day", () => {
    expect(parseDetails({ preferredDate: "06/11/2026" })).toEqual({ ok: false, error: "Check the location and date." });
    expect(parseDetails({ timeOfDay: "Midnight" }).ok).toBe(false);
    expect(parseDetails({ preferredDate: "2026-12-01", timeOfDay: "Morning" }).ok).toBe(true);
  });

  it("rejects an unknown service mode", () => {
    expect(parseDetails({ serviceMode: "teleport" }).ok).toBe(false);
  });
});

const concierge = { name: "Ama", phone: "0240000000", city: "Accra", category: "special-services", details: "A driver for the week", when: "This week" };

describe("concierge form", () => {
  it("accepts a complete request and trims the fields", () => {
    const r = ConciergeSchema.safeParse({ ...concierge, name: "  Ama  ", email: "" });
    expect(r.success && r.data).toMatchObject({ name: "Ama", email: undefined });
  });

  it.each(["name", "phone", "city", "category", "details", "when"])("requires %s", (field) => {
    expect(ConciergeSchema.safeParse({ ...concierge, [field]: "   " }).success).toBe(false);
  });

  it("limits very long details", () => {
    expect(ConciergeSchema.safeParse({ ...concierge, details: "x".repeat(4001) }).success).toBe(false);
  });
});

describe("request to a business", () => {
  const ok = { name: "Kofi", phone: "0200000000", city: "Kumasi", message: "Can I visit on Saturday?" };
  it("needs a message of at least a short sentence", () => {
    expect(BusinessRequestSchema.safeParse(ok).success).toBe(true);
    expect(BusinessRequestSchema.safeParse({ ...ok, message: "Hi" }).success).toBe(false);
  });
});

describe("business waitlist", () => {
  it("needs the business name, contact name and phone", () => {
    const ok = { business: "Kente Studio", category: "entertainment", city: "Accra", name: "Efua", phone: "0270000000" };
    expect(WaitlistSchema.safeParse(ok).success).toBe(true);
    expect(WaitlistSchema.safeParse({ ...ok, business: "" }).success).toBe(false);
  });
});

describe("contact page", () => {
  const ok = { name: "Yaw", topic: "A general question", message: "Do you cover Takoradi yet?" };

  it("needs an email or a phone number to reply to", () => {
    const r = ContactSchema.safeParse(ok);
    expect(r.success).toBe(false);
    expect(r.error?.issues.find((i) => i.code === "custom")?.message).toBe("Add an email or a phone number so we can reply.");
    expect(ContactSchema.safeParse({ ...ok, phone: "0240000000" }).success).toBe(true);
    expect(ContactSchema.safeParse({ ...ok, email: "yaw@example.com" }).success).toBe(true);
  });

  it("rejects an invalid email and an unknown topic", () => {
    expect(ContactSchema.safeParse({ ...ok, email: "not-an-email" }).success).toBe(false);
    expect(ContactSchema.safeParse({ ...ok, phone: "0240000000", topic: "Free money" }).success).toBe(false);
  });
});
