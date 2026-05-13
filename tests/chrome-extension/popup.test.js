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
