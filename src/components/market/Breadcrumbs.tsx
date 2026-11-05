import Link from "next/link";
import { abs, jsonLd } from "@/lib/site";

/** Explore › Category › Service › … — the last item is the current page. Also emits schema.org BreadcrumbList (issue #13). */
export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  const ld = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.label, ...(it.href && { item: abs(it.href) }) })),
  };
  return (
    <nav aria-label="Breadcrumb" className="text-[13px] text-navy/55">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(ld)} />
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {items.map((it, i) => (
          <li key={i} className="flex items-center gap-2">
            {i > 0 && <span aria-hidden="true">›</span>}
            {it.href ? (
              <Link href={it.href} className="transition-colors duration-200 hover:text-navy">{it.label}</Link>
            ) : (
              <span aria-current="page" className="text-navy">{it.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
