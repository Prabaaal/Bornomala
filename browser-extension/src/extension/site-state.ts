import type { SiteActivationState } from "../core/types.js";

export function getOriginFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }

    return parsed.origin;
  } catch {
    return null;
  }
}

export function isToggleableUrl(url: string): boolean {
  return getOriginFromUrl(url) !== null;
}

export function getSiteStateKey(url: string): string {
  const origin = getOriginFromUrl(url);

  if (!origin) {
    throw new Error(`Unsupported URL for Bornomala site state: ${url}`);
  }

  return `site:${origin}`;
}

export function normalizeSiteActivationState(
  state: SiteActivationState | undefined
): SiteActivationState {
  if (!state) {
    return {
      enabled: false,
      updatedAt: 0
    };
  }

  return {
    enabled: Boolean(state.enabled),
    updatedAt: Number.isFinite(state.updatedAt) ? state.updatedAt : 0
  };
}
