"use client";

import { useEffect, useRef } from "react";

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

type TurnstileApi = {
  render: (el: HTMLElement, opts: { sitekey: string; theme?: string; size?: string }) => string;
  reset: (id: string) => void;
  remove: (id: string) => void;
};
declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

/**
 * Anti-spam fields for public forms (issue #7): the honeypot, the time spent on the form (bots submit instantly),
 * and Cloudflare Turnstile when NEXT_PUBLIC_TURNSTILE_SITE_KEY is set. Place inside the <form>.
 *
 * The time is measured by the browser itself (so a phone whose clock is off can't fail it) and written just before
 * the form is sent, never during render (which would differ between server and browser). A Turnstile token works
 * once, so the widget is reset after every submit: a form shown again after an error can be sent again.
 */
export function FormGuard() {
  const box = useRef<HTMLDivElement>(null);
  const elapsed = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const form = elapsed.current?.form;
    const opened = performance.now();
    let id: string | undefined;
    // Runs on the form itself, before React's own submit handler builds its FormData.
    const onSubmit = () => {
      if (elapsed.current) elapsed.current.value = String(Math.round(performance.now() - opened));
      if (id && window.turnstile) {
        const widget = id;
        setTimeout(() => window.turnstile?.reset(widget), 0);
      }
    };
    form?.addEventListener("submit", onSubmit);

    if (SITE_KEY && box.current) {
      const mount = () => {
        if (box.current && window.turnstile && !id) id = window.turnstile.render(box.current, { sitekey: SITE_KEY, theme: "light", size: "flexible" });
      };
      if (window.turnstile) mount();
      else {
        const existing = document.querySelector<HTMLScriptElement>("script[data-turnstile]");
        const s = existing ?? Object.assign(document.createElement("script"), { src: "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit", async: true });
        s.dataset.turnstile = "1";
        s.addEventListener("load", mount);
        if (!existing) document.head.appendChild(s);
      }
    }
    return () => {
      form?.removeEventListener("submit", onSubmit);
      if (id && window.turnstile) window.turnstile.remove(id);
    };
  }, []);

  return (
    <>
      <input ref={elapsed} type="hidden" name="_e" defaultValue="" />
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 opacity-0" />
      {SITE_KEY && <div ref={box} className="min-h-[65px]" />}
    </>
  );
}
