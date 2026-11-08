"use client";

import { useState, useTransition } from "react";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { BUSINESS_STATUS, find } from "@/lib/status";
import { useCan } from "../AdminContext";
import { setBusinessStatus } from "../../actions";
import { call } from "@/lib/call";

/** Change a business's status straight from the list. Explains when Verified isn't allowed yet. */
export function StatusSelect({ id, status }: { id: string; status: string }) {
  const [value, setValue] = useState(status);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const canEdit = useCan("edit");
  if (!canEdit) {
    const s = find(BUSINESS_STATUS, status);
    return <Badge tone={s.tone}>{s.label}</Badge>;
  }
  return (
    <div className={pending ? "opacity-60" : ""}>
      <Select
        variant="pill"
        label="Status"
        options={BUSINESS_STATUS.map((s) => ({ value: s.value, label: s.label }))}
        value={value}
        onChange={(v) => {
          const prev = value;
          setValue(v);
          setError(null);
          start(async () => {
            const r = await call(setBusinessStatus(id, v));
            if (!r.ok) {
              setValue(prev);
              setError(r.error);
            }
          });
        }}
      />
      {error && <p role="alert" className="mt-1.5 max-w-[220px] text-[12px] text-ember">{error}</p>}
    </div>
  );
}
