import "server-only";
import { after } from "next/server";
import { getCat } from "./directory";
import { layout, sendEmail } from "./email";
import { CONCIERGE_FEE_PERCENT } from "./fees";
import { BENEFITS } from "./membership-plan";
import { describeRequest } from "./requests";
import { SITE_URL } from "./site";

// Who hears about what (issue #6). Sent after the response, so forms stay fast and never fail because of email.
// NOTIFY_EMAIL: comma-separated team addresses for new-entry alerts (e.g. Kenneth). Customers and businesses
// get emails only if they gave an address.

const team = () => (process.env.NOTIFY_EMAIL ?? "").split(",").map((s) => s.trim()).filter(Boolean);
const admin = (path: string) => `${SITE_URL}${path}`;

type Where = Parameters<typeof describeRequest>[0];

function teamAlert(subject: string, heading: string, intro: string, rows: [string, string | null | undefined][], path: string, replyTo?: string | null) {
  const to = team();
  if (!to.length) return;
  const body = layout({ heading, intro, rows, button: { label: "Open in the admin", href: admin(path) }, footer: "You're receiving this because you're on The Plug Africa team." });
  return sendEmail({ to, subject, ...body, replyTo: replyTo ?? undefined });
}

/** Schedules emails to run after the response is sent. */
function later(fn: () => Promise<unknown>) {
  after(async () => {
    await fn();
  });
}

export function notifyConcierge(r: { ref: string; name: string; phone: string; email?: string; category: string; service?: string | null; details: string; timing: string; member?: boolean } & Where) {
  later(async () => {
    const d = describeRequest(r);
    const about = [getCat(r.category)?.name ?? r.category, r.service].filter(Boolean).join(" › ");
    // Members get priority (issue #83): say so up front.
    await teamAlert(`${r.member ? "Member · " : ""}New concierge request ${r.ref}: ${about}`, "New concierge request", `${r.name}${r.member ? ", a concierge member," : ""} asked a concierge for help.`, [
      ["Reference", r.ref], ["About", about], ["Name", r.name], ["Phone", r.phone], ["Email", r.email], ["Where", d.place], ["When", d.when], ["How soon", r.timing], ["Request", r.details],
    ], "/admin/concierge", r.email);
    if (r.email)
      await sendEmail({
        to: r.email,
        subject: `We've got your request (${r.ref})`,
        ...layout({
          heading: "We've got your request",
          intro: `Thank you, ${r.name}. A Plug concierge will call you to understand what you need. When we close a deal for you, our fee is ${CONCIERGE_FEE_PERCENT}% of the agreed price; we confirm it with you before any work starts.`,
          rows: [["Reference", r.ref], ["About", about], ["Where", d.place], ["When", d.when]],
          footer: "Keep this reference in case you need to follow up. The Plug Africa never asks for payment before you've agreed the fee.",
        }),
      });
  });
}

export function notifyBusinessRequest(r: { ref: string; name: string; phone: string; email?: string; message: string; business: { name: string; email: string | null } } & Where) {
  later(async () => {
    const d = describeRequest(r);
    const rows: [string, string | null | undefined][] = [["Reference", r.ref], ["Name", r.name], ["Phone", r.phone], ["Email", r.email], ["Where", d.place], ["When", d.when], ["Request", r.message]];
    await teamAlert(`New request for ${r.business.name} (${r.ref})`, `New request for ${r.business.name}`, `${r.name} sent a request through The Plug.`, rows, "/admin/enquiries", r.email);
    if (r.business.email)
      await sendEmail({
        to: r.business.email,
        subject: `New request from The Plug Africa (${r.ref})`,
        replyTo: r.email,
        ...layout({
          heading: "You have a new request",
          intro: `${r.name} found ${r.business.name} on The Plug Africa and sent this request. Please contact them directly, and quote reference ${r.ref}.`,
          rows,
          footer: "The Plug Africa introduces customers to verified businesses. The reference shows this introduction came through The Plug.",
        }),
      });
    if (r.email)
      await sendEmail({
        to: r.email,
        subject: `Your request to ${r.business.name} (${r.ref})`,
        ...layout({
          heading: "Request sent",
          intro: `Thank you, ${r.name}. We've passed your request to ${r.business.name}, and they'll contact you.`,
          rows: [["Reference", r.ref], ["Business", r.business.name], ["Where", d.place], ["When", d.when]],
          footer: "Deal with the business directly, check their credentials, and never pay before you've seen what you're paying for.",
        }),
      });
  });
}

