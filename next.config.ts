import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emit a self-contained server bundle for the Docker image.
  output: "standalone",
  experimental: {
    // Allow attachment uploads through Server Actions (default is 1MB).
    serverActions: { bodySizeLimit: "50mb" },
  },
};

export default nextConfig;
