import { requireAdmin } from "@/lib/auth";
import { roleLabel } from "@/lib/roles";
import { PageHeader, Panel } from "../ui";
import { NameForm, PasswordForm } from "./AccountForms";

/** My account (issue #67): your name and password. */
export default async function Account() {
  const me = await requireAdmin();
  return (
    <>
      <PageHeader title="My account" sub={`${me.email} · ${roleLabel(me.role)}. Ask an owner to change your email or role.`} />
      <div className="grid max-w-3xl gap-6">
        <Panel className="p-5 md:p-7">
          <h2 className="font-heading text-[18px] font-bold text-navy">Your name</h2>
          <p className="mt-1 mb-5 text-[14px] text-navy/65">Shown in the activity log and to the rest of the team.</p>
          <NameForm name={me.name} />
        </Panel>
        <Panel className="p-5 md:p-7">
          <h2 className="font-heading text-[18px] font-bold text-navy">Password</h2>
          <p className="mt-1 mb-5 text-[14px] text-navy/65">Changing it signs you out on every other device. Forgotten it? Ask an owner for a password link.</p>
          <PasswordForm email={me.email} />
        </Panel>
      </div>
    </>
  );
}
