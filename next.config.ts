import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["ws"],
  experimental: {
    // Allow analyze route longer execution time on Vercel
  },
};

export default nextConfig;
