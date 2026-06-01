import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // React Compiler adds significant compile time; re-enable when you want the optimization.
  reactCompiler: false,
  // Allow phone/APK to load Next.js dev assets when using your PC LAN IP (not just localhost).
  allowedDevOrigins: [
    "10.118.35.224",
    "192.168.56.1",
    "localhost",
    "127.0.0.1",
  ],
  experimental: {
    // Tree-shake lucide-react barrel imports (faster dev compile / smaller bundles).
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
