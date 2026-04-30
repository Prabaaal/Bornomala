import { getDefaultRuleSet } from "../core/index.js";
import type { ModeState } from "../core/index.js";
import { BridgeAdapter } from "../adapters/bridge-adapter.js";
import { ContentEditableAdapter } from "../adapters/contenteditable-adapter.js";
import { TextInputAdapter } from "../adapters/text-input-adapter.js";
import type { SiteStatusChangedMessage } from "./messages.js";
import { ModeIndicator } from "./indicator.js";

type AdapterBinding = {
  root: HTMLElement;
  detach: () => void;
};

const indicator = new ModeIndicator();
const modeState: ModeState = {
  enabled: false,
  ruleSet: getDefaultRuleSet()
};
const adapters = [
  new BridgeAdapter("monaco"),
  new BridgeAdapter("codemirror"),
  new TextInputAdapter(),
  new ContentEditableAdapter()
];
let activeBinding: AdapterBinding | null = null;

function injectPageBridge(): void {
  const script = document.createElement("script");
  script.src = chrome.runtime.getURL("src/extension/page-bridge.js");
  script.type = "module";
  script.dataset.bornomalaInjected = "true";
  (document.head ?? document.documentElement).appendChild(script);
  script.remove();
}

function unbind(): void {
  activeBinding?.detach();
  activeBinding = null;
  indicator.hide();
}

function bindToTarget(target: EventTarget | null): void {
  if (!modeState.enabled) {
    unbind();
    return;
  }

  for (const adapter of adapters) {
    const root = adapter.detect(target);

    if (!root) {
      continue;
    }

    if (activeBinding?.root === root) {
      indicator.show(root);
      return;
    }

    unbind();

    const eventTarget = target instanceof HTMLElement ? target : root;
    activeBinding = {
      root,
      detach: adapter.attach(root, () => modeState, eventTarget)
    };
    indicator.show(root);
    return;
  }

  unbind();
}

async function syncInitialState(): Promise<void> {
  const response = (await chrome.runtime.sendMessage({
    type: "GET_SITE_STATUS",
    url: window.location.href
  })) as { ok: boolean; state?: { enabled: boolean } };

  modeState.enabled = Boolean(response?.ok && response.state?.enabled);

  if (modeState.enabled) {
    bindToTarget(document.activeElement);
  }
}

document.addEventListener(
  "focusin",
  (event) => {
    bindToTarget(event.target);
  },
  true
);

document.addEventListener("focusout", () => {
  queueMicrotask(() => {
    bindToTarget(document.activeElement);
  });
});

chrome.runtime.onMessage.addListener((message: SiteStatusChangedMessage) => {
  if (message.type !== "SITE_STATUS_CHANGED" || window.location.origin !== message.origin) {
    return;
  }

  modeState.enabled = message.state.enabled;

  if (modeState.enabled) {
    bindToTarget(document.activeElement);
  } else {
    unbind();
  }
});

injectPageBridge();
void syncInitialState();
