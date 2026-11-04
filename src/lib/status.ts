// Status values for every record type, with labels and badge tones used across admin and public pages.

export type Tone = "ok" | "warn" | "muted" | "info" | "ember";

const def = <T extends string>(xs: readonly { value: T; label: string; tone: Tone }[]) => xs;

export const BUSINESS_STATUS = def([
  { value: "draft", label: "Draft", tone: "muted" },
  { value: "in_review", label: "In review", tone: "warn" },
  { value: "verified", label: "Verified", tone: "ok" },
  { value: "hidden", label: "Hidden", tone: "ember" },
] as const);

export const CREDENTIAL_STATE = def([
  { value: "pending", label: "Not checked", tone: "muted" },
  { value: "in_review", label: "In review", tone: "warn" },
  { value: "verified", label: "Checked", tone: "ok" },
] as const);

export const ENQUIRY_STATUS = def([
  { value: "new", label: "New", tone: "info" },
  { value: "contacted", label: "Followed up", tone: "warn" },
  { value: "converted", label: "Became business", tone: "ok" },
  { value: "closed", label: "Closed", tone: "muted" },
] as const);

export const CONCIERGE_STATUS = def([
  { value: "new", label: "New", tone: "info" },
  { value: "in_progress", label: "In progress", tone: "warn" },
  { value: "done", label: "Done", tone: "ok" },
  { value: "closed", label: "Closed", tone: "muted" },
] as const);

export const WAITLIST_STATUS = def([
  { value: "new", label: "New", tone: "info" },
  { value: "contacted", label: "Contacted", tone: "warn" },
  { value: "onboarded", label: "Listed", tone: "ok" },
  { value: "declined", label: "Declined", tone: "muted" },
] as const);

/** Businesses with these statuses appear on the public site. */
export const PUBLIC_STATUSES = ["in_review", "verified"] as const;

export const values = (xs: readonly { value: string }[]) => xs.map((x) => x.value) as [string, ...string[]];
export const find = (xs: readonly { value: string; label: string; tone: Tone }[], v: string) => xs.find((x) => x.value === v) ?? { value: v, label: v, tone: "muted" as Tone };
