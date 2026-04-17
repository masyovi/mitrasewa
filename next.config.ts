import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: [
    "preview-chat-1b59f3bc-4699-43d4-afdf-b95ea887eabe.space.z.ai",
  ],
  serverExternalPackages: ["z-ai-web-dev-sdk"],
};

export default nextConfig;
