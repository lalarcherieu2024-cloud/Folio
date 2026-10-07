import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Server actions accept 1 MB by default; company verification documents can be up to 10 MB
    // (plus a little room for the form-data wrapping).
    serverActions: { bodySizeLimit: "11mb" },
  },
};

export default nextConfig;

// Lets `next dev` use the Cloudflare bindings from wrangler.jsonc, like the deployed Worker does.
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
