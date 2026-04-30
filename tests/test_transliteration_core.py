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

    def test_dictionary_does_not_override_known_primary_match(self):
        result = self.engine.transliterate("kaa")
        self.assertEqual(result.text, "কা")
        self.assertFalse(result.used_dictionary)


if __name__ == "__main__":
    unittest.main()
