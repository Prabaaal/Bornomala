import test from "node:test";
import assert from "node:assert/strict";

import {
  getOriginFromUrl,
  getSiteStateKey,
  isToggleableUrl,
  normalizeSiteActivationState
} from "../src/extension/site-state.js";

test("site activation keys are stable per origin", () => {
  assert.equal(
    getSiteStateKey("https://example.com/editor?foo=bar"),
    "site:https://example.com"
  );
  assert.equal(
    getSiteStateKey("https://example.com/docs"),
    "site:https://example.com"
  );
});

test("toggleable urls are limited to regular web pages", () => {
  assert.equal(isToggleableUrl("https://example.com"), true);
  assert.equal(isToggleableUrl("http://localhost:3000"), true);
  assert.equal(isToggleableUrl("chrome://extensions"), false);
  assert.equal(isToggleableUrl("about:blank"), false);
});

test("normalizeSiteActivationState returns disabled defaults for missing storage", () => {
  assert.deepEqual(normalizeSiteActivationState(undefined), {
    enabled: false,
    updatedAt: 0
  });
});

test("getOriginFromUrl returns null for unsupported urls", () => {
  assert.equal(getOriginFromUrl("chrome://extensions"), null);
});
