from __future__ import annotations

from dataclasses import dataclass, field
import json
import re
from pathlib import Path

from transliteration_data import (
    AMBIGUOUS_PATTERNS,
    CONSONANTS,
    NUMERALS,
    SPECIALS,
    VOWEL_MATRA,
    VOWEL_STANDALONE,
)


TOKEN_RE = re.compile(r"[A-Za-z~`|0-9]+|[^A-Za-z~`|0-9]+")


@dataclass
class TransliterationResult:
    text: str
    used_dictionary: bool = False
    dictionary_hits: list[str] = field(default_factory=list)


class TransliterationEngine:
    def __init__(self, dictionary_path: Path | None = None):
        self.dictionary_path = dictionary_path or Path(__file__).parent / "data" / "assamese_dictionary.json"
        self.dictionary = self._load_dictionary(self.dictionary_path)
        self.consonants = sorted(CONSONANTS, key=lambda item: -len(item[0]))
        self.vowels = sorted(VOWEL_STANDALONE.items(), key=lambda item: -len(item[0]))
        self.specials = sorted(SPECIALS, key=lambda item: -len(item[0]))
        self.numerals = sorted(NUMERALS, key=lambda item: -len(item[0]))

    def transliterate(self, text: str) -> TransliterationResult:
        chunks: list[str] = []
        used_dictionary = False
        dictionary_hits: list[str] = []

        for token in TOKEN_RE.findall(text):
            if re.fullmatch(r"[A-Za-z~`|0-9]+", token):
                word, assisted = self._transliterate_token(token)
                chunks.append(word)
                if assisted:
                    used_dictionary = True
                    dictionary_hits.append(token)
            else:
                chunks.append(token)

        return TransliterationResult("".join(chunks), used_dictionary, dictionary_hits)

    def convert(self, text: str) -> str:
        return self.transliterate(text).text

    def _transliterate_token(self, token: str) -> tuple[str, bool]:
        primary = self._build_primary_word(token)
        candidates = self._generate_candidates(token, primary)

        if not self.dictionary:
            return primary, False

        if primary in self.dictionary and self._is_ambiguous(token):
            return primary, True

        if primary in self.dictionary:
            return primary, False

        for candidate in candidates:
            if candidate in self.dictionary:
                return candidate, True

        return primary, False

    def _build_primary_word(self, token: str) -> str:
        result: list[str] = []
        i = 0
        last_was_consonant = False

        while i < len(token):
            match = self._match(token, i, self.specials)
            if match:
                latin, char = match
                result.append(char)
                last_was_consonant = False
                i += len(latin)
                continue

            match = self._match(token, i, self.numerals)
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
                    if latin != "a":
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

    def _generate_candidates(self, token: str, primary: str) -> list[str]:
        candidates = [primary]

        if "aa" in token:
            candidates.append(self._build_primary_word(token.replace("aa", "a")))

        if token.endswith("or"):
            candidates.append(self._build_primary_word(token[:-2] + "our"))

        if token.endswith("aal"):
            candidates.append(self._build_primary_word(token[:-3] + "al"))

        seen = set()
        ordered: list[str] = []
        for candidate in candidates:
            if candidate not in seen:
                seen.add(candidate)
                ordered.append(candidate)
        return ordered

    @staticmethod
    def _match(text: str, index: int, rules):
        for latin, assamese in rules:
            if text.startswith(latin, index):
                return latin, assamese
        return None

    @staticmethod
    def _is_ambiguous(token: str) -> bool:
        return any(pattern in token for pattern in AMBIGUOUS_PATTERNS)

    @staticmethod
    def _load_dictionary(path: Path) -> set[str]:
        if not path.exists():
            return set()
        return set(json.loads(path.read_text(encoding="utf-8")))


_DEFAULT_ENGINE = TransliterationEngine()


def convert(text: str) -> str:
    return _DEFAULT_ENGINE.convert(text)
