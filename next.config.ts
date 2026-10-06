import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The certificate PDF reads its fonts from disk; make sure they ship with that route in production builds.
  outputFileTracingIncludes: { "/api/credentials/[id]/certificate": ["./src/assets/fonts/**/*"], "/api/payments/[escrowId]/receipt": ["./src/assets/fonts/**/*"] },
  experimental: {
    // Server actions accept 1 MB by default; company verification documents can be up to 10 MB
    // (plus a little room for the form-data wrapping).
    serverActions: { bodySizeLimit: "11mb" },
  },
};

export default nextConfig;
