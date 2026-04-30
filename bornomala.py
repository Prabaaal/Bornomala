#!/usr/bin/env python3
"""
Bornomala — Assamese Phonetic Typing Tool
==========================================
A floating macOS app for typing Assamese using phonetic Latin input.
Double-click launch.command or run: python3 bornomala.py

Features:
- Live phonetic transliteration (Latin → Assamese Unicode)
- Proper vowel-sign (matra) handling after consonants
- Hasanta / virama support for conjuncts
- Quick-reference table with click-to-insert
- Always-on-top floating window
- Copy to clipboard

Author: Built for Prabal Gogoi
"""

import tkinter as tk
from tkinter import font as tkfont
from transliteration_core import TransliterationEngine


ENGINE = TransliterationEngine()


# ─────────────────────────────────────────────────────────────────
#  COLOUR / STYLE TOKENS
# ─────────────────────────────────────────────────────────────────

BG        = "#0D0D14"
SURFACE   = "#161621"
SURFACE2  = "#1f1f2e"
BORDER    = "#2a2a3d"
ACCENT    = "#8b5cf6"
ACCENT2   = "#7c3aed"
ACCENT_DIM= "#4c1d95"
TEXT      = "#e2e2f0"
SUBTEXT   = "#7070a0"
GREEN     = "#22c55e"
ORANGE    = "#f97316"
TEAL      = "#14b8a6"
FONT_UI   = "Helvetica Neue"

# ─────────────────────────────────────────────────────────────────
#  REFERENCE TABLE DATA
# ─────────────────────────────────────────────────────────────────

REF_VOWELS = [
    ("a",  "অ",  "aa", "আ"),
    ("i",  "ই",  "ii", "ঈ"),
    ("u",  "উ",  "uu", "ঊ"),
    ("e",  "এ",  "o",  "ও"),
    ("oi", "ঐ",  "ou", "ঔ"),
    ("ri", "ঋ",  "~",  "্"),
]

REF_CONSONANTS = [
    ("k",  "ক",  "kh", "খ"),
    ("g",  "গ",  "gh", "ঘ"),
    ("c",  "চ",  "ch", "ছ"),
    ("j",  "জ",  "jh", "ঝ"),
    ("t",  "ত",  "th", "থ"),
    ("d",  "দ",  "dh", "ধ"),
    ("T",  "ট",  "Th", "ঠ"),
    ("D",  "ড",  "Dh", "ঢ"),
    ("n",  "ন",  "N",  "ণ"),
    ("p",  "প",  "ph", "ফ"),
    ("b",  "ব",  "bh", "ভ"),
    ("m",  "ম",  "y",  "য"),
    ("r",  "ৰ",  "rr", "ড়"),
    ("l",  "ল",  "w",  "ৱ"),
    ("s",  "স",  "sh", "শ"),
    ("S",  "শ",  "Sh", "ষ"),
    ("h",  "হ",  "ng", "ঙ"),
    ("x",  "ক্ষ", "gy", "জ্ঞ"),
]

REF_SPECIAL = [
    ("M",  "ঁ",  "H",  "ঃ"),
    ("|",  "।",  "||", "॥"),
    ("~",  "্",  "`",  "ZWJ"),
]

# ─────────────────────────────────────────────────────────────────
#  APP
# ─────────────────────────────────────────────────────────────────

