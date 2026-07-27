import type { NextConfig } from "next";
import { networkInterfaces } from "os";

// Dynamically collect all local network IPs so the dev server
// accepts requests from any machine on the LAN.
function getLocalDevOrigins(): string[] {
  const origins: string[] = [];
  const ifaces = networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    for (const iface of ifaces[name] ?? []) {
      if (iface.family === "IPv4" && !iface.internal) {
        const ip = iface.address;
        origins.push(ip);
        origins.push(`${ip}:3000`);
        origins.push(`${ip}:3001`);
      }
    }
  }
  return origins;
}

const localOrigins = getLocalDevOrigins();

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "localhost",
    "localhost:3000",
    "localhost:3001",
    ...localOrigins,
  ],
};

export default nextConfig;
