/**
 * Assamese Phonetic Transliterator
 * ------------------------------------
 * Drop-in JS engine. Works in browsers, Node.js, React, Flutter WebView.
 * Converts Latin phonetic input -> Assamese Unicode in real-time.
 */

class AssameseTransliterator {
  constructor(dictionary = []) {
    this.dictionary = new Set(dictionary);
    this.tokenRegex = /[A-Za-z~`|0-9]+|[^A-Za-z~`|0-9]+/g;

    this.vowels = [
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

    this.consonants = [
      ["kh", "খ"], ["gh", "ঘ"], ["ng", "ঙ"],
      ["ch", "ছ"], ["jh", "ঝ"], ["nj", "ঞ"], ["ny", "ঞ"],
      ["Th", "ঠ"], ["Dh", "ঢ"], ["th", "থ"], ["dh", "ধ"],
      ["ph", "ফ"], ["bh", "ভ"], ["sh", "শ"], ["Sh", "ষ"],
      ["rr", "ড়"], ["rh", "ঢ়"], ["gy", "জ্ঞ"], ["kS", "ক্ষ"],
      ["k", "ক"], ["g", "গ"], ["c", "চ"], ["j", "জ"],
      ["T", "ট"], ["D", "ড"], ["N", "ণ"], ["t", "ত"],
      ["d", "দ"], ["n", "ন"], ["p", "প"], ["b", "ব"],
      ["m", "ম"], ["y", "য"], ["r", "ৰ"], ["l", "ল"],
      ["w", "ৱ"], ["s", "স"], ["S", "শ"], ["h", "হ"],
      ["x", "ক্ষ"], ["v", "ভ"], ["f", "ফ"], ["z", "জ"],
      ["q", "ক"],
    ];

    this.specials = [
      ["||", "॥"],
      ["|", "।"],
      ["~", "্"],
      ["`", "\u200D"],
      ["M", "ঁ"],
      ["H", "ঃ"],
    ];

    this.numerals = [
      ["0", "০"], ["1", "১"], ["2", "২"], ["3", "৩"], ["4", "৪"],
      ["5", "৫"], ["6", "৬"], ["7", "৭"], ["8", "৮"], ["9", "৯"],
    ];

    const byLength = (a, b) => b[0].length - a[0].length;
    this.vowels.sort(byLength);
    this.consonants.sort(byLength);
    this.specials.sort(byLength);
    this.numerals.sort(byLength);
  }

  convert(text) {
    return this.transliterate(text).text;
  }

  transliterate(text) {
    const parts = [];
    const dictionaryHits = [];

    for (const token of text.match(this.tokenRegex) || []) {
      if (/^[A-Za-z~`|0-9]+$/.test(token)) {
        const part = this.transliterateToken(token);
        parts.push(part.text);
        if (part.usedDictionary) {
          dictionaryHits.push(token);
        }
      } else {
        parts.push(token);
      }
    }

    return {
      text: parts.join(""),
      usedDictionary: dictionaryHits.length > 0,
      dictionaryHits,
    };
  }

  transliterateToken(token) {
    const primary = this.buildPrimaryWord(token);
    const candidates = this.generateCandidates(token, primary);

    if (this.dictionary.size === 0) {
      return { text: primary, usedDictionary: false };
    }

    if (this.dictionary.has(primary) && this.isAmbiguous(token)) {
      return { text: primary, usedDictionary: true };
    }

    if (this.dictionary.has(primary)) {
      return { text: primary, usedDictionary: false };
    }

    for (const candidate of candidates) {
      if (this.dictionary.has(candidate)) {
        return { text: candidate, usedDictionary: true };
      }
    }

    return { text: primary, usedDictionary: false };
  }

  buildPrimaryWord(token) {
    const result = [];
    let i = 0;
    let lastWasConsonant = false;

    while (i < token.length) {
      const match =
        this.matchRule(token, i, this.specials) ||
        this.matchRule(token, i, this.numerals);
      if (match) {
        const [latin, assamese] = match;
        result.push(assamese);
        lastWasConsonant = false;
        i += latin.length;
        continue;
      }

      const consonant = this.matchRule(token, i, this.consonants);
      if (consonant) {
        const [latin, assamese] = consonant;
        result.push(assamese);
        lastWasConsonant = true;
        i += latin.length;
        continue;
      }

      const vowel = this.matchRule(token, i, this.vowels);
      if (vowel) {
        const [latin, assamese] = vowel;
        if (lastWasConsonant) {
          if (latin !== "a") {
            result.push(this.matras[latin] || assamese);
          }
        } else {
          result.push(assamese);
        }
        lastWasConsonant = false;
        i += latin.length;
        continue;
      }

      result.push(token[i]);
      lastWasConsonant = false;
      i += 1;
    }

    return result.join("");
  }

  generateCandidates(token, primary) {
    const candidates = [primary];

    if (token.includes("aa")) {
      candidates.push(this.buildPrimaryWord(token.replace("aa", "a")));
    }

    if (token.endsWith("or")) {
      candidates.push(this.buildPrimaryWord(`${token.slice(0, -2)}our`));
    }

    if (token.endsWith("aal")) {
      candidates.push(this.buildPrimaryWord(`${token.slice(0, -3)}al`));
    }

    return [...new Set(candidates)];
  }

  isAmbiguous(token) {
    return ["aal", "oi", "ou", "ri"].some((pattern) => token.includes(pattern));
  }

  matchRule(text, index, rules) {
    for (const [latin, assamese] of rules) {
      if (text.startsWith(latin, index)) {
        return [latin, assamese];
      }
    }
    return null;
  }

  handleInput(inputElement) {
    const pos = inputElement.selectionStart;
    const raw = inputElement.value;
    const converted = this.convert(raw);
    inputElement.value = converted;
    const delta = converted.length - raw.length;
    inputElement.setSelectionRange(pos + delta, pos + delta);
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { AssameseTransliterator };
} else {
  window.AssameseTransliterator = AssameseTransliterator;
}
