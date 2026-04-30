import { transliterate } from "./transliterate.js";
import type {
  EditPatch,
  InputEventSnapshot,
  LiveToken,
  ModeState,
  SurfaceState
} from "./types.js";

const tokenCharacterPattern = /^[A-Za-z0-9~`|]$/;

function isTokenCharacter(value: string | null): value is string {
  return typeof value === "string" && tokenCharacterPattern.test(value);
}

function findRawToken(
  text: string,
  caret: number
): LiveToken | undefined {
  let start = caret;

  while (start > 0 && tokenCharacterPattern.test(text[start - 1] ?? "")) {
    start -= 1;
  }

  if (start === caret) {
    return undefined;
  }

  return {
    raw: text.slice(start, caret),
    rangeStart: start,
    rangeEnd: caret
  };
}

function replaceRange(text: string, start: number, end: number, value: string): string {
  return `${text.slice(0, start)}${value}${text.slice(end)}`;
}

function getActiveToken(surfaceState: SurfaceState): LiveToken | undefined {
  if (
    !surfaceState.token ||
    surfaceState.selectionStart !== surfaceState.selectionEnd ||
    surfaceState.selectionStart !== surfaceState.token.rangeEnd
  ) {
    return undefined;
  }

  return surfaceState.token;
}

function applyNativeEdit(
  text: string,
  selectionStart: number,
  selectionEnd: number,
  event: InputEventSnapshot
): EditPatch {
  if (event.inputType === "deleteContentBackward") {
    if (selectionStart !== selectionEnd) {
      const nextText = `${text.slice(0, selectionStart)}${text.slice(selectionEnd)}`;
      return { text: nextText, selectionStart, selectionEnd: selectionStart, token: undefined };
    }

    const nextStart = Math.max(0, selectionStart - 1);
    const nextText = `${text.slice(0, nextStart)}${text.slice(selectionEnd)}`;
    return { text: nextText, selectionStart: nextStart, selectionEnd: nextStart, token: undefined };
  }

  if (event.inputType === "deleteContentForward") {
    if (selectionStart !== selectionEnd) {
      const nextText = `${text.slice(0, selectionStart)}${text.slice(selectionEnd)}`;
      return { text: nextText, selectionStart, selectionEnd: selectionStart, token: undefined };
    }

    const nextText = `${text.slice(0, selectionStart)}${text.slice(selectionStart + 1)}`;
    return { text: nextText, selectionStart, selectionEnd: selectionStart, token: undefined };
  }

  const insert = event.data ?? "";
  const nextText = `${text.slice(0, selectionStart)}${insert}${text.slice(selectionEnd)}`;
  const nextCaret = selectionStart + insert.length;

  return {
    text: nextText,
    selectionStart: nextCaret,
    selectionEnd: nextCaret,
    token: undefined
  };
}

export function applyInput(
  surfaceState: SurfaceState,
  event: InputEventSnapshot,
  modeState: ModeState
): EditPatch {
  const nativePatch = applyNativeEdit(
    surfaceState.text,
    surfaceState.selectionStart,
    surfaceState.selectionEnd,
    event
  );

  if (!modeState.enabled || surfaceState.composition || event.inputType === "insertFromPaste") {
    return { ...nativePatch, token: undefined };
  }

  const activeToken = getActiveToken(surfaceState);

  if (event.inputType === "deleteContentBackward" && activeToken) {
    const nextRaw = activeToken.raw.slice(0, -1);

    if (!nextRaw) {
      return {
        text: replaceRange(surfaceState.text, activeToken.rangeStart, activeToken.rangeEnd, ""),
        selectionStart: activeToken.rangeStart,
        selectionEnd: activeToken.rangeStart,
        token: undefined
      };
    }

    const nextTokenText = transliterate(nextRaw, modeState.ruleSet).text;
    const nextRangeEnd = activeToken.rangeStart + nextTokenText.length;

    return {
      text: replaceRange(surfaceState.text, activeToken.rangeStart, activeToken.rangeEnd, nextTokenText),
      selectionStart: nextRangeEnd,
      selectionEnd: nextRangeEnd,
      token: {
        raw: nextRaw,
        rangeStart: activeToken.rangeStart,
        rangeEnd: nextRangeEnd
      }
    };
  }

  if (event.inputType === "insertText" && isTokenCharacter(event.data)) {
    const baseToken =
      activeToken ??
      (surfaceState.selectionStart === surfaceState.selectionEnd
        ? findRawToken(surfaceState.text, surfaceState.selectionStart)
        : undefined);

    const nextToken: LiveToken = baseToken
      ? {
          raw: `${baseToken.raw}${event.data}`,
          rangeStart: baseToken.rangeStart,
          rangeEnd: baseToken.rangeEnd
        }
      : {
          raw: event.data,
          rangeStart: surfaceState.selectionStart,
          rangeEnd: surfaceState.selectionEnd
        };
    const nextTokenText = transliterate(nextToken.raw, modeState.ruleSet).text;
    const nextRangeEnd = nextToken.rangeStart + nextTokenText.length;

    return {
      text: replaceRange(surfaceState.text, nextToken.rangeStart, nextToken.rangeEnd, nextTokenText),
      selectionStart: nextRangeEnd,
      selectionEnd: nextRangeEnd,
      token: {
        raw: nextToken.raw,
        rangeStart: nextToken.rangeStart,
        rangeEnd: nextRangeEnd
      }
    };
  }

  return {
    ...nativePatch,
    token: undefined
  };
}
