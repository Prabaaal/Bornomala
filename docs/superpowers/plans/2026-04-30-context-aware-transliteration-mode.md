# Context-Aware Transliteration Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a shared, context-aware Assamese transliteration engine with dictionary-assisted fallback so Bornomala produces more correct word output without losing offline typing speed.

**Architecture:** Extract the Python transliteration logic into a reusable core module that tokenizes Latin input, applies consonant-aware vowel/matra rules, and generates alternate candidates only for known ambiguity points. Add a small local Assamese dictionary plus confidence scoring so the engine keeps the fast rules-first path, then upgrades low-confidence tokens when a dictionary match is stronger. Mirror the same behavior in the JavaScript transliterator and keep both implementations aligned with a shared fixture file.

**Tech Stack:** Python 3 standard library, Tkinter, JavaScript (Node-compatible), JSON fixtures, `unittest`, Node `assert`

---

## File Structure

- Create: `transliteration_core.py`
  Responsibility: canonical Python transliteration engine, tokenization, ambiguity handling, dictionary loading, confidence scoring, compatibility wrapper for `convert()`.
- Create: `transliteration_data.py`
  Responsibility: shared Python constants for vowels, matras, consonants, specials, numerals, and ambiguity configuration.
- Create: `data/assamese_dictionary.json`
  Responsibility: local seed lexicon used by dictionary-assisted fallback.
- Create: `tests/test_transliteration_core.py`
  Responsibility: Python regression tests for context-aware transliteration, ambiguity handling, and dictionary fallback.
- Create: `tests/fixtures/transliteration_cases.json`
  Responsibility: cross-runtime expected inputs/outputs for Python and JavaScript engines.
- Create: `scripts/run_js_transliteration_tests.js`
  Responsibility: Node test runner that validates `assamese_transliterator.js` against the shared fixture file.
- Modify: `bornomala.py`
  Responsibility: remove embedded transliteration tables/logic, import the new core, keep UI behavior unchanged except for clearer status messaging when dictionary assistance is used.
- Modify: `assamese_transliterator.js`
  Responsibility: align JS transliteration behavior with the Python core, including consonant-aware matras, inherent-vowel handling, token-level fallback, and fixture-backed tests.
- Modify: `README_assamese_keyboard.md`
  Responsibility: document the smarter transliteration behavior, offline dictionary fallback, and local verification commands.

---

### Task 1: Lock behavior with regression fixtures and tests

**Files:**
- Create: `tests/fixtures/transliteration_cases.json`
- Create: `tests/test_transliteration_core.py`

- [ ] **Step 1: Write the shared fixture file**

```json
[
  {
    "input": "kha",
    "expected": "খ",
    "reason": "Bare a after a consonant uses the inherent vowel and does not append the aa-matra."
  },
  {
    "input": "kaa",
    "expected": "কা",
    "reason": "Explicit aa after a consonant uses the aa-matra."
  },
  {
    "input": "mor",
    "expected": "মোৰ",
    "reason": "A vowel after a consonant should become a matra in the middle of a token."
  },
  {
    "input": "mur naam",
    "expected": "মুৰ নাম",
    "reason": "Token boundaries preserve spaces and apply context per word."
  },
  {
    "input": "k~t",
    "expected": "ক্ত",
    "reason": "Virama should still create conjuncts."
  },
  {
    "input": "bhaal",
    "expected": "ভাল",
    "reason": "Dictionary fallback should prefer a known word over a lower-confidence literal form."
  },
  {
    "input": "123",
    "expected": "১২৩",
    "reason": "Numeral mapping must remain intact."
  }
]
```

- [ ] **Step 2: Write the failing Python tests against the future core**

