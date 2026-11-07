import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  distDir: process.env.PORTFOLIO_VERIFY_BUILD === "1" ? ".next-verify" : ".next",
  outputFileTracingRoot: process.cwd(),
  images: { remotePatterns: [] },
};
export default nextConfig;
