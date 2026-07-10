import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const appDir = dirname(fileURLToPath(import.meta.url));

if (process.env.VERCEL === "1") {
  const configuredApiUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  let apiUrl;
  try {
    apiUrl = configuredApiUrl ? new URL(configuredApiUrl) : null;
  } catch {
    apiUrl = null;
  }
  const hostname = apiUrl?.hostname.replace(/\.$/, "");
  const localHostnames = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1", "[::1]"]);
  if (!apiUrl || apiUrl.protocol !== "https:" || !hostname || localHostnames.has(hostname) || apiUrl.username || apiUrl.password || apiUrl.search || apiUrl.hash) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL must be a valid HTTPS backend URL; local development hosts are not allowed on Vercel.");
  }
  process.env.NEXT_PUBLIC_API_BASE_URL = apiUrl.toString().replace(/\/+$/, "");
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@listwright/shared"],
  turbopack: {
    root: join(appDir, "../.."),
  },
};

export default nextConfig;