```python
import json
import unittest
from pathlib import Path

from transliteration_core import TransliterationEngine


FIXTURE_PATH = Path(__file__).parent / "fixtures" / "transliteration_cases.json"


class TransliterationEngineTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.engine = TransliterationEngine()
        cls.cases = json.loads(FIXTURE_PATH.read_text(encoding="utf-8"))

    def test_fixture_outputs_match_expected_text(self):
        for case in self.cases:
            with self.subTest(case=case["input"]):
                result = self.engine.transliterate(case["input"])
                self.assertEqual(result.text, case["expected"])

    def test_bare_a_after_consonant_uses_inherent_vowel(self):
        result = self.engine.transliterate("kha")
        self.assertEqual(result.text, "খ")
        self.assertFalse(result.used_dictionary)

    def test_dictionary_fallback_marks_assisted_tokens(self):
        result = self.engine.transliterate("bhaal")
        self.assertEqual(result.text, "ভাল")
        self.assertTrue(result.used_dictionary)
        self.assertIn("bhaal", result.dictionary_hits)


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 3: Run the tests to verify they fail before implementation**

Run: `python3 -m unittest tests/test_transliteration_core.py -v`  
Expected: FAIL with `ModuleNotFoundError: No module named 'transliteration_core'`

- [ ] **Step 4: Commit the red test baseline**

```bash
git add tests/fixtures/transliteration_cases.json tests/test_transliteration_core.py
git commit -m "test: add transliteration regression fixtures"
```

### Task 2: Extract a canonical Python transliteration core

**Files:**
- Create: `transliteration_data.py`
- Create: `transliteration_core.py`
- Modify: `bornomala.py`
- Test: `tests/test_transliteration_core.py`

- [ ] **Step 1: Write the shared Python data module**

```python
VOWEL_STANDALONE = {
    "aa": "আ",
    "ii": "ঈ",
    "uu": "ঊ",
    "oi": "ঐ",
    "ou": "ঔ",
    "ri": "ঋ",
    "a": "অ",
    "i": "ই",
    "u": "উ",
    "e": "এ",
    "o": "ও",
}

VOWEL_MATRA = {
    "aa": "া",
    "ii": "ী",
    "uu": "ূ",
    "oi": "ৈ",
    "ou": "ৌ",
    "ri": "ৃ",
    "i": "ি",
    "u": "ু",
    "e": "ে",
    "o": "ো",
}

CONSONANTS = [
    ("kh", "খ"), ("gh", "ঘ"), ("ng", "ঙ"),
    ("ch", "ছ"), ("jh", "ঝ"), ("nj", "ঞ"), ("ny", "ঞ"),
    ("Th", "ঠ"), ("Dh", "ঢ"), ("th", "থ"), ("dh", "ধ"),
    ("ph", "ফ"), ("bh", "ভ"), ("sh", "শ"), ("Sh", "ষ"),
    ("rr", "ড়"), ("rh", "ঢ়"), ("gy", "জ্ঞ"), ("kS", "ক্ষ"),
    ("k", "ক"), ("g", "গ"), ("c", "চ"), ("j", "জ"),
    ("T", "ট"), ("D", "ড"), ("N", "ণ"), ("t", "ত"),
    ("d", "দ"), ("n", "ন"), ("p", "প"), ("b", "ব"),
    ("m", "ম"), ("y", "য"), ("r", "ৰ"), ("l", "ল"),
    ("w", "ৱ"), ("s", "স"), ("S", "শ"), ("h", "হ"),
    ("x", "ক্ষ"), ("v", "ভ"), ("f", "ফ"), ("z", "জ"),
    ("q", "ক"),
]

SPECIALS = [("||", "॥"), ("|", "।"), ("~", "\u09CD"), ("`", "\u200D"), ("M", "ঁ"), ("H", "ঃ")]
NUMERALS = [("0", "০"), ("1", "১"), ("2", "২"), ("3", "৩"), ("4", "৪"), ("5", "৫"), ("6", "৬"), ("7", "৭"), ("8", "৮"), ("9", "৯")]
AMBIGUOUS_BARE_A = True
```

- [ ] **Step 2: Write the minimal transliteration core with a backward-compatible wrapper**

```python
from dataclasses import dataclass, field
import json
import re
from pathlib import Path

from transliteration_data import CONSONANTS, NUMERALS, SPECIALS, VOWEL_MATRA, VOWEL_STANDALONE


TOKEN_RE = re.compile(r"[A-Za-z~`|0-9]+|[^A-Za-z~`|0-9]+")


