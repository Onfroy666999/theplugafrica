// Shared tools for the end-to-end tests: call server actions the way the browser does, fetch pages, read the
// database, and read the emails the app sent to the stand-in provider.
import { PrismaClient } from "@prisma/client";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";

if (existsSync(".env")) process.loadEnvFile(".env");

export const BASE = process.env.E2E_BASE_URL ?? "http://localhost:3100";
const MAIL = "http://localhost:4599/__emails";
export const db = new PrismaClient();

// React's own encoder for server action arguments (what the browser uses), from the Next.js install.
const load = createRequire(import.meta.url);
const { encodeReply } = load("next/dist/compiled/react-server-dom-webpack/client.node.js") as { encodeReply: (v: unknown[]) => Promise<string | FormData> };

/** The action ID Next.js gave an exported server action in this build. */
function actionId(name: string) {
  const manifest = JSON.parse(readFileSync(".next/server/server-reference-manifest.json", "utf8")) as { node: Record<string, { exportedName: string }> };
  const hit = Object.entries(manifest.node).find(([, v]) => v.exportedName === name);
  if (!hit) throw new Error(`No server action called ${name} in this build`);
  return hit[0];
}

/** A made-up visitor address, so each test file has its own spam-protection counters. */
export const visitor = () => `198.51.100.${Math.floor(Math.random() * 250) + 1}`;

export type ActResult = { status: number; redirect: string | null; cookie: string | null; result: Record<string, unknown> | null };

/** Calls a server action. `at` is the page it's posted from (admin pages need a session cookie). */
export async function act(name: string, args: unknown[], o: { cookie?: string | null; at?: string; ip: string }): Promise<ActResult> {
  const res = await fetch(BASE + (o.at ?? "/"), {
    method: "POST",
    redirect: "manual",
    headers: { "Next-Action": actionId(name), Accept: "text/x-component", "x-forwarded-for": o.ip, ...(o.cookie ? { Cookie: o.cookie } : {}) },
    body: await encodeReply(args),
  });
  const set = res.headers.get("set-cookie") ?? "";
  const session = set.match(/plug_admin=([^;]+)/)?.[1];
  const body = await res.text();
  // The reply is a React stream, one "<id>:<json>" row per line. Row 0 is {"a": "$@<id>", ...}: "a" points to the
  // row holding the action's return value (other rows may carry refreshed page data).
  const rows = new Map<string, string>();
  for (const line of body.split("\n")) {
    const m = line.match(/^([0-9a-f]+):(.*)$/);
    if (m) rows.set(m[1], m[2]);
  }
  let result: Record<string, unknown> | null = null;
  try {
    const pointer = String(JSON.parse(rows.get("0") ?? "{}").a ?? "");
    const row = pointer.startsWith("$@") ? rows.get(pointer.slice(2)) : undefined;
    const v = row ? JSON.parse(row) : null;
    if (v && typeof v === "object") result = v;
  } catch {}
  return { status: res.status, redirect: res.headers.get("x-action-redirect")?.split(";")[0] ?? null, cookie: session ? `plug_admin=${session}` : null, result };
}

export async function page(path: string, cookie?: string | null) {
  const res = await fetch(BASE + path, { redirect: "manual", headers: cookie ? { Cookie: cookie } : {} });
  return { status: res.status, location: res.headers.get("location"), html: res.status === 200 ? await res.text() : "" };
}

/** Form fields, plus what a real visitor's browser adds: the start time (filled 10 s ago) and an empty honeypot. */
export function form(fields: Record<string, string>, o: { human?: boolean } = { human: true }) {
  const fd = new FormData();
  if (o.human) {
    fd.set("_t", String(Date.now() - 10_000));
    fd.set("website", "");
  }
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

type Email = { to: string[]; subject: string; reply_to?: string; text: string };

/** Emails sent so far. They're sent just after the response, so this waits until `until` is satisfied. */
export async function emails(until: (e: Email[]) => boolean = () => true, timeoutMs = 10_000): Promise<Email[]> {
  const end = Date.now() + timeoutMs;
  for (;;) {
    const list = (await (await fetch(MAIL)).json()) as Email[];
    if (until(list) || Date.now() > end) return list;
    await new Promise((r) => setTimeout(r, 200));
  }
}
export const clearEmails = () => fetch(MAIL, { method: "DELETE" });

/** Signs in through the real sign-in action. */
export async function signIn(email: string, password: string, ip: string) {
  return act("login", [undefined, form({ email, password }, { human: false })], { at: "/admin/login", ip });
}

export function adminCredentials() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD (the seeded owner account) for the end-to-end tests.");
  return { email: email.toLowerCase().trim(), password };
}

export const REF = (prefix: string) => new RegExp(`^${prefix}-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$`);
