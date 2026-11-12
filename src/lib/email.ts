import "server-only";

// Email sending through Resend's REST API (issue #6). Off until RESEND_API_KEY is set.
// Until the domain is verified in Resend, use EMAIL_FROM "The Plug Africa <onboarding@resend.dev>": Resend then only
// delivers to the Resend account's own address, so set NOTIFY_EMAIL to that address for team notifications.

const API = process.env.EMAIL_API_URL || "https://api.resend.com/emails";

export const emailEnabled = () => Boolean(process.env.RESEND_API_KEY);

export type Email = { to: string | string[]; subject: string; text: string; html: string; replyTo?: string };

/** Sends one email. Never throws: a failed email must not break the form that triggered it. */
export async function sendEmail(e: Email): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return false;
  try {
    const res = await fetch(API, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || "The Plug Africa <onboarding@resend.dev>",
        to: Array.isArray(e.to) ? e.to : [e.to],
        subject: e.subject,
        text: e.text,
        html: e.html,
        ...(e.replyTo && { reply_to: e.replyTo }),
      }),
    });
    // Log the status only: no addresses or message contents in the logs.
    if (!res.ok) console.error(`Email not sent: provider returned ${res.status}`);
    return res.ok;
  } catch {
    console.error("Email not sent: provider unreachable");
    return false;
  }
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/**
 * Brand-styled email body: a heading, an intro, an optional large code (one-time codes), labelled rows, and an
 * optional button. Also returns a plain-text version.
 */
export function layout({ heading, intro, code, rows = [], button, footer }: { heading: string; intro: string; code?: string; rows?: [string, string | null | undefined][]; button?: { label: string; href: string }; footer?: string }) {
  const kept = rows.filter((r): r is [string, string] => Boolean(r[1]));
  const html = `<!doctype html><html><body style="margin:0;background:#FAF7F0;font-family:Inter,Segoe UI,Arial,sans-serif;color:#14173A">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;border:1px solid #E4DDCB">
<tr><td style="padding:28px 32px 8px"><span style="font-weight:700;letter-spacing:.04em">THE PLUG</span> <span style="color:#B4913F;font-size:12px;letter-spacing:.3em">AFRICA</span></td></tr>
<tr><td style="padding:8px 32px 0"><h1 style="margin:0;font-size:22px;line-height:1.3">${esc(heading)}</h1>
<p style="margin:12px 0 0;font-size:15px;line-height:1.6;color:#4a4d63">${esc(intro)}</p></td></tr>
${code ? `<tr><td style="padding:22px 32px 0"><div style="display:inline-block;background:#FAF7F0;border:1px solid #E4DDCB;border-radius:12px;padding:14px 22px;font-family:Consolas,Menlo,monospace;font-size:32px;font-weight:700;letter-spacing:.18em;color:#14173A;user-select:all;-webkit-user-select:all">${esc(code)}</div></td></tr>` : ""}
${kept.length ? `<tr><td style="padding:20px 32px 0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14.5px;line-height:1.5">${kept
    .map(([k, v]) => `<tr><td style="padding:6px 12px 6px 0;color:#6E7180;vertical-align:top;white-space:nowrap">${esc(k)}</td><td style="padding:6px 0;white-space:pre-line">${esc(v)}</td></tr>`)
    .join("")}</table></td></tr>` : ""}
${button ? `<tr><td style="padding:24px 32px 0"><a href="${esc(button.href)}" style="display:inline-block;background:#14173A;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 22px;border-radius:999px">${esc(button.label)}</a></td></tr>` : ""}
<tr><td style="padding:28px 32px 28px;font-size:12.5px;line-height:1.6;color:#6E7180">${esc(footer ?? "The Plug Africa connects you with verified businesses. We don't take payments for businesses or guarantee outcomes.")}</td></tr>
</table></td></tr></table></body></html>`;
  const text = [heading, "", intro, "", ...(code ? [code, ""] : []), ...kept.map(([k, v]) => `${k}: ${v}`), ...(button ? ["", `${button.label}: ${button.href}`] : []), "", footer ?? "The Plug Africa"].join("\n");
  return { html, text };
}
