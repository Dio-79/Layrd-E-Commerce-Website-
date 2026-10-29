import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // `npm run dev` only answers its own scripts for localhost by default. Opening the
  // site from a network address (e.g. http://192.168.56.1:3000, or a teammate's PC on
  // the same Wi-Fi) loaded the page but no JavaScript, so no button worked. These are
  // the private network ranges; production builds ignore this setting.
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "172.*.*.*"],
};

export default nextConfig;
