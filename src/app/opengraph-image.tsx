import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

// Branded share card for pages without their own photo (issue #13).
// Colours are the brand core palette (CLAUDE.md §5); og images can't read CSS tokens.
export const alt = "The Plug Africa — verified businesses and services across Africa";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const NAVY = "#14173A";
const GOLD = "#B4913F";
const CREAM = "#FAF7F0";

// The site's own fonts (OFL), read at build time: the card has no dynamic data, so Next renders it once.
const font = (pkg: string, file: string) => readFile(join(process.cwd(), "node_modules/@fontsource", pkg, "files", file));

export default async function OpengraphImage() {
  const [jakarta800, jakarta500, fraunces700] = await Promise.all([
    font("plus-jakarta-sans", "plus-jakarta-sans-latin-800-normal.woff"),
    font("plus-jakarta-sans", "plus-jakarta-sans-latin-500-normal.woff"),
    font("fraunces", "fraunces-latin-700-normal.woff"),
  ]);
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: CREAM, fontFamily: "Jakarta", padding: "72px 80px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          {/* Linked Mark, original flat version */}
          <svg width="168" height="128" viewBox="0 0 210 160">
            <rect x="20" y="40" width="80" height="68" rx="34" fill="none" stroke={NAVY} strokeWidth="9" />
            <rect x="96" y="40" width="80" height="68" rx="34" fill="none" stroke={GOLD} strokeWidth="9" />
          </svg>
          <div style={{ display: "flex", width: 2, height: 84, background: NAVY, opacity: 0.25 }} />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontFamily: "Fraunces", fontSize: 52, fontWeight: 700, color: NAVY, letterSpacing: 1 }}>THE PLUG</span>
            <span style={{ fontSize: 22, fontWeight: 500, color: GOLD, letterSpacing: 14 }}>AFRICA</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 66, fontWeight: 800, color: NAVY, lineHeight: 1.08, letterSpacing: -2, maxWidth: 940 }}>
            Verified businesses and services across Africa
          </span>
          <span style={{ marginTop: 22, fontSize: 30, fontWeight: 500, color: NAVY, opacity: 0.6 }}>Homes, schools, drivers, home care and more. Contact them directly.</span>
        </div>
        <div style={{ display: "flex", width: 120, height: 8, borderRadius: 8, background: GOLD }} />
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Jakarta", data: jakarta800, weight: 800, style: "normal" },
        { name: "Jakarta", data: jakarta500, weight: 500, style: "normal" },
        { name: "Fraunces", data: fraunces700, weight: 700, style: "normal" },
      ],
    },
  );
}
