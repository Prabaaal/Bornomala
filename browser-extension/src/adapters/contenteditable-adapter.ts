import { applyInput } from "../core/index.js";
import type {
  InputEventSnapshot,
  LiveToken,
  ModeState,
  SurfaceState
} from "../core/index.js";

const tokens = new WeakMap<HTMLElement, LiveToken | undefined>();

function toSnapshot(event: InputEvent): InputEventSnapshot | null {
  if (
    event.inputType === "insertText" ||
    event.inputType === "deleteContentBackward" ||
    event.inputType === "deleteContentForward" ||
    event.inputType === "insertFromPaste"
  ) {
    return {
      inputType: event.inputType,
      data: event.data
    };
  }

  return null;
}

function getOffsets(root: HTMLElement): { start: number; end: number } | null {
  const selection = window.getSelection();

  if (!selection || selection.rangeCount === 0) {
    return null;
  }

  const range = selection.getRangeAt(0);

  if (!root.contains(range.startContainer) || !root.contains(range.endContainer)) {
    return null;
  }

  const beforeStart = document.createRange();
  beforeStart.selectNodeContents(root);
  beforeStart.setEnd(range.startContainer, range.startOffset);

  const beforeEnd = document.createRange();
  beforeEnd.selectNodeContents(root);
  beforeEnd.setEnd(range.endContainer, range.endOffset);

  return {
    start: beforeStart.toString().length,
    end: beforeEnd.toString().length
  };
}

function resolveTextBoundary(root: HTMLElement, offset: number): { node: Text; offset: number } {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let remaining = offset;
  let textNode = walker.nextNode() as Text | null;

  while (textNode) {
    if (remaining <= textNode.data.length) {
      return {
        node: textNode,
        offset: remaining
      };
    }

    remaining -= textNode.data.length;
    textNode = walker.nextNode() as Text | null;
  }

  const fallback = root.lastChild instanceof Text ? root.lastChild : document.createTextNode("");

  if (!fallback.parentNode) {
    root.appendChild(fallback);
  }

  return {
    node: fallback,
    offset: fallback.data.length
  };
}

function setOffsets(root: HTMLElement, start: number, end: number): void {
  const selection = window.getSelection();

  if (!selection) {
    return;
  }

  const startBoundary = resolveTextBoundary(root, start);
  const endBoundary = resolveTextBoundary(root, end);
  const range = document.createRange();

  range.setStart(startBoundary.node, startBoundary.offset);
  range.setEnd(endBoundary.node, endBoundary.offset);

  selection.removeAllRanges();
  selection.addRange(range);
}

function supportsPlainTextMode(element: HTMLElement): boolean {
  return (
    element.isContentEditable &&
    !element.closest("[data-bornomala-editor-kind]") &&
    (element.getAttribute("contenteditable") === "plaintext-only" || element.childElementCount === 0)
  );
}

export class ContentEditableAdapter {
  detect(target: EventTarget | null): HTMLElement | null {
    if (!(target instanceof HTMLElement) || !supportsPlainTextMode(target)) {
      return null;
    }

    return target;
  }

  attach(element: HTMLElement, getModeState: () => ModeState): () => void {
    const onBeforeInput = (event: Event): void => {
      const inputEvent = event as InputEvent;
      const snapshot = toSnapshot(inputEvent);
      const modeState = getModeState();

      if (!snapshot || !modeState.enabled) {
        return;
      }

      const offsets = getOffsets(element);

      if (!offsets) {
        return;
      }

      const patch = applyInput(
        {
          text: element.textContent ?? "",
          selectionStart: offsets.start,
          selectionEnd: offsets.end,
          composition: inputEvent.isComposing,
          surfaceKind: "contenteditable",
          token: tokens.get(element)
        },
        snapshot,
        modeState
      );

      inputEvent.preventDefault();
      element.textContent = patch.text;
      setOffsets(element, patch.selectionStart, patch.selectionEnd);
      tokens.set(element, patch.token);
    };

    const clearToken = (): void => {
      tokens.delete(element);
    };

    element.addEventListener("beforeinput", onBeforeInput);
    element.addEventListener("blur", clearToken);

    return () => {
      element.removeEventListener("beforeinput", onBeforeInput);
      element.removeEventListener("blur", clearToken);
    };
  }
}
