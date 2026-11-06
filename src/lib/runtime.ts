/** True when running on Cloudflare Workers (staging/production), false on a local Node server. */
export const onWorkers = typeof navigator !== "undefined" && navigator.userAgent === "Cloudflare-Workers";

/** The staging copy (develop branch). Read at request time: Workers expose `vars` from wrangler.jsonc via process.env. */
export const isStaging = () => process.env.SITE_ENV === "staging";
