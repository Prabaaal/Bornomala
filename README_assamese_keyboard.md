# Bornomala

Developer-first Assamese phonetic typing toolkit.

Bornomala gives you multiple ways to type Assamese from Latin phonetics:

- a system-wide Keyman keyboard
- a reusable JavaScript transliteration engine
- a lightweight Chrome extension you can load unpacked
- a desktop Python app for local typing workflows

This README is optimized for getting a developer productive quickly: what is in the repo, which path to choose, how to run it, and how to verify that it works.

## Choose Your Path

| If you want to... | Use this | Main files |
|---|---|---|
| Type Assamese system-wide in apps like Word or browsers | Keyman keyboard | `assamese_phonetic.kmn`, `assamese_phonetic.kmp`, `assamese_phonetic.kmx` |
| Add Assamese phonetic input to a web app or script | JavaScript engine | `assamese_transliterator.js` |
| Type directly inside webpage fields in Chrome | Chrome extension | `chrome-extension/` |
| Use a local floating typing tool on desktop | Python app | `bornomala.py`, `dist/Bornomala` |

## Repo Map

| Path | Purpose |
|---|---|
| `assamese_phonetic.kmn` | Source for the Keyman keyboard |
| `assamese_transliterator.js` | Shared JavaScript transliteration engine |
| `transliteration_core.py` | Canonical Python transliteration engine |
| `transliteration_data.py` | Shared transliteration tables and constants |
| `data/assamese_dictionary.json` | Offline fallback dictionary for ambiguous spellings |
| `bornomala.py` | Desktop app entry point |
| `chrome-extension/` | Supported unpacked Chrome extension |
| `tests/` | Python and Chrome extension tests |
| `scripts/run_js_transliteration_tests.js` | JavaScript transliteration regression test runner |
| `browser-extension/` | Experimental TypeScript prototype kept for reference, not the recommended setup path |

## Quickstart

### 1. Clone and inspect

```bash
git clone https://github.com/Prabaaal/Bornomala.git
cd Bornomala
```

### 2. Pick the workflow you need

#### Keyman keyboard

1. Install [Keyman Developer](https://keyman.com/developer/).
2. Open `assamese_phonetic.kmn`.
3. Compile the keyboard.
4. Install the generated `.kmp` package in Keyman Desktop.

#### JavaScript engine

Drop `assamese_transliterator.js` into a webpage or import it in Node/browser code.

```html
<script src="assamese_transliterator.js"></script>
<textarea id="box" rows="5" cols="40" placeholder="Type Assamese phonetically"></textarea>
<script>
  const engine = new AssameseTransliterator();
  document.getElementById("box").addEventListener("input", (event) => {
    engine.handleInput(event.target);
  });
</script>
```

#### Chrome extension

1. Open `chrome://extensions`
2. Turn on Developer mode
3. Click `Load unpacked`
4. Select the `chrome-extension` folder
5. Open the extension popup
6. Enable `Assamese Typing`

Supported targets in v1:

- `input[type="text"]`
- `input[type="search"]`
- `input[type="email"]`
- `input[type="url"]`
- `input[type="tel"]`
- `textarea`
- basic `contenteditable` regions

Not targeted yet:

- Google Docs
- Notion-style rich editors
- per-site toggles

#### Desktop app

Run the Python app directly:

```bash
python3 bornomala.py
```

Or launch the packaged app from `dist/Bornomala` if you already have the built artifact available on your machine.

## Transliteration Behavior

Bornomala now uses context-aware transliteration logic instead of a simple character-for-character replacement.

### Smart mode

- Bare `a` after a consonant uses the inherent vowel by default.
- `kha` becomes `খ`, not `খা`.
- Explicit long vowels still use matras, so `kaa` becomes `কা`.
- Words are evaluated token by token, which improves output like `mor` -> `মোৰ`.
- An offline Assamese dictionary is used only as a fallback for ambiguous spellings.

### Keyman parity

- The Keyman source mirrors the rule-based inherent-vowel behavior used by the updated app.
- Example: `kha` should produce `খ`, while `k` followed by `aa` should produce `কা`.
- Dictionary-assisted fallback is part of the app and JS engine path, not the installed Keyman keyboard path.
- Changes to `assamese_phonetic.kmn` do not update an installed keyboard automatically; rebuild and reinstall the package after source edits.

## Rules Reference

### Vowels

| Latin | Assamese |
|---|---|
| `a` | অ |
| `aa` | আ |
| `i` | ই |
| `ii` | ঈ |
| `u` | উ |
| `uu` | ঊ |
| `e` | এ |
| `oi` | ঐ |
| `o` | ও |
| `ou` | ঔ |
| `ri` | ঋ |

### Common consonants

| Latin | Assamese | Latin | Assamese |
|---|---|---|---|
| `k` | ক | `kh` | খ |
| `g` | গ | `gh` | ঘ |
| `c` | চ | `ch` | ছ |
| `j` | জ | `jh` | ঝ |
| `T` | ট | `Th` | ঠ |
| `D` | ড | `Dh` | ঢ |
| `t` | ত | `th` | থ |
| `d` | দ | `dh` | ধ |
| `p` | প | `ph` | ফ |
| `b` | ব | `bh` | ভ |
| `s` | স | `sh` | শ |
| `S` | শ | `Sh` | ষ |

### Special keys

| Latin | Assamese | Meaning |
|---|---|---|
| `~` | ্ | Virama / hasanta |
| `M` | ঁ | Chandrabindu |
| `H` | ঃ | Visarga |
| `|` | । | Danda |
| `||` | ॥ | Double danda |
| `` ` `` | ZWJ | For conjunct shaping |

### Conjunct examples

- `k~t` -> ক্ত
- `p~r` -> প্ৰ
- `~` alone suppresses the inherent vowel

## Development Notes

### Add or change Keyman rules

Use this pattern in `assamese_phonetic.kmn`:

```text
+ "XX" > U+XXXX   c comment
```

### Add or change JavaScript rules

Update the transliteration tables in `assamese_transliterator.js`.

```js
["latin", "অসমীয়া_char"];
```

The engine sorts rule groups longest-first, so longer digraphs win over shorter matches.

## Verify Your Changes

### Python transliteration tests

```bash
python3 -m unittest tests/test_transliteration_core.py -v
```

### JavaScript transliteration regression tests

```bash
node scripts/run_js_transliteration_tests.js
```

### Chrome extension tests

```bash
node --test tests/chrome-extension/content.test.js tests/chrome-extension/popup.test.js
```

### Experimental browser-extension workspace

There is also a TypeScript prototype in `browser-extension/`. It is not the recommended path for quick setup, but if you want to inspect it:

```bash
cd browser-extension
npm install
npm run typecheck
npm test
```

## Resources

- [Keyman Developer](https://keyman.com/developer/)
- [Keyman documentation](https://help.keyman.com/developer/)
- Assamese Unicode block: `U+0980-U+09FF`
- [Google Input Tools](https://www.google.com/inputtools/)
