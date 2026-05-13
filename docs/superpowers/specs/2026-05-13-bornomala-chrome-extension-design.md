# Bornomala Chrome Extension Design

## Goal

Create a Chrome extension that lets users type Latin phonetics directly into webpage text fields and have the text replaced with Assamese output using the existing Bornomala transliteration engine. The first version should be globally enabled or disabled through a simple popup toggle.

## User Experience

- Users install the extension in Chrome.
- The extension popup shows a single global on/off control.
- When enabled, typing into supported webpage fields converts Latin phonetic input into Assamese in place.
- When disabled, pages behave normally with no transliteration.

## Supported Editable Targets

The first version should support:

- Standard `input[type="text"]`
- `input[type="search"]`
- `input[type="email"]`
- `input[type="url"]`
- `input[type="tel"]`
- `textarea`
- Basic `contenteditable="true"` regions

The first version does not need to optimize for complex editors such as Google Docs, Notion, or highly custom shadow-DOM editors.

## Architecture

### Manifest

Use Chrome Extension Manifest V3.

- `storage` permission for the global toggle state
- content script matching regular web pages
- popup page for the toggle UI

### Transliteration Engine

Reuse the existing `assamese_transliterator.js` logic rather than re-implementing the mapping in a second extension-only file. If needed, wrap or export it so it can be loaded from the content script cleanly.

### Content Script

The content script should:

- Read the global enabled/disabled flag from Chrome storage
- Listen for `input` events on supported editable targets
- Convert field contents in place when the extension is enabled
- Preserve caret position as well as possible after replacement
- Ignore unsupported or non-editable elements

### Popup

The popup should:

- Show the extension name and current status
- Provide a single checkbox or switch
- Persist the value to Chrome storage immediately

## State Model

Use a single boolean key in Chrome storage, for example `enabled`.

- Default state: `false`
- Scope: global across all sites
- Changing the popup toggle updates the content-script behavior on future input events

## Error Handling

- If Chrome storage is temporarily unavailable, default to disabled behavior.
- If transliteration fails unexpectedly for a field, leave the original page value intact rather than clearing or corrupting text.
- If caret restoration cannot be exact in a `contenteditable` element, preserve content first and accept best-effort caret handling.

## Testing Strategy

Use test-first development.

- Add unit tests for the popup toggle state helpers
- Add unit tests for editable target detection and transliteration gating in the content script
- Add regression tests that prove the transliterator is reused correctly for extension typing flows

Because this repo does not currently include a JS test harness, keep the first test setup lightweight and runnable with built-in Node tooling where possible.

## Files To Add

- `chrome-extension/manifest.json`
- `chrome-extension/content.js`
- `chrome-extension/popup.html`
- `chrome-extension/popup.js`
- `chrome-extension/popup.css`
- `chrome-extension/icons/` placeholder assets
- `tests/chrome-extension/` for JavaScript tests

## Non-Goals For V1

- Per-site enable/disable rules
- Rich-editor integrations
- Options page
- Keyboard shortcuts
- Multi-candidate suggestion UI
