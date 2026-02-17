import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const DEFAULT_LOCAL_KB_ID = "g6ma6m5fbczyapihh5htq";

export function getKbIdFromHost(host: string): string | null {
  if (host.includes("localhost")) return DEFAULT_LOCAL_KB_ID;

  const hostname = host.split(":")[0];
  const cleanHost = hostname.replace(/^www\./, "");
  const parts = cleanHost.split(".");

  // Expecting subdomain.domain.tld (at least 3 parts)
  if (parts.length < 3) return null;

  return parts[0];
}