class BornomalaApp:
    def __init__(self, root: tk.Tk):
        self.root = root
        self._placeholder_active = False
        self._last_raw = ""
        self._setup_window()
        self._setup_fonts()
        self._build_ui()

    # ── Window ────────────────────────────────
    def _setup_window(self):
        self.root.title("Bornomala — বৰ্ণমালা Typing Tool")
        self.root.configure(bg=BG)
        self.root.minsize(720, 540)
        self.root.attributes("-topmost", True)
        # Center on screen
        w, h = 860, 700
        self.root.update_idletasks()
        sw = self.root.winfo_screenwidth()
        sh = self.root.winfo_screenheight()
        self.root.geometry(f"{w}x{h}+{(sw-w)//2}+{(sh-h)//2}")

    # ── Fonts ─────────────────────────────────
    def _setup_fonts(self):
        self.f_title    = tkfont.Font(family=FONT_UI,           size=20, weight="bold")
        self.f_subtitle = tkfont.Font(family=FONT_UI,           size=10)
        self.f_label    = tkfont.Font(family=FONT_UI,           size=9,  weight="bold")
        self.f_input    = tkfont.Font(family=FONT_UI,           size=15)
        self.f_output   = tkfont.Font(family="Arial Unicode MS", size=20, weight="bold")
        self.f_ref_lat  = tkfont.Font(family="Courier New",      size=11, weight="bold")
        self.f_ref_as   = tkfont.Font(family="Arial Unicode MS", size=13)
        self.f_btn      = tkfont.Font(family=FONT_UI,           size=11, weight="bold")
        self.f_status   = tkfont.Font(family=FONT_UI,           size=10)
        self.f_tip      = tkfont.Font(family=FONT_UI,           size=9)
        self.f_section  = tkfont.Font(family=FONT_UI,           size=9,  weight="bold")

    # ── UI ────────────────────────────────────
    def _build_ui(self):
        # Header
        hdr = tk.Frame(self.root, bg=BG)
        hdr.pack(fill="x", padx=20, pady=(16, 0))

        tk.Label(hdr, text="বৰ্ণমালা", font=self.f_title,
                 bg=BG, fg=ACCENT).pack(side="left")
        tk.Label(hdr, text="  Assamese Phonetic Typing Tool",
                 font=self.f_subtitle, bg=BG, fg=SUBTEXT).pack(side="left", pady=(6, 0))

        self.topmost_var = tk.BooleanVar(value=True)
        chk = tk.Checkbutton(hdr, text="📌 on top", variable=self.topmost_var,
                              command=self._toggle_topmost,
                              bg=BG, fg=SUBTEXT, selectcolor=SURFACE2,
                              activebackground=BG, activeforeground=TEXT,
                              relief="flat", cursor="hand2", font=self.f_tip)
        chk.pack(side="right", pady=(6, 0))

        tk.Frame(self.root, bg=BORDER, height=1).pack(fill="x", padx=20, pady=(10, 0))

        # Main body
        body = tk.Frame(self.root, bg=BG)
        body.pack(fill="both", expand=True, padx=20, pady=12)
        body.columnconfigure(0, weight=5)
        body.columnconfigure(1, weight=3)
        body.rowconfigure(0, weight=1)

        self._build_left(body)
        self._build_right(body)

        # Status bar
        self.status_var = tk.StringVar(value="Ready — start typing phonetics in the box above")
        tk.Label(self.root, textvariable=self.status_var,
                 bg=SURFACE2, fg=SUBTEXT, font=self.f_status,
                 anchor="w", padx=16, pady=5).pack(fill="x", side="bottom")

    def _build_left(self, parent):
        left = tk.Frame(parent, bg=BG)
        left.grid(row=0, column=0, sticky="nsew", padx=(0, 10))
        left.rowconfigure(1, weight=2)
        left.rowconfigure(3, weight=3)
        left.columnconfigure(0, weight=1)

        # Latin input label
        self._label(left, "TYPE PHONETICS (Latin keys)  ⬇").grid(
            row=0, column=0, sticky="w", pady=(0, 4))

        # Input box
        fc1 = tk.Frame(left, bg=ACCENT, padx=1, pady=1)
        fc1.grid(row=1, column=0, sticky="nsew")
        self.input_text = tk.Text(
            fc1, font=self.f_input,
            bg=SURFACE, fg=TEXT, insertbackground=ACCENT,
            relief="flat", bd=10, wrap="word", undo=True,
        )
        self.input_text.pack(fill="both", expand=True)
        self._show_placeholder()
        self.input_text.bind("<<Modified>>",   self._on_change)
        self.input_text.bind("<FocusIn>",      self._clear_placeholder)
        self.input_text.bind("<FocusOut>",     self._maybe_placeholder)
        self.input_text.bind("<Control-a>",    lambda e: (self.input_text.tag_add("sel","1.0","end"), "break")[1])
        self.input_text.focus_set()

        # Output label
        self._label(left, "ASSAMESE OUTPUT  ⬇").grid(
            row=2, column=0, sticky="w", pady=(10, 4))

        # Output box
        fc2 = tk.Frame(left, bg=ACCENT, padx=1, pady=1)
        fc2.grid(row=3, column=0, sticky="nsew")
        self.output_text = tk.Text(
            fc2, font=self.f_output,
            bg=SURFACE2, fg=TEXT, insertbackground=ACCENT,
            relief="flat", bd=10, wrap="word", state="disabled",
        )
        self.output_text.pack(fill="both", expand=True)

        # Buttons
        btns = tk.Frame(left, bg=BG)
        btns.grid(row=4, column=0, sticky="ew", pady=(10, 0))
        for col in range(3):
            btns.columnconfigure(col, weight=1)

        self._btn(btns, "📋  Copy Assamese", self._copy_output, ACCENT,   TEXT,    0)
        self._btn(btns, "🔄  Clear",          self._clear_all,   SURFACE2, SUBTEXT, 1)
        self._btn(btns, "📝  Copy Latin",     self._copy_input,  SURFACE2, SUBTEXT, 2)

    def _build_right(self, parent):
        right = tk.Frame(parent, bg=BG)
        right.grid(row=0, column=1, sticky="nsew")
        right.rowconfigure(1, weight=1)
        right.columnconfigure(0, weight=1)

        self._label(right, "QUICK REFERENCE  (click to insert)").grid(
            row=0, column=0, sticky="w", pady=(0, 4))

        canvas = tk.Canvas(right, bg=SURFACE, highlightthickness=0, bd=0)
        sb = tk.Scrollbar(right, orient="vertical", command=canvas.yview)
        canvas.configure(yscrollcommand=sb.set)
        canvas.grid(row=1, column=0, sticky="nsew")
        sb.grid(row=1, column=1, sticky="ns")

        inner = tk.Frame(canvas, bg=SURFACE)
        win_id = canvas.create_window((0, 0), window=inner, anchor="nw")

        def _resize(e):
            canvas.configure(scrollregion=canvas.bbox("all"))
        def _fit(e):
            canvas.itemconfig(win_id, width=e.width)

        inner.bind("<Configure>", _resize)
        canvas.bind("<Configure>", _fit)
        canvas.bind_all("<MouseWheel>", lambda e: canvas.yview_scroll(-(e.delta // 120), "units"))

        row = 0
        self._section_hdr(inner, "— Vowels —", row); row += 1
        for entry in REF_VOWELS:
            self._ref_row(inner, *entry, row=row); row += 1

        self._section_hdr(inner, "— Consonants —", row); row += 1
        for entry in REF_CONSONANTS:
            self._ref_row(inner, *entry, row=row); row += 1

        self._section_hdr(inner, "— Special Characters —", row); row += 1
        for entry in REF_SPECIAL:
            self._ref_row(inner, *entry, row=row); row += 1

        # Tips
        tips_f = tk.Frame(inner, bg=ACCENT_DIM, padx=8, pady=6)
        tips_f.grid(row=row+1, column=0, columnspan=4, sticky="ew", padx=4, pady=(10, 4))
        for tip in [
            "💡  k~t → ক্ত  (~ = virama/hasanta)",
            "💡  T, D, N, S need Shift key",
            "💡  Space & punctuation pass through",
            "💡  Click any row above to insert it",
        ]:
            tk.Label(tips_f, text=tip, bg=ACCENT_DIM, fg="#c4b5fd",
                     font=self.f_tip, anchor="w").pack(fill="x")

    # ── Helpers ───────────────────────────────
    def _label(self, parent, text):
        return tk.Label(parent, text=text, font=self.f_label,
                        bg=BG, fg=SUBTEXT, anchor="w")

    def _section_hdr(self, parent, text, row):
        tk.Label(parent, text=text, font=self.f_section,
                 bg=SURFACE, fg=ORANGE, anchor="center"
                 ).grid(row=row, column=0, columnspan=4,
                        sticky="ew", padx=4, pady=(8, 2))

    def _ref_row(self, parent, l1, a1, l2, a2, row):
        bg = SURFACE if row % 2 == 0 else SURFACE2
        cells = [
            (l1, self.f_ref_lat, ACCENT, "e"),
            (a1, self.f_ref_as,  TEXT,   "w"),
            (l2, self.f_ref_lat, ACCENT, "e"),
            (a2, self.f_ref_as,  TEXT,   "w"),
        ]
        pads = [(4, 2), (0, 8), (8, 2), (0, 4)]
        for col, ((txt, fnt, fg, anc), (px_l, px_r)) in enumerate(zip(cells, pads)):
            lbl = tk.Label(parent, text=txt, font=fnt,
                           bg=bg, fg=fg, width=4, anchor=anc, cursor="hand2")
            lbl.grid(row=row, column=col, padx=(px_l, px_r), pady=1, sticky="ew")
            latin = l1 if col < 2 else l2
            lbl.bind("<Button-1>", lambda e, lt=latin: self._insert_latin(lt))
            lbl.bind("<Enter>",    lambda e, w=lbl: w.config(bg=BORDER))
            lbl.bind("<Leave>",    lambda e, w=lbl, b=bg: w.config(bg=b))

    def _btn(self, parent, text, cmd, bg, fg, col):
        b = tk.Label(parent, text=text, font=self.f_btn, bg=bg, fg=fg,
                     padx=10, pady=7, cursor="hand2", anchor="center")
        b.grid(row=0, column=col, padx=(0 if col == 0 else 6, 0), sticky="ew")
        b.bind("<Button-1>", lambda e: cmd())
        b.bind("<Enter>",    lambda e: b.config(bg=ACCENT2 if bg == ACCENT else BORDER))
        b.bind("<Leave>",    lambda e: b.config(bg=bg))

    # ── Input / conversion ────────────────────
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
            hits = ", ".join(result.dictionary_hits)
            self.status_var.set(f"✓  Dictionary-assisted output for: {hits}")
        else:
            c = len([ch for ch in assamese if ch.strip()])
            self.status_var.set(f"✓  {len(raw)} Latin chars  →  {c} Assamese chars")
        self.input_text.edit_modified(False)

    def _get_raw(self):
        val = self.input_text.get("1.0", "end-1c")
        return "" if self._placeholder_active else val

    def _show_placeholder(self):
        self.input_text.delete("1.0", "end")
        self.input_text.insert("1.0", "Type here:  namaskar  amar naam...")
        self.input_text.config(fg="#444460")
        self._placeholder_active = True

    def _clear_placeholder(self, event=None):
        if self._placeholder_active:
            self.input_text.delete("1.0", "end")
            self.input_text.config(fg=TEXT)
            self._placeholder_active = False

    def _maybe_placeholder(self, event=None):
        if not self.input_text.get("1.0", "end-1c").strip():
            self._show_placeholder()

    def _insert_latin(self, latin):
        self._clear_placeholder()
        self.input_text.insert("insert", latin)
        self.input_text.focus_set()
        self._on_change()

    def _copy_output(self):
        txt = self.output_text.get("1.0", "end-1c")
        if txt.strip():
            self.root.clipboard_clear()
            self.root.clipboard_append(txt)
            self.status_var.set("✓  Assamese text copied to clipboard!")

    def _copy_input(self):
        txt = self._get_raw()
        if txt.strip():
            self.root.clipboard_clear()
            self.root.clipboard_append(txt)
            self.status_var.set("✓  Latin text copied to clipboard!")

    def _clear_all(self):
        self._last_raw = ""
        self._show_placeholder()
        self.output_text.config(state="normal")
        self.output_text.delete("1.0", "end")
        self.output_text.config(state="disabled")
        self.status_var.set("Cleared — start typing!")

    def _toggle_topmost(self):
        self.root.attributes("-topmost", self.topmost_var.get())


# ─────────────────────────────────────────────────────────────────
#  ENTRY POINT
# ─────────────────────────────────────────────────────────────────

def main():
    root = tk.Tk()
    BornomalaApp(root)
    root.mainloop()


if __name__ == "__main__":
    main()
