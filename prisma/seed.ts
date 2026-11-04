// Seeds the admin account (from .env) and the 16 example businesses used by the design.
// Safe to re-run: the admin is only created if missing, and examples are upserted by slug.
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { LISTINGS } from "../src/lib/listings";

const db = new PrismaClient();

async function main() {
  const { ADMIN_EMAIL, ADMIN_NAME, ADMIN_PASSWORD } = process.env;
  if (ADMIN_EMAIL && ADMIN_PASSWORD) {
    const email = ADMIN_EMAIL.toLowerCase().trim();
    const exists = await db.admin.findUnique({ where: { email } });
    if (!exists) {
      await db.admin.create({ data: { email, name: ADMIN_NAME || "Admin", passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 12) } });
      console.log(`Admin account created for ${ADMIN_NAME || email}.`);
    } else {
      console.log("Admin account already exists (password unchanged).");
    }
  } else {
    console.warn("ADMIN_EMAIL / ADMIN_PASSWORD not set in .env: no admin account created.");
  }

  for (const l of LISTINGS) {
    const data = {
      name: l.name,
      category: l.cat,
      kind: l.kind,
      city: l.city,
      area: l.area,
      blurb: l.blurb,
      about: l.about,
      price: l.price,
      responds: l.responds,
      languages: l.languages.join(", "),
      images: JSON.stringify(l.images),
      status: l.status === "verified" ? "verified" : "in_review",
      isExample: true,
      rating: l.rating,
      reviewCount: l.reviewCount,
    };
    const b = await db.business.upsert({ where: { slug: l.slug }, update: data, create: { slug: l.slug, ...data } });
    await db.credential.deleteMany({ where: { businessId: b.id } });
    await db.credential.createMany({
      data: l.credentials.map((c, i) => ({ businessId: b.id, label: c.label, state: c.state === "verified" ? "verified" : "in_review", position: i })),
    });
  }
  console.log(`${LISTINGS.length} example businesses loaded.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
