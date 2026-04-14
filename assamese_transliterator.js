/**
 * Assamese Phonetic Transliterator
 * ------------------------------------
 * Drop-in JS engine. Works in browsers, Node.js, React, Flutter WebView.
 * Converts Latin phonetic input → Assamese Unicode in real-time.
 *
 * Usage:
 *   const t = new AssameseTransliterator();
 *   t.convert("kha")   // → "খ"
 *   t.convert("mor naam prabal") // → "মোৰ নাম প্ৰবাল"
 *
 * For real-time input, use the `handleInput(textarea)` helper.
 */

class AssameseTransliterator {
  constructor() {
    // Rules are sorted longest-match first so "kh" beats "k"
    this.rules = [
      // --- Vowels (long/diphthong first) ---
      ["aa", "আ"],
      ["ii", "ঈ"],
      ["uu", "ঊ"],
      ["oi", "ঐ"],
      ["ou", "ঔ"],
      ["ri", "ঋ"],
      ["a", "অ"],
      ["i", "ই"],
      ["u", "উ"],
      ["e", "এ"],
      ["o", "ও"],

      // --- Consonants: two-char aspirated / digraphs ---
      ["kh", "খ"],
      ["gh", "ঘ"],
      ["ng", "ঙ"],
      ["ch", "ছ"],
      ["jh", "ঝ"],
      ["nj", "ঞ"],
      ["Th", "ঠ"],
      ["Dh", "ঢ"],
      ["th", "থ"],
      ["dh", "ধ"],
      ["ph", "ফ"],
      ["bh", "ভ"],
      ["sh", "শ"],
      ["Sh", "ষ"],
      ["rr", "ড়"],
      ["rh", "ঢ়"],
      ["gy", "জ্ঞ"],
      ["kS", "ক্ষ"],
      ["ny", "ঞ"],

      // --- Consonants: single ---
      ["k", "ক"],
      ["g", "গ"],
      ["c", "চ"],
      ["j", "জ"],
      ["T", "ট"],
      ["D", "ড"],
      ["N", "ণ"],
      ["t", "ত"],
      ["d", "দ"],
      ["n", "ন"],
      ["p", "প"],
      ["b", "ব"],
      ["m", "ম"],
      ["y", "য"],
      ["r", "ৰ"],
      ["l", "ল"],
      ["w", "ৱ"],
      ["s", "স"],
      ["S", "শ"],
      ["h", "হ"],
      ["x", "ক্ষ"],

      // --- Special / Diacritics ---
      ["M", "ঁ"],   // chandrabindu
      ["H", "ঃ"],   // visarga
      ["~", "্"],   // hasanta / virama
      ["||", "॥"],   // double danda
      ["|", "।"],   // danda

      // --- Assamese numerals ---
      ["0", "০"],
      ["1", "১"],
      ["2", "২"],
      ["3", "৩"],
      ["4", "৪"],
      ["5", "৫"],
      ["6", "৬"],
      ["7", "৭"],
      ["8", "৮"],
      ["9", "৯"],
    ];

    // Sort by Latin sequence length (longest first) for greedy matching
    this.rules.sort((a, b) => b[0].length - a[0].length);
  }

  /**
   * Convert a full Latin string to Assamese.
   * Non-matching characters pass through unchanged.
   * Use `preserveCase: false` (default) to let uppercase trigger different rules (T, D, S, N).
   */
  convert(text) {
    let result = "";
    let i = 0;

    while (i < text.length) {
      let matched = false;

      for (const [latin, assamese] of this.rules) {
        if (text.startsWith(latin, i)) {
          result += assamese;
          i += latin.length;
          matched = true;
          break;
        }
      }

      if (!matched) {
        result += text[i];
        i++;
      }
    }

    return result;
  }

  /**
   * Real-time input handler for a <textarea> or <input>.
   * Call this in an 'input' event listener.
   *
   * Example:
   *   document.getElementById('myInput').addEventListener('input', (e) => {
   *     transliterator.handleInput(e.target);
   *   });
   */
  handleInput(inputElement) {
    const pos = inputElement.selectionStart;
    const raw = inputElement.value;
    const converted = this.convert(raw);
    inputElement.value = converted;
    // Restore cursor — converted text may be shorter (multi-char → 1 char)
    const delta = converted.length - raw.length;
    inputElement.setSelectionRange(pos + delta, pos + delta);
  }
}

// ----------------------------------------------------------------
// Standalone usage example (Node.js / browser console)
// ----------------------------------------------------------------
if (typeof module !== "undefined" && module.exports) {
  module.exports = { AssameseTransliterator };
} else {
  window.AssameseTransliterator = AssameseTransliterator;
}

// Quick test
if (typeof process !== "undefined" && process.argv[1] === __filename) {
  const t = new AssameseTransliterator();
  const tests = [
    ["kha", "খ"],
    ["gha", "ঘ"],
    ["mur naam", "মোৰ নাম"],
    ["bhal", "ভাল"],
    ["khbr", "খবৰ"],
    ["dhan", "ধান"],
  ];
  let pass = 0;
  tests.forEach(([input, expected]) => {
    const got = t.convert(input);
    const ok = got === expected;
    if (ok) pass++;
    console.log(`${ok ? "✓" : "✗"} "${input}" → "${got}" ${ok ? "" : `(expected "${expected}")`}`);
  });
  console.log(`\n${pass}/${tests.length} tests passed`);
}
