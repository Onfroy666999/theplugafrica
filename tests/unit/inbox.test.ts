import { describe, expect, it } from "vitest";
import { csvCell, toCsv } from "@/lib/csv";
import { filterQuery, monthRange, parseInboxFilters, recentMonths } from "@/lib/inbox-filters";

describe("inbox filters", () => {
  const statuses = ["new", "replied", "closed"];

  it("reads valid filters and ignores invalid ones", () => {
    expect(parseInboxFilters({ status: "replied", q: "  Ama ", month: "2026-11", assigned: "me", page: "3" }, statuses)).toEqual({ status: "replied", q: "Ama", month: "2026-11", assigned: "me", page: 3 });
    expect(parseInboxFilters({ status: "bogus", month: "2026-13", assigned: "everyone", page: "-2" }, statuses)).toEqual({ status: undefined, q: undefined, month: undefined, assigned: undefined, page: 1 });
    expect(parseInboxFilters({ q: "x".repeat(300) }, statuses).q).toHaveLength(100);
  });

  it("covers a whole month, including year ends", () => {
    expect(monthRange("2026-11")).toEqual({ gte: new Date("2026-11-01T00:00:00Z"), lt: new Date("2026-12-01T00:00:00Z") });
    expect(monthRange("2026-12").lt).toEqual(new Date("2027-01-01T00:00:00Z"));
  });

  it("lists recent months, newest first", () => {
    const m = recentMonths(new Date("2026-02-10T12:00:00Z"), 3);
    expect(m).toEqual([
      { value: "2026-02", label: "February 2026" },
      { value: "2026-01", label: "January 2026" },
      { value: "2025-12", label: "December 2025" },
    ]);
  });

  it("builds links that keep the filters", () => {
    expect(filterQuery({ status: "new", q: "Ama Mensah", page: 2 })).toBe("status=new&q=Ama+Mensah");
    expect(filterQuery({ month: "2026-11", page: 2 }, { page: 2 })).toBe("month=2026-11&page=2");
  });
});

describe("spreadsheet export", () => {
  it("quotes commas, quotes and line breaks", () => {
    expect(csvCell("plain")).toBe("plain");
    expect(csvCell('Say "hi", please')).toBe('"Say ""hi"", please"');
    expect(csvCell("two\nlines")).toBe('"two\nlines"');
    expect(csvCell(null)).toBe("");
  });

  it("stops a cell from running as a spreadsheet formula", () => {
    expect(csvCell("=HYPERLINK(\"http://evil\")")).toBe("\"'=HYPERLINK(\"\"http://evil\"\")\"");
    expect(csvCell("+233 24 000 0000")).toBe("'+233 24 000 0000");
    expect(csvCell("@sum")).toBe("'@sum");
  });

  it("writes dates readably and starts with a byte-order mark for Excel", () => {
    const csv = toCsv(["Reference", "Date"], [["MSG-AAAA-BBBB", new Date("2026-11-07T14:05:00Z")]]);
    expect(csv.startsWith("﻿Reference,Date\r\n")).toBe(true);
    expect(csv).toContain("MSG-AAAA-BBBB,2026-11-07 14:05\r\n");
  });
});
