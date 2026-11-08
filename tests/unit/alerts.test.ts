import { describe, expect, it } from "vitest";
import { alertKey, safePath, summariseError } from "@/lib/error-summary";

describe("error alerts", () => {
  it("keeps only the first line of the message and a few stack frames", () => {
    const e = new Error("Invalid `db.enquiry.create()` invocation:\n\n  name: \"Ama Mensah\", phone: \"0240000000\"");
    const s = summariseError(e);
    expect(s.message).toBe("Error: Invalid `db.enquiry.create()` invocation:");
    expect(s.message).not.toContain("Ama");
    expect(s.frames.length).toBeGreaterThan(0);
    expect(s.frames.length).toBeLessThanOrEqual(5);
  });

  it("keeps Next's error ID and copes with things that aren't errors", () => {
    expect(summariseError(Object.assign(new Error("x"), { digest: "12345" })).digest).toBe("12345");
    expect(summariseError("plain string").message).toBe("Error: plain string");
    expect(summariseError(new TypeError("bad")).message).toBe("TypeError: bad");
  });

  it("drops query strings, which can hold visitors' details", () => {
    expect(safePath("/explore?q=0240000000&city=Accra")).toBe("/explore");
    expect(safePath("/admin/messages#top")).toBe("/admin/messages");
  });

  it("gives the same error on the same route the same throttle key", () => {
    const s = summariseError(new Error("boom"));
    expect(alertKey(s, "/admin/messages")).toBe(alertKey(summariseError(new Error("boom")), "/admin/messages"));
    expect(alertKey(s, "/admin/messages")).not.toBe(alertKey(s, "/admin/concierge"));
    expect(alertKey(s, "/x")).toMatch(/^alert:[0-9a-z]+$/);
  });
});
