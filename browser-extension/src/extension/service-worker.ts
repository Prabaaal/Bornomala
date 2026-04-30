import type { RuntimeRequest, RuntimeResponse, SiteStatusChangedMessage } from "./messages.js";
import { isToggleableUrl } from "./site-state.js";
import {
  getOriginForState,
  getSiteActivationState,
  setSiteActivationState,
  toggleSiteActivationState
} from "./storage.js";

async function setBadgeForTab(tabId: number, url?: string): Promise<void> {
  if (!url || !isToggleableUrl(url)) {
    await chrome.action.setBadgeText({ tabId, text: "" });
    return;
  }

  const state = await getSiteActivationState(url);

  await chrome.action.setBadgeBackgroundColor({
    tabId,
    color: state.enabled ? "#0f766e" : "#6b7280"
  });
  await chrome.action.setBadgeText({
    tabId,
    text: state.enabled ? "অ" : ""
  });
}

async function broadcastSiteStatus(url: string, enabled: boolean) {
  const origin = getOriginForState(url);
  const state = await getSiteActivationState(url);
  const tabs = await chrome.tabs.query({});
  const message: SiteStatusChangedMessage = {
    type: "SITE_STATUS_CHANGED",
    origin,
    state
  };

  await Promise.all(
    tabs
      .filter((tab) => tab.id && tab.url && new URL(tab.url).origin === origin)
      .map(async (tab) => {
        await chrome.tabs.sendMessage(tab.id!, message).catch(() => undefined);
        await setBadgeForTab(tab.id!, tab.url);
      })
  );
}

async function handleRuntimeRequest(message: RuntimeRequest): Promise<RuntimeResponse> {
  if (message.type === "GET_SITE_STATUS") {
    const state = await getSiteActivationState(message.url);
    return {
      ok: true,
      state
    };
  }

  if (message.type === "SET_SITE_STATUS") {
    const state = await setSiteActivationState(message.url, message.enabled);
    await broadcastSiteStatus(message.url, state.enabled);
    return {
      ok: true,
      state
    };
  }

  return {
    ok: false,
    error: "Unsupported message"
  };
}

async function getActiveTab(): Promise<chrome.tabs.Tab | null> {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true
  });

  return tab ?? null;
}

chrome.runtime.onMessage.addListener((message: RuntimeRequest, _sender, sendResponse) => {
  void handleRuntimeRequest(message)
    .then((response) => sendResponse(response))
    .catch((error: unknown) => {
      sendResponse({
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error"
      } satisfies RuntimeResponse);
    });

  return true;
});

chrome.commands.onCommand.addListener((command) => {
  if (command !== "toggle-bornomala") {
    return;
  }

  void getActiveTab().then(async (tab) => {
    if (!tab?.id || !tab.url || !isToggleableUrl(tab.url)) {
      return;
    }

    const state = await toggleSiteActivationState(tab.url);
    await broadcastSiteStatus(tab.url, state.enabled);
  });
});

chrome.tabs.onActivated.addListener(({ tabId }) => {
  void chrome.tabs.get(tabId).then((tab) => {
    if (tab.id) {
      void setBadgeForTab(tab.id, tab.url);
    }
  });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "loading" || changeInfo.url) {
    void setBadgeForTab(tabId, tab.url);
  }
});