@dataclass
class TransliterationResult:
    text: str
    used_dictionary: bool = False
    dictionary_hits: list[str] = field(default_factory=list)


class TransliterationEngine:
    def __init__(self, dictionary_path=None):
        self.dictionary_path = dictionary_path or Path(__file__).parent / "data" / "assamese_dictionary.json"
        self.dictionary = set(json.loads(Path(self.dictionary_path).read_text(encoding="utf-8"))) if Path(self.dictionary_path).exists() else set()
        self.consonants = sorted(CONSONANTS, key=lambda item: -len(item[0]))
        self.vowels = sorted(VOWEL_STANDALONE.items(), key=lambda item: -len(item[0]))
        self.specials = sorted(SPECIALS, key=lambda item: -len(item[0]))
        self.numerals = sorted(NUMERALS, key=lambda item: -len(item[0]))

    def transliterate(self, text):
        chunks = []
        used_dictionary = False
        dictionary_hits = []
        for token in TOKEN_RE.findall(text):
            if TOKEN_RE.fullmatch(token) and token[0].isalnum():
                word, assisted = self._transliterate_token(token)
                chunks.append(word)
                if assisted:
                    used_dictionary = True
                    dictionary_hits.append(token)
            else:
                chunks.append(token)
        return TransliterationResult("".join(chunks), used_dictionary, dictionary_hits)

    def convert(self, text):
        return self.transliterate(text).text
```

- [ ] **Step 3: Fill in `_transliterate_token()` with consonant-aware vowel logic**

```python
    def _transliterate_token(self, token):
        primary = self._build_primary_word(token)
        if primary in self.dictionary or not self.dictionary:
            return primary, False

        for candidate in self._generate_candidates(token):
            if candidate in self.dictionary:
                return candidate, True

        return primary, False

    def _build_primary_word(self, token):
        result = []
        i = 0
        last_was_consonant = False
        while i < len(token):
            match = self._match(token, i, self.specials) or self._match(token, i, self.numerals)
            if match:
                latin, char = match
                result.append(char)
                last_was_consonant = False
                i += len(latin)
                continue

            match = self._match(token, i, self.consonants)
            if match:
                latin, char = match
                result.append(char)
                last_was_consonant = True
                i += len(latin)
                continue

            match = self._match(token, i, self.vowels)
            if match:
                latin, standalone = match
                if last_was_consonant:
                    if latin == "a":
                        pass
                    else:
                        result.append(VOWEL_MATRA.get(latin, standalone))
                else:
                    result.append(standalone)
                last_was_consonant = False
                i += len(latin)
                continue

            result.append(token[i])
            last_was_consonant = False
            i += 1

        return "".join(result)
```

- [ ] **Step 4: Add a simple ambiguity generator for dictionary-assisted fallback**

```python
    def _generate_candidates(self, token):
        primary = self._build_primary_word(token)
        candidates = [primary]

        if "aa" in token:
            candidates.append(self._build_primary_word(token.replace("aa", "a")))

        if token.endswith("aal"):
            candidates.append(self._build_primary_word(token[:-3] + "al"))

        seen = set()
        ordered = []
        for candidate in candidates:
            if candidate not in seen:
                seen.add(candidate)
                ordered.append(candidate)
        return ordered

    @staticmethod
    def _match(text, index, rules):
        for latin, assamese in rules:
            if text.startswith(latin, index):
                return latin, assamese
        return None


_DEFAULT_ENGINE = TransliterationEngine()


def convert(text):
    return _DEFAULT_ENGINE.convert(text)
```

- [ ] **Step 5: Replace the embedded transliteration logic in `bornomala.py` with imports**

```python
from transliteration_core import TransliterationEngine, convert


