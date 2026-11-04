"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { SPRING } from "@/lib/motion";

export type NavItem = { href: string; label: string; count?: number };

/** Admin navigation: vertical on desktop, a swipeable row on phones. Same sliding highlight as the public chips. */
export function AdminNav({ items, layout }: { items: NavItem[]; layout: "side" | "top" }) {
  const path = usePathname();
  const reduce = useReducedMotion();
  const isOn = (href: string) => (href === "/admin" ? path === "/admin" : path.startsWith(href));
  return (
    <nav className={layout === "side" ? "flex flex-col gap-1" : "flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"}>
      {items.map((i) => {
        const on = isOn(i.href);
        return (
          <Link
            key={i.href}
            href={i.href}
            aria-current={on ? "page" : undefined}
            className={`press relative flex h-10 shrink-0 items-center justify-between gap-3 rounded-full px-4 text-[14px] font-medium ${on ? "text-navy" : "text-navy/60 hover:text-navy"}`}
          >
            {on && <motion.span layoutId={reduce ? undefined : `admin-nav-${layout}`} transition={SPRING} className="absolute inset-0 rounded-full bg-navy/[0.07]" />}
            <span className="relative">{i.label}</span>
            {!!i.count && <span className="relative rounded-full bg-info px-2 py-0.5 text-[11px] font-bold text-white">{i.count}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
