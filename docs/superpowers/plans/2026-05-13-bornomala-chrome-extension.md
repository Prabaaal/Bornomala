# Bornomala Chrome Extension Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Chrome extension that transliterates Latin typing into Assamese directly inside webpage text fields, controlled by a global popup toggle.

**Architecture:** Keep the extension small and plain-JavaScript. Reuse the existing transliteration engine from the repo, add a content script that translates only when a stored global flag is enabled, and add a minimal popup that reads and writes that flag. Use lightweight Node tests first to validate the content-script helpers and popup state logic before writing production code.

**Tech Stack:** Chrome Extension Manifest V3, plain JavaScript, HTML/CSS, Node.js built-in test runner, Node `assert`

---

## File Structure

- Create: `chrome-extension/manifest.json`
  Responsibility: define MV3 extension metadata, permissions, popup, and scripts.
- Create: `chrome-extension/content.js`
  Responsibility: editable-target detection, global enabled-state caching, in-place transliteration, caret preservation helpers.
- Create: `chrome-extension/popup.html`
  Responsibility: popup markup with a global toggle and status text.
- Create: `chrome-extension/popup.js`
  Responsibility: load toggle state from Chrome storage and persist updates.
- Create: `chrome-extension/popup.css`
  Responsibility: simple popup styling.
- Create: `chrome-extension/icons/icon-16.png`
- Create: `chrome-extension/icons/icon-32.png`
- Create: `chrome-extension/icons/icon-48.png`
- Create: `chrome-extension/icons/icon-128.png`
  Responsibility: placeholder icons required by Chrome packaging.
- Create: `tests/chrome-extension/content.test.js`
  Responsibility: prove editable-target detection and transliteration gating behavior.
- Create: `tests/chrome-extension/popup.test.js`
  Responsibility: prove popup storage read/write helpers work correctly.

## Tasks

### Task 1: Lock the content-script behavior with failing tests

**Files:**
- Create: `tests/chrome-extension/content.test.js`

- [ ] **Step 1: Write the failing tests**

```js
const test = require("node:test");
const assert = require("node:assert/strict");

const {
  isSupportedEditable,
  transliterateIfEnabled,
} = require("../../chrome-extension/content.js");

test("recognizes supported textarea elements", () => {
  const element = { tagName: "TEXTAREA" };
  assert.equal(isSupportedEditable(element), true);
});

test("ignores unsupported input types", () => {
  const element = { tagName: "INPUT", type: "password" };
  assert.equal(isSupportedEditable(element), false);
});

test("returns the original value when disabled", () => {
  const transliterator = { convert: (value) => value + "!" };
  assert.equal(
    transliterateIfEnabled("namaskar", false, transliterator),
    "namaskar",
  );
});

test("uses the transliterator when enabled", () => {
  const transliterator = { convert: () => "নমস্কাৰ" };
  assert.equal(
    transliterateIfEnabled("namaskar", true, transliterator),
    "নমস্কাৰ",
  );
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test tests/chrome-extension/content.test.js`
Expected: FAIL because `chrome-extension/content.js` does not exist yet.

- [ ] **Step 3: Commit the red baseline**

```bash
git add tests/chrome-extension/content.test.js
git commit -m "test: add content script coverage"
```

### Task 2: Lock the popup state behavior with failing tests

**Files:**
- Create: `tests/chrome-extension/popup.test.js`

- [ ] **Step 1: Write the failing tests**

```js
const test = require("node:test");
const assert = require("node:assert/strict");

const {
  normalizeEnabledState,
  buildStoragePayload,
} = require("../../chrome-extension/popup.js");

test("defaults missing storage state to false", () => {
  assert.equal(normalizeEnabledState({}), false);
});

test("reads enabled state from storage payload", () => {
  assert.equal(normalizeEnabledState({ enabled: true }), true);
});

test("builds a storage payload for the global toggle", () => {
  assert.deepEqual(buildStoragePayload(true), { enabled: true });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test tests/chrome-extension/popup.test.js`
Expected: FAIL because `chrome-extension/popup.js` does not exist yet.

- [ ] **Step 3: Commit the red baseline**

```bash
git add tests/chrome-extension/popup.test.js
git commit -m "test: add popup state coverage"
```

### Task 3: Implement the minimal extension files to turn tests green

**Files:**
- Create: `chrome-extension/manifest.json`
- Create: `chrome-extension/content.js`
- Create: `chrome-extension/popup.html`
- Create: `chrome-extension/popup.js`
- Create: `chrome-extension/popup.css`
- Create: `chrome-extension/icons/icon-16.png`
- Create: `chrome-extension/icons/icon-32.png`
- Create: `chrome-extension/icons/icon-48.png`
- Create: `chrome-extension/icons/icon-128.png`
- Modify: `assamese_transliterator.js`
- Test: `tests/chrome-extension/content.test.js`
- Test: `tests/chrome-extension/popup.test.js`

- [ ] **Step 1: Implement the minimum content helpers**

```js
function isSupportedEditable(element) {
  if (!element || !element.tagName) return false;
  const tagName = element.tagName.toUpperCase();
  if (tagName === "TEXTAREA") return true;
  if (tagName === "INPUT") {
    return ["text", "search", "email", "url", "tel"].includes((element.type || "text").toLowerCase());
  }
  return Boolean(element.isContentEditable);
}

function transliterateIfEnabled(value, enabled, transliterator) {
  if (!enabled) return value;
  return transliterator.convert(value);
}

module.exports = { isSupportedEditable, transliterateIfEnabled };
```

- [ ] **Step 2: Implement the popup state helpers**

```js
function normalizeEnabledState(storageValue) {
  return Boolean(storageValue && storageValue.enabled);
}

function buildStoragePayload(enabled) {
  return { enabled: Boolean(enabled) };
}

module.exports = { normalizeEnabledState, buildStoragePayload };
```

- [ ] **Step 3: Run the focused tests and make sure they pass**

Run: `node --test tests/chrome-extension/content.test.js tests/chrome-extension/popup.test.js`
Expected: PASS

- [ ] **Step 4: Flesh out the browser-facing extension files**

```js
// Hook the tested helpers into DOM event listeners and popup DOM wiring.
```

- [ ] **Step 5: Re-run tests to stay green**

Run: `node --test tests/chrome-extension/content.test.js tests/chrome-extension/popup.test.js`
Expected: PASS

- [ ] **Step 6: Commit the working extension skeleton**

```bash
git add chrome-extension assamese_transliterator.js tests/chrome-extension
git commit -m "feat: add bornomala chrome extension"
```

### Task 4: Document local loading and verification

**Files:**
- Modify: `README_assamese_keyboard.md`

- [ ] **Step 1: Add a Chrome extension section**

```md
## Option C: Chrome Extension

1. Open `chrome://extensions`
2. Enable Developer mode
3. Click "Load unpacked"
4. Select the `chrome-extension` folder
5. Use the popup toggle to enable Assamese typing
```

- [ ] **Step 2: Run the JavaScript tests again after docs changes**

Run: `node --test tests/chrome-extension/content.test.js tests/chrome-extension/popup.test.js`
Expected: PASS

- [ ] **Step 3: Commit the documentation update**

```bash
git add README_assamese_keyboard.md
git commit -m "docs: add chrome extension instructions"
```
