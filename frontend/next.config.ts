import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // React Compiler adds significant compile time; re-enable when you want the optimization.
  reactCompiler: false,
  experimental: {
    // Tree-shake lucide-react barrel imports (faster dev compile / smaller bundles).
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
