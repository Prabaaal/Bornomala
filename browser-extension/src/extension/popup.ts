import { isToggleableUrl } from "./site-state.js";

type PopupState = {
  url: string | null;
  enabled: boolean;
};

async function getTabUrl(): Promise<string | null> {
  const debugUrl = new URL(window.location.href).searchParams.get("tabUrl");

  if (debugUrl) {
    return debugUrl;
  }

  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true
  });

  return tab?.url ?? null;
}

async function getSiteStatus(url: string): Promise<boolean> {
  const response = (await chrome.runtime.sendMessage({
    type: "GET_SITE_STATUS",
    url
  })) as { ok: boolean; state?: { enabled: boolean } };

  return Boolean(response?.ok && response.state?.enabled);
}

async function setSiteStatus(url: string, enabled: boolean): Promise<boolean> {
  const response = (await chrome.runtime.sendMessage({
    type: "SET_SITE_STATUS",
    url,
    enabled
  })) as { ok: boolean; state?: { enabled: boolean } };

  return Boolean(response?.ok && response.state?.enabled);
}

function render(state: PopupState): void {
  const toggle = document.querySelector<HTMLButtonElement>("#site-toggle");
  const status = document.querySelector<HTMLElement>("#site-status");
  const host = document.querySelector<HTMLElement>("#site-host");

  if (!toggle || !status || !host) {
    return;
  }

  if (!state.url || !isToggleableUrl(state.url)) {
    toggle.disabled = true;
    toggle.textContent = "This page cannot use Bornomala";
    status.textContent = "Open a regular website to enable Bornomala.";
    host.textContent = state.url ?? "No active page";
    return;
  }

  const origin = new URL(state.url).origin;
  host.textContent = origin;
  toggle.disabled = false;
  toggle.textContent = state.enabled
    ? "Disable Bornomala on this site"
    : "Enable Bornomala on this site";
  status.textContent = state.enabled
    ? "Assamese mode is ready for supported fields on this site."
    : "Bornomala is currently off for this site.";
}

async function init(): Promise<void> {
  const url = await getTabUrl();
  const state: PopupState = {
    url,
    enabled: url && isToggleableUrl(url) ? await getSiteStatus(url) : false
  };
  const toggle = document.querySelector<HTMLButtonElement>("#site-toggle");

  render(state);

  toggle?.addEventListener("click", async () => {
    if (!state.url || !isToggleableUrl(state.url)) {
      return;
    }

    state.enabled = await setSiteStatus(state.url, !state.enabled);
    render(state);
  });
}

void init();
