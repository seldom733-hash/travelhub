/**
 * Shared TypeScript types for TravelHub
 */

/** Provider info returned by Prisma `select` on the `provider` relation */
export interface ProviderInfo {
  firstName?: string;
  lastName?: string;
  companyName?: string;
}

/**
 * Derive a display name from a provider object.
 * Prefers `companyName`, falls back to `firstName + lastName`.
 */
export function getProviderName(provider: ProviderInfo | undefined | null): string | undefined {
  if (!provider) return undefined;
  if (provider.companyName) return provider.companyName;
  const full = `${provider.firstName || ""} ${provider.lastName || ""}`.trim();
  return full || undefined;
}
