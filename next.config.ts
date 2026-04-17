import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  serverExternalPackages: [
    "z-ai-web-dev-sdk",
    "@libsql/client",
    "@prisma/adapter-libsql",
  ],
};

export default nextConfig;
