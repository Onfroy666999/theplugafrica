// Change the admin password from your own terminal: npm run admin:password
// The new password is typed at a prompt, so it never appears in shell history or in files.
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { createInterface } from "node:readline";

function ask(q: string, hidden = false): Promise<string> {
  return new Promise((res) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    if (hidden) {
      const out = rl as unknown as { _writeToOutput: (s: string) => void; output: NodeJS.WriteStream };
      out._writeToOutput = (s: string) => out.output.write(s.includes(q) ? s : "*");
    }
    rl.question(q, (a) => {
      rl.close();
      if (hidden) process.stdout.write("\n");
      res(a);
    });
  });
}

async function main() {
  const db = new PrismaClient();
  const email = (process.env.ADMIN_EMAIL || (await ask("Admin email: "))).toLowerCase().trim();
  const admin = await db.admin.findUnique({ where: { email } });
  if (!admin) throw new Error(`No admin account for ${email}. Run: npm run db:seed`);
  const pw = await ask("New password (12+ characters): ", true);
  if (pw.length < 12) throw new Error("Password must be at least 12 characters.");
  if ((await ask("Repeat it: ", true)) !== pw) throw new Error("Passwords did not match.");
  await db.admin.update({ where: { id: admin.id }, data: { passwordHash: await bcrypt.hash(pw, 12), sessionsSince: new Date() } });
  console.log("Password changed. Every session is signed out; sign in again at /admin/login.");
  await db.$disconnect();
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
