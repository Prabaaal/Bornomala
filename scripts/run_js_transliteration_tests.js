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
