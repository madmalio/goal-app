import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts", // Your custom worker
  swDest: "public/sw.js", // Where it outputs the compiled worker
  disable: process.env.NODE_ENV === "development", // Only run in production (npm run build)
});

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default withSerwist(nextConfig);
