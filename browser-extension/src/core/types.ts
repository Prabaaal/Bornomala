export type SurfaceKind =
  | "input"
  | "textarea"
  | "contenteditable"
  | "monaco"
  | "codemirror";

export interface Rule {
  latin: string;
  assamese: string;
  kind: "consonant" | "vowel" | "special" | "numeral";
  matra?: string;
}

export interface RuleSet {
  version: string;
  rules: Rule[];
}

export interface TransliterationResult {
  text: string;
}

export interface SurfaceState {
  text: string;
  selectionStart: number;
  selectionEnd: number;
  composition: boolean;
  surfaceKind: SurfaceKind;
  token?: LiveToken;
}

export interface InputEventSnapshot {
  inputType:
    | "insertText"
    | "deleteContentBackward"
    | "deleteContentForward"
    | "insertFromPaste";
  data: string | null;
}

export interface EditPatch {
  text: string;
  selectionStart: number;
  selectionEnd: number;
  token?: LiveToken;
}

export interface ModeState {
  enabled: boolean;
  ruleSet: RuleSet;
}

export interface SiteActivationState {
  enabled: boolean;
  updatedAt: number;
}

export interface LiveToken {
  raw: string;
  rangeStart: number;
  rangeEnd: number;
}

export interface EditorSurfaceAdapter {
  detect(target: EventTarget | null): SurfaceKind | null;
  attach(
    target: EventTarget,
    apply: (state: SurfaceState, event: InputEventSnapshot, mode: ModeState) => EditPatch,
    mode: ModeState
  ): () => void;
  applyInput(event: InputEventSnapshot, surfaceState: SurfaceState): EditPatch;
}
