// Signed admin session tokens. Edge-safe (used by middleware), so no database access here.
import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "plug_admin";
export const SESSION_DAYS = 7;

export type SessionPayload = { sub: string; name: string };

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) throw new Error("AUTH_SECRET is missing or too short. Set it in .env.");
  return new TextEncoder().encode(s);
}

export async function signSession(p: SessionPayload) {
  return new SignJWT({ name: p.name })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(p.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secret());
}

export async function verifySession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
    return payload.sub ? { sub: payload.sub, name: String(payload.name ?? "") } : null;
  } catch {
    return null;
  }
}
