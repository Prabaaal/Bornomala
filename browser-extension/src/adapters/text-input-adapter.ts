import { applyInput } from "../core/index.js";
import type {
  InputEventSnapshot,
  LiveToken,
  ModeState,
  SurfaceState
} from "../core/index.js";

type TextControl = HTMLInputElement | HTMLTextAreaElement;

const supportedInputTypes = new Set(["text", "search", "url", "email", "tel"]);
const tokens = new WeakMap<TextControl, LiveToken | undefined>();

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

function shouldHandle(element: TextControl): boolean {
  if (element instanceof HTMLTextAreaElement) {
    return !element.disabled && !element.readOnly;
  }

  return (
    supportedInputTypes.has(element.type || "text") &&
    !element.disabled &&
    !element.readOnly &&
    element.type !== "password"
  );
}

export class TextInputAdapter {
  detect(target: EventTarget | null): HTMLElement | null {
    if (!(target instanceof HTMLElement)) {
      return null;
    }

    if (target instanceof HTMLTextAreaElement && shouldHandle(target)) {
      return target;
    }

    if (target instanceof HTMLInputElement && shouldHandle(target)) {
      return target;
    }

    return null;
  }

  attach(root: HTMLElement, getModeState: () => ModeState): () => void {
    const element = root as TextControl;
    const onBeforeInput = (event: Event): void => {
      const inputEvent = event as InputEvent;
      const snapshot = toSnapshot(inputEvent);
      const modeState = getModeState();

      if (!snapshot || !modeState.enabled) {
        return;
      }

      const selectionStart = element.selectionStart ?? element.value.length;
      const selectionEnd = element.selectionEnd ?? element.value.length;
      const patch = applyInput(
        {
          text: element.value,
          selectionStart,
          selectionEnd,
          composition: inputEvent.isComposing,
          surfaceKind: element instanceof HTMLTextAreaElement ? "textarea" : "input",
          token: tokens.get(element)
        },
        snapshot,
        modeState
      );

      inputEvent.preventDefault();
      element.value = patch.text;
      element.setSelectionRange(patch.selectionStart, patch.selectionEnd);
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
