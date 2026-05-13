function normalizeEnabledState(storageValue) {
  return Boolean(storageValue && storageValue.enabled);
}

function buildStoragePayload(enabled) {
  return { enabled: Boolean(enabled) };
}

function initializePopup(doc = typeof document !== "undefined" ? document : null, chromeApi = typeof chrome !== "undefined" ? chrome : null) {
  if (!doc || !chromeApi?.storage?.local) {
    return;
  }

  const toggle = doc.getElementById("enabled-toggle");
  const status = doc.getElementById("status-text");
  if (!toggle || !status) {
    return;
  }

  chromeApi.storage.local.get({ enabled: false }, (result) => {
    const enabled = normalizeEnabledState(result);
    toggle.checked = enabled;
    status.textContent = enabled ? "Assamese typing is on" : "Assamese typing is off";
  });

  toggle.addEventListener("change", () => {
    const enabled = Boolean(toggle.checked);
    chromeApi.storage.local.set(buildStoragePayload(enabled));
    status.textContent = enabled ? "Assamese typing is on" : "Assamese typing is off";
  });
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    buildStoragePayload,
    initializePopup,
    normalizeEnabledState
  };
} else if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", () => {
    initializePopup();
  });
}
