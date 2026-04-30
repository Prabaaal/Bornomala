# Assamese Phonetic Keyboard — Build Guide

## What's in this package

| File | Purpose |
|---|---|
| `assamese_phonetic.kmn` | Keyman source — compiles to a real OS-level keyboard |
| `assamese_transliterator.js` | Pure JS engine — use in web apps, PWAs, React, etc. |

---

## Option A: Keyman Keyboard (Windows + macOS) ← Recommended

Keyman is free, trusted, and works system-wide — in Word, browsers, everywhere.

### Step 1: Install Keyman Developer
- Download from: https://keyman.com/developer/
- Available for Windows and macOS

### Step 2: Compile the keyboard
1. Open Keyman Developer
2. File → Open → select `assamese_phonetic.kmn`
3. Build → Compile Keyboard
4. This produces `assamese_phonetic.kmx` (Windows) or `assamese_phonetic.kmp`

### Step 3: Install the compiled keyboard
- On Windows: double-click the `.kmp` package file → Keyman installs it
- On macOS: same — double-click `.kmp` → Keyman Desktop installs it
- Switch to it via the Keyman icon in your system tray / menu bar

### Usage
- Press `Ctrl+Alt+K` (Windows) or `Cmd+Opt+K` (macOS) to toggle on/off
- Type normally in any app — your Latin input becomes Assamese

---

## Option B: JavaScript Engine (Web / PWA / Flutter)

Use `assamese_transliterator.js` for any web-based input.

### In a plain HTML page
```html
<script src="assamese_transliterator.js"></script>
<textarea id="box" rows="5" cols="40" placeholder="Type here..."></textarea>
<script>
  const t = new AssameseTransliterator();
  document.getElementById('box').addEventListener('input', e => t.handleInput(e.target));
</script>
```

### In React
```jsx
import { AssameseTransliterator } from './assamese_transliterator';
const t = new AssameseTransliterator();

function AssameseInput() {
  const [value, setValue] = useState('');
  const handleChange = (e) => setValue(t.convert(e.target.value));
  return <textarea value={value} onChange={handleChange} />;
}
```

### In your Flutter PWA (with a WebView or Flutter Web text field)
```dart
// In Flutter Web, use a HtmlElementView wrapping a <textarea>
// and inject the JS engine. Or call t.convert() from JS interop.
import 'package:flutter_js/flutter_js.dart';
// Load assamese_transliterator.js, then:
// jsRuntime.evaluate("new AssameseTransliterator().convert('kha')") → "খ"
```

---

## Transliteration rules summary

## Smart transliteration mode

- Bare `a` after a consonant now uses the inherent vowel by default, so `kha` becomes `খ`
- Explicit long vowels still use matras, so `kaa` becomes `কা`
- Word tokens are evaluated independently, which improves forms like `mor` → `মোৰ`
- A small offline Assamese dictionary is used only as a fallback for ambiguous spellings
- The desktop app status bar shows when dictionary assistance was used

### Vowels
| Type | Latin | Assamese |
|---|---|---|
| a  | `a`  | অ |
| aa | `aa` | আ |
| i  | `i`  | ই |
| ii | `ii` | ঈ |
| u  | `u`  | উ |
| uu | `uu` | ঊ |
| e  | `e`  | এ |
| oi | `oi` | ঐ |
| o  | `o`  | ও |
| ou | `ou` | ঔ |
| ri | `ri` | ঋ |

### Key consonant pairs
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

### Special
| Latin | Assamese | Meaning |
|---|---|---|
| `~` | ্ | Hasanta (virama) |
| `M` | ঁ | Chandrabindu |
| `H` | ঃ | Visarga |
| `\|` | । | Danda |
| `\|\|` | ॥ | Double danda |
| `` ` `` | ZWJ | For conjuncts |

---

## How conjuncts work

Assamese uses hasanta (`্`) to join consonants:
- Type `k~t` → ক্ত (kta conjunct)
- Type `p~r` → প্ৰ (pra conjunct)
- Type `~` alone acts as virama to suppress the inherent vowel

---

## Extending the keyboard

To add new rules to the `.kmn` file, follow this pattern:
```
+ "XX" > U+XXXX   c comment
```

To add rules to the JS engine, add to the `this.rules` array:
```js
["latin", "অসমীয়া_char"],
```
Rules are auto-sorted by length, so insertion order doesn't matter.

---

## Resources
- Keyman Developer: https://keyman.com/developer/
- Keyman Documentation: https://help.keyman.com/developer/
- Assamese Unicode block: U+0980–U+09FF
- Google Input Tools reference: https://www.google.com/inputtools/
