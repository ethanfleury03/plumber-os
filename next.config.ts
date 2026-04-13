import type { NextConfig } from "next";

const devExtraOrigins = (process.env.NEXT_PUBLIC_DEV_EXTRA_ORIGINS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],
  /** Reduces cross-origin warnings when the dev server is opened via ngrok or another tunnel. */
  ...(devExtraOrigins.length ? { allowedDevOrigins: devExtraOrigins } : {}),
};

export default nextConfig;
