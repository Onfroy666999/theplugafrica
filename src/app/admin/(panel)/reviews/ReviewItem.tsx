"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Spinner } from "@/components/market/Form";
import { Star } from "@/components/market/Icons";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Sheet, SheetTitle } from "@/components/ui/Sheet";
import { call } from "@/lib/call";
import { deleteReview, moderateReview, respondToReview } from "../../review-actions";
import { useCan } from "../AdminContext";

type Review = { id: string; name: string; rating: number; body: string; ref: string; status: string; response: string; when: string };

export function ReviewItem({ review: r, business }: { review: Review; business: { id: string; name: string; slug: string } }) {
  const canEdit = useCan("edit");
  const canDelete = useCan("delete");
  const [status, setStatus] = useState(r.status);
  const [reply, setReply] = useState(r.response);
  const [replying, setReplying] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [gone, setGone] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  if (gone) return null;

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, done: () => void) =>
    start(async () => {
      setMessage(null);
      const res = await call(fn());
      if (res.ok) done();
      else setMessage({ ok: false, text: res.error ?? "That didn't work." });
    });

  return (
    <li className="px-4 py-4 md:px-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between md:gap-6">
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2">
            <span className="flex" aria-label={`${r.rating} out of 5 stars`}>
              {Array.from({ length: 5 }, (_, k) => <Star key={k} className={`h-4 w-4 ${k < r.rating ? "text-gold" : "text-navy/15"}`} />)}
            </span>
            <span className="text-[15px] font-semibold text-navy">{r.name}</span>
            <span className="text-[13px] text-navy/45">
              on <Link href={`/admin/businesses/${business.id}`} className="font-medium text-navy hover:underline">{business.name}</Link> · {r.when} · <span className="font-mono">{r.ref}</span>
            </span>
          </p>
          <p className="mt-2 max-w-3xl text-[14.5px] leading-relaxed whitespace-pre-line text-navy/80">{r.body}</p>
          {reply && !replying && (
            <p className="mt-3 max-w-3xl rounded-field bg-cream px-4 py-3 text-[14px] text-navy/75">
              <span className="font-semibold text-navy">Reply from The Plug: </span>
              {reply}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 md:shrink-0">
          {status === "approved" ? <Badge tone="ok">Approved</Badge> : status === "rejected" ? <Badge tone="muted">Rejected</Badge> : <Badge tone="info">Waiting</Badge>}
          {canEdit && status !== "approved" && (
            <Button size="sm" disabled={pending} onClick={() => run(() => moderateReview(r.id, "approved"), () => setStatus("approved"))}>Approve</Button>
          )}
          {canEdit && status !== "rejected" && (
            <Button variant="secondary" size="sm" disabled={pending} onClick={() => run(() => moderateReview(r.id, "rejected"), () => setStatus("rejected"))}>Reject</Button>
          )}
          {canEdit && (
            <Button variant="ghost" size="sm" aria-expanded={replying} onClick={() => setReplying((o) => !o)}>{reply ? "Edit reply" : "Reply"}</Button>
          )}
          {canDelete && (
            <Button variant="ghost" size="sm" aria-label={`Delete review ${r.ref}`} onClick={() => setConfirming(true)}>Delete</Button>
          )}
        </div>
      </div>

      {replying && (
        <div className="mt-3 max-w-3xl">
          <textarea
            aria-label="Public reply"
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            maxLength={1000}
            placeholder="Shown under the review as a reply from The Plug, e.g. thanking them or explaining what was done."
            className="min-h-[90px] w-full resize-y rounded-field border border-navy/15 bg-white px-4 py-3 text-[14.5px] text-navy outline-none placeholder:text-navy/35 hover:border-navy/30 focus:border-navy/40"
          />
          <div className="mt-2 flex items-center gap-3">
            <Button size="sm" disabled={pending} onClick={() => run(() => respondToReview(r.id, reply), () => { setReplying(false); setMessage({ ok: true, text: reply.trim() ? "Reply saved" : "Reply removed" }); })}>
              {pending && <Spinner />}
              Save reply
            </Button>
          </div>
        </div>
      )}
      {message && <p role={message.ok ? "status" : "alert"} className={`mt-2 text-[13px] font-medium ${message.ok ? "text-ok" : "text-ember"}`}>{message.text}</p>}

      <Sheet open={confirming} onOpenChange={setConfirming} title="Delete review">
        <SheetTitle className="pr-10 font-heading text-[22px] font-bold text-navy">Delete {r.name}&apos;s review?</SheetTitle>
        <p className="mt-2 text-[14.5px] text-navy/65">It&apos;s removed for good and the rating is recalculated. To hide a genuine review, reject it instead.</p>
        <div className="mt-6 grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={() => setConfirming(false)}>Keep it</Button>
          <Button variant="danger" disabled={pending} onClick={() => run(() => deleteReview(r.id), () => { setConfirming(false); setGone(true); })}>
            {pending && <Spinner />}
            Delete
          </Button>
        </div>
      </Sheet>
    </li>
  );
}