export function notifyWaitlist(r: { ref: string; businessName: string; category: string; city: string; name: string; phone: string; email?: string }) {
  later(async () => {
    await teamAlert(`New business on the waitlist: ${r.businessName}`, "New business on the waitlist", `${r.name} wants ${r.businessName} listed.`, [
      ["Reference", r.ref], ["Business", r.businessName], ["Category", getCat(r.category)?.name ?? r.category], ["City", r.city], ["Name", r.name], ["Phone", r.phone], ["Email", r.email],
    ], "/admin/waitlist", r.email);
    if (r.email)
      await sendEmail({
        to: r.email,
        subject: `You're on the list (${r.ref})`,
        ...layout({
          heading: "You're on the list",
          intro: `Thank you, ${r.name}. We'll contact you to start verifying ${r.businessName}. Have your business registration and ID ready.`,
          rows: [["Reference", r.ref]],
        }),
      });
  });
}

export function notifyContactMessage(r: { ref: string; name: string; email?: string; phone?: string; topic: string; message: string }) {
  later(async () => {
    await teamAlert(`New message: ${r.topic} (${r.ref})`, "New message from the Contact page", `${r.name} sent a message.`, [
      ["Reference", r.ref], ["Topic", r.topic], ["Name", r.name], ["Email", r.email], ["Phone", r.phone], ["Message", r.message],
    ], "/admin/messages", r.email);
    if (r.email)
      await sendEmail({
        to: r.email,
        subject: `We've got your message (${r.ref})`,
        ...layout({ heading: "We've got your message", intro: `Thank you, ${r.name}. Someone from The Plug will reply by email or phone.`, rows: [["Reference", r.ref], ["Topic", r.topic]] }),
      });
  });
}

export function notifyReview(r: { business: string; name: string; rating: number; body: string; ref: string }) {
  later(async () => {
    await teamAlert(`New review to check: ${r.business} (${r.rating}/5)`, "A review is waiting for approval", `${r.name} reviewed ${r.business}. It stays hidden until someone approves it.`, [
      ["Business", r.business], ["Rating", `${"★".repeat(r.rating)}${"☆".repeat(5 - r.rating)} (${r.rating}/5)`], ["Name", r.name], ["Reference", r.ref], ["Review", r.body],
    ], "/admin/reviews");
  });
}

/** A short note to the team about something that needs a person (a possible double charge, for example). */
export function notifyTeam(subject: string, intro: string, path: string) {
  later(() => teamAlert(subject, subject, intro, [], path) ?? Promise.resolve());
}

/** A new concierge member (issue #83): tell the team, and welcome the member. */
export function notifyNewMember(u: { email: string; name: string | null }) {
  later(async () => {
    const who = u.name || u.email;
    await teamAlert(`New concierge member: ${who}`, "New concierge member", `${who} joined the concierge membership.`, [["Name", u.name], ["Email", u.email]], "/admin/members", u.email);
    await sendEmail({
      to: u.email,
      subject: "Welcome to the concierge membership",
      ...layout({
        heading: "Welcome: you're a concierge member",
        intro: `Thank you${u.name ? `, ${u.name.split(" ")[0]}` : ""}. Here's what your membership gives you.`,
        rows: BENEFITS.map((b) => [b.title, b.body]),
        button: { label: "Ask a concierge", href: `${SITE_URL}/concierge` },
        footer: "You can see or cancel your membership any time from your account on The Plug Africa. Payments are handled by Paystack.",
      }),
    });
  });
}
