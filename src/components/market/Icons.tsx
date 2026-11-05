import type { CatKey } from "@/lib/directory";

const P = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const PATHS: Record<CatKey, React.ReactNode> = {
  rentals: (
    <>
      <path {...P} d="M3.5 11 12 4l8.5 7" />
      <path {...P} d="M5.5 9.5V20h13V9.5" />
      <path {...P} d="M10 20v-5.5h4V20" />
    </>
  ),
  "jobs-hr": (
    <>
      <rect {...P} x="3.5" y="7.5" width="17" height="12" rx="2.5" />
      <path {...P} d="M9 7.5V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5M3.5 12.5h17" />
    </>
  ),
  education: (
    <>
      <path {...P} d="m2.5 9 9.5-4.5L21.5 9 12 13.5z" />
      <path {...P} d="M6.5 11v4.5c1.5 1.5 3.4 2.3 5.5 2.3s4-.8 5.5-2.3V11M21.5 9v5" />
    </>
  ),
  entertainment: (
    <>
      <path {...P} d="M9 18V6l11-2v12" />
      <circle {...P} cx="6.5" cy="18" r="2.5" />
      <circle {...P} cx="17.5" cy="16" r="2.5" />
    </>
  ),
  "special-services": (
    <>
      <path {...P} d="M5 16.5V12l1.8-4.5A2 2 0 0 1 8.7 6h6.6a2 2 0 0 1 1.9 1.5L19 12v4.5" />
      <path {...P} d="M3.5 16.5h17M5 12h14" />
      <circle {...P} cx="7.5" cy="16.5" r="1.8" />
      <circle {...P} cx="16.5" cy="16.5" r="1.8" />
    </>
  ),
  // Shopfront with an awning: a business being opened (issue #36)
  "new-business": (
    <>
      <path {...P} d="M4 9.5 5.5 4.5h13L20 9.5" />
      <path {...P} d="M4 9.5a2.67 2.67 0 0 0 5.33 0 2.67 2.67 0 0 0 5.34 0 2.67 2.67 0 0 0 5.33 0" />
      <path {...P} d="M5.5 11.5v8h13v-8M10 19.5V15h4v4.5" />
    </>
  ),
  "invest-ngos": (
    <>
      <path {...P} d="M3.5 19.5h17" />
      <path {...P} d="m4.5 15 5-5 3.5 3.5 6.5-7" />
      <path {...P} d="M15 6.5h4.5V11" />
    </>
  ),
  emergency: (
    <>
      <circle {...P} cx="12" cy="12" r="8.5" />
      <path {...P} d="M12 8v8M8 12h8" />
    </>
  ),
  classifieds: (
    <>
      <path {...P} d="M3.5 12.2V4.5a1 1 0 0 1 1-1h7.7l8.3 8.3-8.7 8.7z" />
      <circle {...P} cx="8" cy="8" r="1.4" />
    </>
  ),
};

export function CatIcon({ k, className = "h-6 w-6" }: { k: CatKey; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      {PATHS[k]}
    </svg>
  );
}

export function Check({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path {...P} strokeWidth={2.2} d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  );
}

export function Shield({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path {...P} d="M12 3.5 5 6v5.5c0 4.3 3 7.8 7 9 4-1.2 7-4.7 7-9V6z" />
      <path {...P} d="m9 12 2.2 2.2L15.5 10" />
    </svg>
  );
}

export function Star({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path fill="currentColor" d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" />
    </svg>
  );
}

export function Heart({ filled, className = "h-5 w-5" }: { filled?: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M12 20s-7.5-4.4-7.5-10A4.3 4.3 0 0 1 12 7.6 4.3 4.3 0 0 1 19.5 10c0 5.6-7.5 10-7.5 10z"
        fill={filled ? "#C8501F" : "rgba(0,0,0,.35)"}
        stroke="#fff"
        strokeWidth="1.8"
      />
    </svg>
  );
}

export function Search({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle {...P} strokeWidth={2} cx="11" cy="11" r="6.5" />
      <path {...P} strokeWidth={2} d="m16 16 4 4" />
    </svg>
  );
}

export function Pin({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path {...P} d="M12 21s6.5-5.6 6.5-11a6.5 6.5 0 0 0-13 0c0 5.4 6.5 11 6.5 11z" />
      <circle {...P} cx="12" cy="10" r="2.3" />
    </svg>
  );
}

export function Chat({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path {...P} d="M4.5 18.5V7a2.5 2.5 0 0 1 2.5-2.5h10A2.5 2.5 0 0 1 19.5 7v7a2.5 2.5 0 0 1-2.5 2.5H8z" />
    </svg>
  );
}

export function Arrow({ dir = "right", className = "h-4 w-4" }: { dir?: "left" | "right"; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" style={dir === "left" ? { transform: "scaleX(-1)" } : undefined}>
      <path {...P} strokeWidth={2} d="M5 12h14m-5-5 5 5-5 5" />
    </svg>
  );
}
