import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Folio renders on request (signed-in data everywhere), so no incremental cache (R2) is needed yet.
export default defineCloudflareConfig({});
