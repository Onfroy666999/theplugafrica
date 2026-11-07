// Starts what the end-to-end tests need: a stand-in for the email provider, and (unless E2E_BASE_URL is set)
// the production build on port 3100 with email switched on and pointed at the stand-in.
import { spawn, type ChildProcess } from "node:child_process";
import { existsSync } from "node:fs";
import http from "node:http";
import path from "node:path";

export const MAIL_PORT = 4599;
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
  };
}
