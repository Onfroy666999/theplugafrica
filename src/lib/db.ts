import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { cache } from "react";

// Database client (issue #4).
// On Cloudflare Workers a pooled connection can't be reused across requests, so each request gets its own
// client with a single-use connection (React's cache() shares it within one render). Locally (Node), one
// client serves the whole process, as before. Callers keep using `db.business…` either way.

import { onWorkers } from "./runtime";

function connectionString() {
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
