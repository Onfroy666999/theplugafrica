import { afterEach, describe, expect, it, vi } from "vitest";
import { layout, sendEmail } from "@/lib/email";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("email layout", () => {
  it("escapes what visitors typed, so it can't inject HTML", () => {
    const { html } = layout({ heading: "New request", intro: "<script>alert(1)</script>", rows: [["Name", `Ama "Ace" <b>`]] });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("Ama &quot;Ace&quot; &lt;b&gt;");
  });

  it("leaves out empty rows and adds a plain-text version with the button link", () => {
    const { html, text } = layout({ heading: "H", intro: "I", rows: [["Email", undefined], ["Phone", "0240000000"]], button: { label: "Open", href: "https://example.com/admin" } });
    expect(html).not.toContain(">Email<");
    expect(text).toContain("Phone: 0240000000");
    expect(text).not.toContain("Email:");
    expect(text).toContain("Open: https://example.com/admin");
  });
});

describe("sending", () => {
  const email = { to: "a@example.com", subject: "S", text: "T", html: "<p>T</p>" };

  it("does nothing without an API key", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    expect(await sendEmail(email)).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("posts to the provider with the sender and reply-to", async () => {
    vi.stubEnv("RESEND_API_KEY", "test-key");
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    expect(await sendEmail({ ...email, replyTo: "visitor@example.com" })).toBe(true);
    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers.Authorization).toBe("Bearer test-key");
    expect(JSON.parse(init.body)).toMatchObject({ to: ["a@example.com"], subject: "S", reply_to: "visitor@example.com", from: expect.stringContaining("The Plug Africa") });
  });

  it("never throws when the provider fails or can't be reached", async () => {
    vi.stubEnv("RESEND_API_KEY", "test-key");
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("nope", { status: 500 })));
    expect(await sendEmail(email)).toBe(false);
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    expect(await sendEmail(email)).toBe(false);
  });
});
