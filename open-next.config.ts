import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Every page reads live data (force-dynamic), so no incremental cache is needed yet (issue #4).
export default defineCloudflareConfig({});
