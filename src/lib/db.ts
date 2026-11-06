import "server-only";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { cache } from "react";
import { onWorkers } from "./runtime";

// Database client (issue #4).
// On Cloudflare Workers a pooled connection can't be reused across requests, so each request gets its own
// client with a single-use connection (React's cache() shares it within one render). Workers connect through
// Hyperdrive when the Worker has a HYPERDRIVE binding (Cloudflare pools and keeps the Supabase connections
// warm), otherwise straight to DATABASE_URL. Locally (Node), one client serves the whole process.
// Callers keep using `db.business…` either way.

type HyperdriveEnv = { HYPERDRIVE?: { connectionString: string } };

function connectionString() {
  if (onWorkers) {
    const hyperdrive = (getCloudflareContext().env as HyperdriveEnv).HYPERDRIVE;
    if (hyperdrive) return hyperdrive.connectionString;
  }
  const raw = process.env.DATABASE_URL;
  if (!raw) throw new Error("DATABASE_URL is not set.");
  // `pgbouncer=true` is a hint for Prisma's own engine; the pg driver would send it to Postgres as a setting.
  const url = new URL(raw);
  url.searchParams.delete("pgbouncer");
  return url.toString();
}

const make = (maxUses?: number) => new PrismaClient({ adapter: new PrismaPg({ connectionString: connectionString(), ...(maxUses && { maxUses }) }) });

const perRequest = cache(() => make(1));
const g = globalThis as unknown as { prisma?: PrismaClient };

function client(): PrismaClient {
  if (onWorkers) return perRequest();
  return (g.prisma ??= make());
}

export const db = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const c = client();
    const value = Reflect.get(c, prop, c);
    return typeof value === "function" ? value.bind(c) : value;
  },
});
