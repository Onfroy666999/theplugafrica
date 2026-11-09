import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { Empty, PageHeader, Pager, Panel, fmtDate } from "../ui";

const PAGE = 50;
type SP = Promise<Record<string, string | string[] | undefined>>;

/** Visitor accounts (issue #82), read-only: who has signed up and how active they are. */
export default async function Users({ searchParams }: { searchParams: SP }) {
  await requireAdmin();
  const sp = await searchParams;
  const q = String(sp.q ?? "").trim().slice(0, 120);
  const page = Math.max(1, Number(sp.page) || 1);
  const where = q ? { OR: [{ email: { contains: q, mode: "insensitive" as const } }, { name: { contains: q, mode: "insensitive" as const } }, { phone: { contains: q } }] } : {};
  const [rows, total] = await Promise.all([
    db.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE,
      take: PAGE,
      select: { id: true, email: true, name: true, phone: true, createdAt: true, lastSignInAt: true, _count: { select: { saved: true, conciergeRequests: true, enquiries: true } } },
    }),
    db.user.count({ where }),
  ]);
  return (
    <>
      <PageHeader title="Users" sub={`Visitors with an account: ${total}. They sign in with an emailed code; there's nothing to manage here.`} />
      <form className="mb-5 flex gap-2">
        <input
          name="q"
          defaultValue={q}
          aria-label="Search users"
          placeholder="Search by email, name or phone"
          className="h-11 w-full max-w-md rounded-full border border-navy/15 bg-white px-5 text-[14.5px] outline-none focus:border-navy/40"
        />
        <button className="press h-11 rounded-full bg-navy px-5 text-[14px] font-semibold text-white">Search</button>
      </form>
      {rows.length === 0 ? (
        <Empty title={q ? "No users match" : "No accounts yet"} body={q ? "Try another email, name or phone number." : "Visitors appear here after they first sign in."} />
      ) : (
        <Panel className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-[14px]">
            <thead className="text-[12.5px] text-navy/65">
              <tr className="border-b border-navy/10">
                <th className="px-5 py-3 font-semibold">Person</th>
                <th className="px-5 py-3 font-semibold">Joined</th>
                <th className="px-5 py-3 font-semibold">Last sign-in</th>
                <th className="px-5 py-3 text-right font-semibold">Requests</th>
                <th className="px-5 py-3 text-right font-semibold">Saved</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => (
                <tr key={u.id} className="border-b border-navy/[0.06] last:border-0">
                  <td className="px-5 py-3.5">
                    <p className="font-semibold text-navy">{u.name || "No name yet"}</p>
                    <p className="text-navy/65">
                      <a href={`mailto:${u.email}`} className="hover:underline">{u.email}</a>
                      {u.phone && <> · {u.phone}</>}
                    </p>
                  </td>
                  <td className="px-5 py-3.5 text-navy/65">{fmtDate(u.createdAt)}</td>
                  <td className="px-5 py-3.5 text-navy/65">{u.lastSignInAt ? fmtDate(u.lastSignInAt) : "Never"}</td>
                  <td className="px-5 py-3.5 text-right font-semibold">{u._count.conciergeRequests + u._count.enquiries}</td>
                  <td className="px-5 py-3.5 text-right font-semibold">{u._count.saved}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      )}
      <Pager page={page} pageSize={PAGE} total={total} query={q ? `q=${encodeURIComponent(q)}` : ""} path="/admin/users" />
    </>
  );
}
