"use client";

import { useEffect, useRef, useState } from "react";

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

type TurnstileApi = { render: (el: HTMLElement, opts: { sitekey: string; theme?: string; size?: string }) => string; remove: (id: string) => void };
declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

/**
 * Anti-spam fields for public forms (issue #7): the honeypot, the time the form was opened (bots submit
 * instantly), and Cloudflare Turnstile when NEXT_PUBLIC_TURNSTILE_SITE_KEY is set. Place inside the <form>.
 */
export function FormGuard() {
  const [started] = useState(() => Date.now());
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!SITE_KEY || !box.current) return;
    let id: string | undefined;
    const mount = () => {
      if (box.current && window.turnstile && !id) id = window.turnstile.render(box.current, { sitekey: SITE_KEY, theme: "light", size: "flexible" });
    };
    if (window.turnstile) mount();
    else {
      const existing = document.querySelector<HTMLScriptElement>('script[data-turnstile]');
      const s = existing ?? Object.assign(document.createElement("script"), { src: "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit", async: true });
      s.dataset.turnstile = "1";
      s.addEventListener("load", mount);
      if (!existing) document.head.appendChild(s);
    }
    return () => {
      if (id && window.turnstile) window.turnstile.remove(id);
    };
  }, []);

  return (
    <>
      <input type="hidden" name="_t" value={started} />
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 opacity-0" />
      {SITE_KEY && <div ref={box} className="min-h-[65px]" />}
    </>
  );
}
