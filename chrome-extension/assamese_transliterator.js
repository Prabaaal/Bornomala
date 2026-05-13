/**
 * Bundled Bornomala transliterator for the Chrome extension.
 * This keeps the extension self-contained while preserving the existing API.
 */

class AssameseTransliterator {
  constructor() {
    this.rules = [
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
      ["M", "ঁ"],
      ["H", "ঃ"],
      ["~", "্"],
      ["||", "॥"],
      ["|", "।"],
      ["0", "০"],
      ["1", "১"],
      ["2", "২"],
      ["3", "৩"],
      ["4", "৪"],
      ["5", "৫"],
      ["6", "৬"],
      ["7", "৭"],
      ["8", "৮"],
      ["9", "৯"]
    ];

    this.rules.sort((a, b) => b[0].length - a[0].length);
  }

  convert(text) {
    let result = "";
    let index = 0;

    while (index < text.length) {
      let matched = false;

      for (const [latin, assamese] of this.rules) {
        if (text.startsWith(latin, index)) {
          result += assamese;
          index += latin.length;
          matched = true;
          break;
        }
      }

      if (!matched) {
        result += text[index];
        index += 1;
      }
    }

    return result;
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { AssameseTransliterator };
} else {
  globalThis.AssameseTransliterator = AssameseTransliterator;
}
