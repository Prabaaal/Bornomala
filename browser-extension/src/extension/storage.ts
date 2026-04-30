import type { SiteActivationState } from "../core/index.js";
import {
  getOriginFromUrl,
  getSiteStateKey,
  normalizeSiteActivationState
} from "./site-state.js";

export async function getSiteActivationState(url: string): Promise<SiteActivationState> {
  const key = getSiteStateKey(url);
  const stored = await chrome.storage.local.get(key);

  return normalizeSiteActivationState(stored[key] as SiteActivationState | undefined);
}

export async function setSiteActivationState(
  url: string,
  enabled: boolean
): Promise<SiteActivationState> {
  const key = getSiteStateKey(url);
  const state: SiteActivationState = {
    enabled,
    updatedAt: Date.now()
  };

  await chrome.storage.local.set({
    [key]: state
  });

  return state;
}

export async function toggleSiteActivationState(url: string): Promise<SiteActivationState> {
  const current = await getSiteActivationState(url);
  return setSiteActivationState(url, !current.enabled);
}

export function getOriginForState(url: string): string {
  const origin = getOriginFromUrl(url);

  if (!origin) {
    throw new Error(`Unsupported URL for Bornomala activation: ${url}`);
  }

  return origin;
}
