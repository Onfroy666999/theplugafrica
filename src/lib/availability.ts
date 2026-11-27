// A business's availability for new work (issue #132), set in the admin. Shown on its listing, and sent to the concierge
// with a request so they know whether to start or suggest someone else. Pure, so the admin, the public pages and the
// alerts share one copy.

export const AVAILABILITY = [
  { value: "available", label: "Available for new work", short: "Available", tone: "ok" },
  { value: "limited", label: "Limited availability", short: "Limited", tone: "gold" },
  { value: "unavailable", label: "Not taking new work right now", short: "Not taking work", tone: "muted" },
] as const;

export type Availability = (typeof AVAILABILITY)[number]["value"];

export const availabilityOf = (v: string | null | undefined) => AVAILABILITY.find((a) => a.value === v) ?? AVAILABILITY[0];