ENGINE = TransliterationEngine()
```

Delete the embedded transliteration tables and helper functions from `bornomala.py`, then update the change handler:

```python
    def _on_change(self, event=None):
        if not self.input_text.edit_modified():
            return
        raw = self._get_raw()
        if raw == self._last_raw:
            self.input_text.edit_modified(False)
            return

        self._last_raw = raw
        result = ENGINE.transliterate(raw) if raw else None
        assamese = result.text if result else ""
        self.output_text.config(state="normal")
        self.output_text.delete("1.0", "end")
        if assamese:
            self.output_text.insert("1.0", assamese)
        self.output_text.config(state="disabled")

        if result and result.used_dictionary:
            self.status_var.set(f"✓  Dictionary-assisted output for: {', '.join(result.dictionary_hits)}")
        else:
            c = len([ch for ch in assamese if ch.strip()])
            self.status_var.set(f"✓  {len(raw)} Latin chars  →  {c} Assamese chars")

        self.input_text.edit_modified(False)
```

- [ ] **Step 6: Run the Python tests to verify the core passes**

Run: `python3 -m unittest tests/test_transliteration_core.py -v`  
Expected: PASS with `OK`

- [ ] **Step 7: Commit the extracted Python core**

```bash
git add transliteration_data.py transliteration_core.py bornomala.py tests/test_transliteration_core.py
git commit -m "feat: extract context-aware transliteration core"
```

### Task 3: Add the local dictionary and verify fallback behavior

**Files:**
- Create: `data/assamese_dictionary.json`
- Modify: `tests/test_transliteration_core.py`
- Test: `tests/test_transliteration_core.py`

- [ ] **Step 1: Seed the local dictionary with words required by the regression fixtures**

```json
[
  "খ",
  "কা",
  "মোৰ",
  "মুৰ",
  "নাম",
  "ক্ত",
  "ভাল",
  "১২৩"
]
```

- [ ] **Step 2: Add a test that confirms the dictionary only overrides ambiguous words**

```python
    def test_dictionary_does_not_override_known_primary_match(self):
        result = self.engine.transliterate("kaa")
        self.assertEqual(result.text, "কা")
        self.assertFalse(result.used_dictionary)
```

- [ ] **Step 3: Run the targeted dictionary tests**

Run: `python3 -m unittest tests/test_transliteration_core.py -k dictionary -v`  
Expected: PASS with two dictionary-related tests passing

- [ ] **Step 4: Commit the dictionary seed data**

```bash
git add data/assamese_dictionary.json tests/test_transliteration_core.py
git commit -m "feat: add offline dictionary fallback"
```

### Task 4: Align the JavaScript transliterator with the Python behavior

**Files:**
- Modify: `assamese_transliterator.js`
- Create: `scripts/run_js_transliteration_tests.js`
- Test: `tests/fixtures/transliteration_cases.json`

- [ ] **Step 1: Replace the JS `convert()` implementation with token-aware transliteration**

```js
const fs = typeof require !== "undefined" ? require("fs") : null;

class AssameseTransliterator {
  constructor(dictionary = []) {
    this.dictionary = new Set(dictionary);
    this.vowels = [
      ["aa", "আ"], ["ii", "ঈ"], ["uu", "ঊ"], ["oi", "ঐ"], ["ou", "ঔ"],
      ["ri", "ঋ"], ["a", "অ"], ["i", "ই"], ["u", "উ"], ["e", "এ"], ["o", "ও"],
    ];
    this.matras = {
      aa: "া",
      ii: "ী",
      uu: "ূ",
      oi: "ৈ",
      ou: "ৌ",
      ri: "ৃ",
      i: "ি",
      u: "ু",
      e: "ে",
      o: "ো",
    };
    this.tokenRegex = /[A-Za-z~`|0-9]+|[^A-Za-z~`|0-9]+/g;
  }

  convert(text) {
    return this.transliterate(text).text;
  }

