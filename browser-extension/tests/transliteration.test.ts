import test from "node:test";
import assert from "node:assert/strict";

import { getDefaultRuleSet, transliterate } from "../src/core/index.js";

test("transliterate converts digraphs, matras, and numerals with current Bornomala defaults", () => {
  const ruleSet = getDefaultRuleSet();

  assert.equal(transliterate("kha", ruleSet).text, "খা");
  assert.equal(transliterate("mur naam", ruleSet).text, "মুৰ নাম");
  assert.equal(transliterate("k~t", ruleSet).text, "ক্ত");
  assert.equal(transliterate("123", ruleSet).text, "১২৩");
});

test("transliterate preserves unsupported characters for mixed coding text", () => {
  const ruleSet = getDefaultRuleSet();

  assert.equal(
    transliterate("khbr + 123!", ruleSet).text,
    "খবৰ + ১২৩!"
  );
});
