// Starts what the end-to-end tests need: a stand-in for the email provider, and (unless E2E_BASE_URL is set)
// the production build on port 3100 with email switched on and pointed at the stand-in.
import { spawn, type ChildProcess } from "node:child_process";
import { existsSync } from "node:fs";
import http from "node:http";
import path from "node:path";

export const MAIL_PORT = 4599;
export const PAYSTACK_PORT = 4598;
/** Test-only values for the stand-in Paystack (issue #83). Real keys never appear in the repo. */
export const PAYSTACK_TEST_KEY = "sk_test_e2e_only";
export const PAYSTACK_TEST_PLAN = "PLN_e2e";
const APP_PORT = 3100;

export default async function setup() {
  if (existsSync(".env")) process.loadEnvFile(".env"); // doesn't override variables already set (CI sets its own)

  // The tests create and delete rows. Never let them near the hosted database.
  const host = (() => {
    try {
      return new URL(process.env.DATABASE_URL ?? "").hostname;
    } catch {
      return "";
    }
  })();
  if (!["localhost", "127.0.0.1", "::1"].includes(host) && !process.env.E2E_ALLOW_REMOTE_DB)
    throw new Error(`End-to-end tests only run against a local database (DATABASE_URL points to "${host || "nothing"}").`);
  if (!existsSync(".next/server/server-reference-manifest.json")) throw new Error("Run `npm run build` before the end-to-end tests.");

  // Stand-in email provider: POST /emails records a message, GET /__emails lists them, DELETE /__emails clears them.
  const emails: unknown[] = [];
  const mail = http.createServer((req, res) => {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      if (req.method === "POST") {
        try {
          emails.push(JSON.parse(body));
        } catch {}
        res.writeHead(200, { "Content-Type": "application/json" }).end('{"id":"e2e"}');
      } else if (req.method === "DELETE") {
        emails.length = 0;
        res.writeHead(204).end();
      } else res.writeHead(200, { "Content-Type": "application/json" }).end(JSON.stringify(emails));
    });
  });
  await new Promise<void>((r) => mail.listen(MAIL_PORT, r));

  // Stand-in Paystack (issue #83): checkout, verification, the plan, cancelling and the card page. Every call is
  // recorded; GET /__paystack lists them. A checkout's email is remembered so verifying its reference returns it.
  const calls: { method: string; path: string; body: unknown; auth: string | undefined }[] = [];
  const checkouts = new Map<string, string>();
  const paystack = http.createServer((req, res) => {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      const url = req.url ?? "";
      const json = (status: number, data: unknown) => res.writeHead(status, { "Content-Type": "application/json" }).end(JSON.stringify(data));
      if (url === "/__paystack") return json(200, calls);
      let parsed: Record<string, unknown> = {};
      try {
        parsed = body ? JSON.parse(body) : {};
      } catch {}
      calls.push({ method: req.method ?? "", path: url, body: parsed, auth: req.headers.authorization });
      if (req.headers.authorization !== `Bearer ${PAYSTACK_TEST_KEY}`) return json(401, { status: false, message: "Invalid key" });
      if (url === "/transaction/initialize") {
        const reference = `e2e_${checkouts.size + 1}_${Date.now()}`;
        checkouts.set(reference, String(parsed.email));
        return json(200, { status: true, data: { authorization_url: `https://checkout.paystack.test/${reference}`, reference, access_code: "x" } });
      }
      const verify = url.match(/^\/transaction\/verify\/(.+)$/);
      if (verify) {
        const email = checkouts.get(decodeURIComponent(verify[1]));
        if (!email) return json(404, { status: false, message: "Transaction reference not found" });
        return json(200, { status: true, data: { status: "success", reference: verify[1], customer: { email, customer_code: "CUS_e2e" }, plan: PAYSTACK_TEST_PLAN } });
      }
      if (url === `/plan/${PAYSTACK_TEST_PLAN}`) return json(200, { status: true, data: { plan_code: PAYSTACK_TEST_PLAN, amount: 12345, currency: "GHS", interval: "monthly" } });
      if (url === "/subscription/disable") return json(200, { status: true, message: "Subscription disabled successfully" });
      if (/^\/subscription\/[^/]+\/manage\/link$/.test(url)) return json(200, { status: true, data: { link: "https://paystack.test/manage/e2e" } });
      return json(404, { status: false, message: "Not found" });
    });
  });
  await new Promise<void>((r) => paystack.listen(PAYSTACK_PORT, r));

  let app: ChildProcess | undefined;
  if (!process.env.E2E_BASE_URL) {
    app = spawn(process.execPath, [path.join("node_modules", "next", "dist", "bin", "next"), "start", "-p", String(APP_PORT)], {
      env: {
        ...process.env,
        NODE_ENV: "production",
        RESEND_API_KEY: "e2e-test-key",
        EMAIL_API_URL: `http://localhost:${MAIL_PORT}/emails`,
        NOTIFY_EMAIL: "team@example.test",
        TURNSTILE_SECRET_KEY: "",
        PAYSTACK_SECRET_KEY: PAYSTACK_TEST_KEY,
        PAYSTACK_PLAN_CODE: PAYSTACK_TEST_PLAN,
        PAYSTACK_API_URL: `http://localhost:${PAYSTACK_PORT}`,
      },
      stdio: ["ignore", "ignore", "inherit"],
    });
    const base = `http://localhost:${APP_PORT}`;
    const until = Date.now() + 90_000;
    for (;;) {
      try {
        if ((await fetch(base + "/robots.txt")).ok) break;
      } catch {}
      if (Date.now() > until || app.exitCode !== null) throw new Error("The app didn't start for the end-to-end tests.");
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  return async () => {
    app?.kill();
    await new Promise((r) => mail.close(r));
    await new Promise((r) => paystack.close(r));
  };
}