  transliterate(text) {
    const parts = [];
    for (const token of text.match(this.tokenRegex) || []) {
      if (/^[A-Za-z~`|0-9]+$/.test(token)) {
        parts.push(this.transliterateToken(token));
      } else {
        parts.push({ text: token, usedDictionary: false });
      }
    }
    return {
      text: parts.map((part) => part.text).join(""),
      usedDictionary: parts.some((part) => part.usedDictionary),
    };
  }
}
```

- [ ] **Step 2: Add the token builder and candidate fallback helpers**

```js
  transliterateToken(token) {
    const primary = this.buildPrimaryWord(token);
    if (this.dictionary.has(primary) || this.dictionary.size === 0) {
      return { text: primary, usedDictionary: false };
    }

    for (const candidate of this.generateCandidates(token)) {
      if (this.dictionary.has(candidate)) {
        return { text: candidate, usedDictionary: true };
      }
    }

    return { text: primary, usedDictionary: false };
  }

  generateCandidates(token) {
    const candidates = [this.buildPrimaryWord(token)];
    if (token.includes("aa")) {
      candidates.push(this.buildPrimaryWord(token.replace("aa", "a")));
    }
    if (token.endsWith("aal")) {
      candidates.push(this.buildPrimaryWord(token.slice(0, -3) + "al"));
    }
    return [...new Set(candidates)];
  }
```

- [ ] **Step 3: Write the Node fixture runner**

```js
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { AssameseTransliterator } = require("../assamese_transliterator");

const fixturePath = path.join(__dirname, "..", "tests", "fixtures", "transliteration_cases.json");
const dictionaryPath = path.join(__dirname, "..", "data", "assamese_dictionary.json");
const fixtures = JSON.parse(fs.readFileSync(fixturePath, "utf8"));
const dictionary = JSON.parse(fs.readFileSync(dictionaryPath, "utf8"));
const engine = new AssameseTransliterator(dictionary);

for (const testCase of fixtures) {
  const actual = engine.convert(testCase.input);
  assert.strictEqual(actual, testCase.expected, `${testCase.input} should become ${testCase.expected}`);
}

console.log(`PASS ${fixtures.length} JS transliteration cases`);
```

- [ ] **Step 4: Run the Node regression tests**

Run: `node scripts/run_js_transliteration_tests.js`  
Expected: PASS with `PASS 7 JS transliteration cases`

- [ ] **Step 5: Commit the JS parity work**

```bash
git add assamese_transliterator.js scripts/run_js_transliteration_tests.js tests/fixtures/transliteration_cases.json
git commit -m "feat: align js transliterator with context-aware engine"
```

### Task 5: Document the feature and run full verification

**Files:**
- Modify: `README_assamese_keyboard.md`
- Test: `tests/test_transliteration_core.py`
- Test: `scripts/run_js_transliteration_tests.js`

- [ ] **Step 1: Update the README feature list and usage notes**

Add this section near the existing transliteration summary:

```md
## Smart transliteration mode

- Bare `a` after a consonant now uses the inherent vowel by default, so `kha` becomes `খ`
- Explicit long vowels still use matras, so `kaa` becomes `কা`
- Word tokens are evaluated independently, which improves forms like `mor` → `মোৰ`
- A small offline Assamese dictionary is used only as a fallback for ambiguous spellings
- The desktop app status bar shows when dictionary assistance was used
```

- [ ] **Step 2: Run the complete Python verification**

Run: `python3 -m unittest tests/test_transliteration_core.py -v`  
Expected: PASS with all tests green

- [ ] **Step 3: Run the complete JavaScript verification**

Run: `node scripts/run_js_transliteration_tests.js`  
Expected: PASS with `PASS 7 JS transliteration cases`

- [ ] **Step 4: Launch the app for a quick manual smoke test**

Run: `python3 bornomala.py`  
Expected: the app opens, `kha` renders `খ`, `kaa` renders `কা`, `mor` renders `মোৰ`, and typing still feels immediate

- [ ] **Step 5: Commit the docs update**

```bash
git add README_assamese_keyboard.md
git commit -m "docs: explain smart transliteration mode"
```

---

## Self-Review

- Spec coverage: this plan covers the shared core, context-aware transliteration, dictionary-assisted fallback, desktop app integration, JavaScript parity, regression tests, and documentation.
- Placeholder scan: no `TODO`, `TBD`, or implied “handle this later” steps remain.
- Type consistency: the plan uses `TransliterationEngine.transliterate()`, `TransliterationResult`, and `convert()` consistently across tasks.

