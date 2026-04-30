import test from "node:test";
import assert from "node:assert/strict";

import { applyInput, getDefaultRuleSet } from "../src/core/index.js";
import type { ModeState, SurfaceState } from "../src/core/types.js";

function applySequentialInput(
  initialState: SurfaceState,
  modeState: ModeState,
  sequence: Array<{ inputType: "insertText" | "deleteContentBackward"; data: string | null }>
) {
  let state = initialState;

  for (const event of sequence) {
    const patch = applyInput(state, event, modeState);
    state = {
      ...state,
      text: patch.text,
      selectionStart: patch.selectionStart,
      selectionEnd: patch.selectionEnd,
      token: patch.token
    };
  }

  return state;
}

test("applyInput replaces the current token and preserves caret after Assamese conversion", () => {
  const surfaceState: SurfaceState = {
    text: "মুৰ খ",
    selectionStart: 5,
    selectionEnd: 5,
    composition: false,
    surfaceKind: "input",
    token: {
      raw: "kh",
      rangeStart: 4,
      rangeEnd: 5
    }
  };
  const modeState: ModeState = {
    enabled: true,
    ruleSet: getDefaultRuleSet()
  };

  const patch = applyInput(
    surfaceState,
    {
      inputType: "insertText",
      data: "a"
    },
    modeState
  );

  assert.equal(patch.text, "মুৰ খা");
  assert.equal(patch.selectionStart, 6);
  assert.equal(patch.selectionEnd, 6);
});

test("applyInput upgrades an existing Assamese token as the raw latin buffer grows", () => {
  const modeState: ModeState = {
    enabled: true,
    ruleSet: getDefaultRuleSet()
  };

  const state = applySequentialInput(
    {
      text: "",
      selectionStart: 0,
      selectionEnd: 0,
      composition: false,
      surfaceKind: "textarea"
    },
    modeState,
    [
      { inputType: "insertText", data: "k" },
      { inputType: "insertText", data: "h" },
      { inputType: "insertText", data: "a" }
    ]
  );

  assert.equal(state.text, "খা");
  assert.deepEqual(state.token, {
    raw: "kha",
    rangeStart: 0,
    rangeEnd: 2
  });
});

test("applyInput shrinks the live token on backspace instead of deleting the whole Assamese cluster", () => {
  const modeState: ModeState = {
    enabled: true,
    ruleSet: getDefaultRuleSet()
  };

  const state = applySequentialInput(
    {
      text: "",
      selectionStart: 0,
      selectionEnd: 0,
      composition: false,
      surfaceKind: "textarea"
    },
    modeState,
    [
      { inputType: "insertText", data: "k" },
      { inputType: "insertText", data: "h" },
      { inputType: "insertText", data: "a" },
      { inputType: "deleteContentBackward", data: null }
    ]
  );

  assert.equal(state.text, "খ");
  assert.deepEqual(state.token, {
    raw: "kh",
    rangeStart: 0,
    rangeEnd: 1
  });
});

test("applyInput is inert when Assamese mode is disabled", () => {
  const surfaceState: SurfaceState = {
    text: "mur",
    selectionStart: 3,
    selectionEnd: 3,
    composition: false,
    surfaceKind: "textarea"
  };

  const patch = applyInput(
    surfaceState,
    {
      inputType: "insertText",
      data: " "
    },
    {
      enabled: false,
      ruleSet: getDefaultRuleSet()
    }
  );

  assert.equal(patch.text, "mur ");
  assert.equal(patch.selectionStart, 4);
  assert.equal(patch.selectionEnd, 4);
});
