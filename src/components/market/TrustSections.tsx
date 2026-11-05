import { Accordion } from "@/components/ui/Accordion";
import { LinkButton } from "@/components/ui/Button";
import { CONCIERGE_TRUST, type Checklist, type Faq } from "@/lib/content";
import { STAGGER } from "@/lib/motion";
import { Check, Chat, Shield } from "./Icons";
import { Reveal } from "./Sections";

// Shared long-form sections for category and service pages (issue #38).

/** A titled list with check marks. `tone="cream"` for the softer, secondary card. */
export function ChecklistCard({ list, icon = "shield", tone = "white" }: { list: Checklist; icon?: "shield" | "chat"; tone?: "white" | "cream" }) {
  return (
    <div className={`h-full rounded-panel p-7 md:p-8 ${tone === "cream" ? "bg-cream" : "border border-navy/10 bg-white shadow-card"}`}>
      <span className="flex h-11 w-11 items-center justify-center rounded-card bg-gold/15 text-gold">{icon === "chat" ? <Chat /> : <Shield />}</span>
      <h3 className="mt-5 font-heading text-[19px] font-bold text-navy">{list.title}</h3>
      <ul className="mt-4 space-y-3">
        {list.items.map((it) => (
          <li key={it} className="flex gap-3 text-[15.5px] leading-relaxed text-navy/75">
            <span className="mt-[3px] flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ok-soft text-ok">
              <Check className="h-3 w-3" />
            </span>
            {it}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** "What we check" beside "Before you commit". */
export function TrustAndTips({ checks, tips }: { checks: Checklist; tips?: Checklist }) {
  return (
    <section className="pt-20">
      <div className={`grid gap-4 ${tips ? "md:grid-cols-2" : ""}`}>
        <Reveal>
          <ChecklistCard list={checks} />
        </Reveal>
        {tips && (
          <Reveal delay={STAGGER}>
            <ChecklistCard list={tips} icon="chat" tone="cream" />
          </Reveal>
        )}
      </div>
    </section>
  );
}

/** "Who it's for" as a row of cards (concierge categories). */
export function WhoFor({ list }: { list: Checklist }) {
  return (
    <section className="pt-20">
      <h2 className="font-heading text-[26px] font-bold tracking-[-0.02em] md:text-[32px]">{list.title}</h2>
      <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {list.items.map((it, i) => (
          <Reveal key={it} delay={i * STAGGER}>
            <div className="flex h-full gap-3 rounded-panel bg-cream p-6">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold/20 text-gold">
                <Check className="h-3.5 w-3.5" />
              </span>
              <p className="text-[15.5px] leading-relaxed font-medium text-navy">{it}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/** Why people trust The Plug with services it delivers itself. */
export function ConciergeTrust() {
  return (
    <section className="pt-20">
      <div className="rounded-hero bg-navy p-8 text-white md:p-14">
        <h2 className="max-w-xl font-heading text-[26px] leading-tight font-bold tracking-[-0.02em] md:text-[32px]">Why people trust The Plug with it</h2>
        <div className="mt-9 grid gap-x-10 gap-y-8 md:grid-cols-2">
          {CONCIERGE_TRUST.map((t, i) => (
            <Reveal key={t.title} delay={i * STAGGER}>
              <div className="flex gap-4">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold text-navy">
                  <Check className="h-3.5 w-3.5" />
                </span>
                <div>
                  <h3 className="font-heading text-[17.5px] font-bold">{t.title}</h3>
                  <p className="mt-1.5 text-[15.5px] leading-relaxed text-white/70">{t.body}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FaqSection({ items, title = "Common questions" }: { items: Faq[]; title?: string }) {
  return (
    <section className="grid gap-6 pt-20 lg:grid-cols-[1fr_2fr] lg:gap-14">
      <div>
        <h2 className="font-heading text-[26px] leading-tight font-bold tracking-[-0.02em] md:text-[32px]">{title}</h2>
        <p className="mt-3 max-w-sm text-[15.5px] leading-relaxed text-navy/60">Something else on your mind? Ask us and a real person will reply.</p>
        <LinkButton href="/contact" variant="secondary" size="sm" className="mt-5">Ask a question</LinkButton>
      </div>
      <Accordion items={items} />
    </section>
  );
}

/** Closing band: a human to talk to when the list isn't enough. */
export function HelpBand({ title = "Not sure where to start?", body = "Tell a Plug concierge what you need. We'll find the right people, make the introductions and follow up for you." }: { title?: string; body?: string }) {
  return (
    <section className="pt-20">
      <div className="flex flex-col items-start justify-between gap-6 rounded-hero bg-cream p-8 md:flex-row md:items-center md:p-12">
        <div>
          <h2 className="font-heading text-[24px] leading-tight font-bold tracking-[-0.02em] text-navy md:text-[28px]">{title}</h2>
          <p className="mt-2 max-w-xl text-[16px] leading-relaxed text-navy/65">{body}</p>
        </div>
        <LinkButton href="/concierge" size="lg" className="shrink-0">Ask a concierge</LinkButton>
      </div>
    </section>
  );
}
