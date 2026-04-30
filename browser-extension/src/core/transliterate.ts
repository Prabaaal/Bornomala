import { defaultRuleSet } from "./rules.js";
import type { Rule, RuleSet, TransliterationResult } from "./types.js";

const sortedRules = [...defaultRuleSet.rules].sort(
  (left, right) => right.latin.length - left.latin.length
);

const consonants = new Set(
  defaultRuleSet.rules
    .filter((rule) => rule.kind === "consonant")
    .map((rule) => rule.assamese)
);

function matchRule(text: string, index: number, rules: Rule[]): Rule | null {
  for (const rule of rules) {
    if (text.startsWith(rule.latin, index)) {
      return rule;
    }
  }

  return null;
}

export function getDefaultRuleSet(): RuleSet {
  return defaultRuleSet;
}

export function transliterate(text: string, ruleSet: RuleSet = defaultRuleSet): TransliterationResult {
  const rules = ruleSet === defaultRuleSet
    ? sortedRules
    : [...ruleSet.rules].sort((left, right) => right.latin.length - left.latin.length);
  const consonantSet = ruleSet === defaultRuleSet
    ? consonants
    : new Set(ruleSet.rules.filter((rule) => rule.kind === "consonant").map((rule) => rule.assamese));
  const output: string[] = [];
  let index = 0;
  let previousWasConsonant = false;

  while (index < text.length) {
    const rule = matchRule(text, index, rules);

    if (!rule) {
      output.push(text[index] ?? "");
      previousWasConsonant = false;
      index += 1;
      continue;
    }

    if (rule.kind === "vowel" && previousWasConsonant) {
      output.push(rule.matra ?? rule.assamese);
      previousWasConsonant = false;
    } else {
      output.push(rule.assamese);
      previousWasConsonant = consonantSet.has(rule.assamese);
    }

    index += rule.latin.length;
  }

  return { text: output.join("") };
}
