// Spreadsheet (CSV) files for the admin export (issue #67). Opens correctly in Excel, Google Sheets and Numbers.

type Cell = string | number | Date | null | undefined;

/** One cell: quoted when needed, and a leading = + - @ neutralised so a spreadsheet never runs it as a formula. */
export function csvCell(v: Cell) {
  if (v === null || v === undefined) return "";
  let s = v instanceof Date ? v.toISOString().replace("T", " ").slice(0, 16) : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** A whole file. Starts with a byte-order mark so Excel reads accents and the cedi sign correctly. */
export function toCsv(header: string[], rows: Cell[][]) {
  return "﻿" + [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n") + "\r\n";
}
