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

test("recognizes supported text inputs", () => {
  const element = { tagName: "INPUT", type: "text" };
  assert.equal(isSupportedEditable(element), true);
});

test("ignores unsupported input types", () => {
  const element = { tagName: "INPUT", type: "password" };
  assert.equal(isSupportedEditable(element), false);
});

test("recognizes contenteditable regions", () => {
  const element = { tagName: "DIV", isContentEditable: true };
  assert.equal(isSupportedEditable(element), true);
});

test("returns the original value when disabled", () => {
  const transliterator = { convert: (value) => `${value}!` };
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
