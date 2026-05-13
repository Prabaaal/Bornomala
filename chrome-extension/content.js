const SUPPORTED_INPUT_TYPES = new Set(["text", "search", "email", "url", "tel"]);

function isSupportedEditable(element) {
  if (!element || typeof element.tagName !== "string") {
    return false;
  }

  const tagName = element.tagName.toUpperCase();
  if (tagName === "TEXTAREA") {
    return true;
  }

  if (tagName === "INPUT") {
    const inputType = (element.type || "text").toLowerCase();
    return SUPPORTED_INPUT_TYPES.has(inputType);
  }

  return Boolean(element.isContentEditable);
}

function transliterateIfEnabled(value, enabled, transliterator) {
  if (!enabled || !transliterator || typeof transliterator.convert !== "function") {
    return value;
  }

  return transliterator.convert(value);
}

function getSelectionSnapshot(element) {
  if (typeof element.selectionStart === "number" && typeof element.selectionEnd === "number") {
    return {
      kind: "input",
      start: element.selectionStart,
      end: element.selectionEnd
    };
  }

  return null;
}

function restoreSelection(element, snapshot, rawValue, convertedValue) {
  if (!snapshot || snapshot.kind !== "input") {
    return;
  }

  const delta = convertedValue.length - rawValue.length;
  const nextStart = Math.max(0, snapshot.start + delta);
  const nextEnd = Math.max(0, snapshot.end + delta);
  if (typeof element.setSelectionRange === "function") {
    element.setSelectionRange(nextStart, nextEnd);
  }
}

function createRuntime(deps = {}) {
  const storage = deps.storage || (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local);
  const transliterator = deps.transliterator
    || (typeof AssameseTransliterator !== "undefined" ? new AssameseTransliterator() : null);
  let enabled = false;

  function updateEnabledState(nextValue) {
    enabled = Boolean(nextValue);
  }

  function syncFromStorage() {
    if (!storage || typeof storage.get !== "function") {
      updateEnabledState(false);
      return;
    }

    storage.get({ enabled: false }, (result) => {
      updateEnabledState(result && result.enabled);
    });
  }

  function handleInput(event) {
    const element = event && event.target;
    if (!isSupportedEditable(element)) {
      return;
    }

    if (!enabled) {
      return;
    }

    if (typeof element.value === "string") {
      const rawValue = element.value;
      const convertedValue = transliterateIfEnabled(rawValue, enabled, transliterator);
      if (convertedValue === rawValue) {
        return;
      }

      const snapshot = getSelectionSnapshot(element);
      element.value = convertedValue;
      restoreSelection(element, snapshot, rawValue, convertedValue);
      return;
    }

    if (element.isContentEditable && typeof element.textContent === "string") {
      const rawText = element.textContent;
      const convertedText = transliterateIfEnabled(rawText, enabled, transliterator);
      if (convertedText !== rawText) {
        element.textContent = convertedText;
      }
    }
  }

  function register() {
    syncFromStorage();

    if (storage && typeof storage.onChanged?.addListener === "function") {
      storage.onChanged.addListener((changes, areaName) => {
        if (areaName === "local" && changes.enabled) {
          updateEnabledState(changes.enabled.newValue);
        }
      });
    }

    if (typeof document !== "undefined" && typeof document.addEventListener === "function") {
      document.addEventListener("input", handleInput, true);
    }
  }

  return {
    handleInput,
    register,
    syncFromStorage,
    updateEnabledState,
    get enabled() {
      return enabled;
    }
  };
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    createRuntime,
    isSupportedEditable,
    transliterateIfEnabled
  };
} else {
  createRuntime().register();
}
