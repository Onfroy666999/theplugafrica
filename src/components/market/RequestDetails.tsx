"use client";

import { useState } from "react";
import { ChipGroup } from "@/components/ui/ChipGroup";
import { CITIES } from "@/lib/listings";
import { AREAS, MODE_HINTS, MODE_LABELS, OTHER_AREA, TIMES_OF_DAY, elsewhereLabel, modesFor, type ServiceMode } from "@/lib/requests";
import { Field, Input, Select, toOptions } from "./Form";

const CITY_OPTIONS = toOptions([...CITIES, "Somewhere else"]);
const TIME_OPTIONS = toOptions([...TIMES_OF_DAY]);

/**
 * Where and when, shared by the concierge form and "Send a request" on listings (issue #50).
 * Fields submitted: serviceMode, city, area, landmark, meetingPlace, preferredDate, timeOfDay.
 */
export function RequestDetails({ category, service, defaultCity = "Accra" }: { category?: string; service?: string; defaultCity?: string }) {
  const modes = modesFor(category);
  const [mode, setMode] = useState<ServiceMode>(modes[0]);
  const [city, setCity] = useState(CITIES.includes(defaultCity) ? defaultCity : "Accra");
  const [area, setArea] = useState("");
  const areas = AREAS[city];
  const needsPlace = mode === "my_place" || mode === "elsewhere";
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-5">
      <Field label="Where will the service happen?">
        <ChipGroup label="Where will the service happen?" chips={modes.map((m) => ({ value: m, label: MODE_LABELS[m] }))} value={mode} onChange={(v) => setMode(v as ServiceMode)} className="flex-wrap" />
        <p className="mt-2 text-[13px] text-navy/55">{MODE_HINTS[mode]}</p>
        <input type="hidden" name="serviceMode" value={mode} />
      </Field>

      {mode === "elsewhere" && (
        <Field label={elsewhereLabel(service)}>
          <Input label={elsewhereLabel(service)} name="meetingPlace" required maxLength={160} placeholder="e.g. Kotoka Airport, Terminal 3, or the Kempinski hotel lobby" />
        </Field>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        <Field label={needsPlace ? "City" : "Your city"}>
          <Select label="City" name="city" options={CITY_OPTIONS} value={city} onChange={(v) => { setCity(v); setArea(""); }} />
        </Field>
        {needsPlace && areas && (
          <Field label="Area">
            <Select label="Area" name="area" options={[{ value: "", label: "Choose an area" }, ...toOptions([...areas, OTHER_AREA])]} value={area} onChange={setArea} />
          </Field>
        )}
      </div>

      {needsPlace && (!areas || area === OTHER_AREA) && (
        <Field label="Which area?">
          <Input label="Which area?" name="areaOther" maxLength={80} placeholder="Neighbourhood or town" />
        </Field>
      )}

      {needsPlace && (
        <Field label="Landmark or Ghana Post GPS address" hint="optional">
          <Input label="Landmark or Ghana Post GPS address" name="landmark" maxLength={160} placeholder="e.g. near A&C Mall, or GA-123-4567" />
        </Field>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Preferred date" hint="optional">
          <Input label="Preferred date" name="preferredDate" type="date" min={today} />
        </Field>
        <Field label="Time of day">
          <Select label="Time of day" name="timeOfDay" options={TIME_OPTIONS} defaultValue="Any time" />
        </Field>
      </div>
    </div>
  );
}
