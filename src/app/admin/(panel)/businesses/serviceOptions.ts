import "server-only";
import { db } from "@/lib/db";

/** Every service (visible or hidden) for the business form's picker. */
export async function allServiceOptions() {
  return db.service.findMany({ orderBy: [{ category: "asc" }, { position: "asc" }], select: { id: true, category: true, name: true, visible: true } });
}
