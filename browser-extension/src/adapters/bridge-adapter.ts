import { applyInput } from "../core/index.js";
import type {
  InputEventSnapshot,
  LiveToken,
  ModeState,
  SurfaceKind,
  SurfaceState
} from "../core/index.js";

interface BridgeSurfaceState extends SurfaceState {
  root: HTMLElement;
}

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

function requestBridgeState(root: HTMLElement): BridgeSurfaceState | null {
  const responseAttribute = `data-bornomala-response-${crypto.randomUUID()}`;
  root.removeAttribute(responseAttribute);
  window.dispatchEvent(
    new CustomEvent("bornomala:request-editor-state", {
      detail: {
        editorId: root.dataset.bornomalaEditorId,
        responseAttribute
      }
    })
  );

  const raw = root.getAttribute(responseAttribute);
  root.removeAttribute(responseAttribute);

  if (!raw) {
    return null;
  }

  const parsed = JSON.parse(raw) as Omit<BridgeSurfaceState, "root">;

  return {
    ...parsed,
    root
  };
}

function applyBridgePatch(root: HTMLElement, patch: { text: string; selectionStart: number; selectionEnd: number }) {
  window.dispatchEvent(
    new CustomEvent("bornomala:apply-editor-patch", {
      detail: {
        editorId: root.dataset.bornomalaEditorId,
        patch
      }
    })
  );
}

export class BridgeAdapter {
  constructor(private readonly kind: SurfaceKind) {}

  detect(target: EventTarget | null): HTMLElement | null {
    if (!(target instanceof HTMLElement)) {
      return null;
    }

    return (
      target.closest<HTMLElement>(`[data-bornomala-editor-kind="${this.kind}"]`) ?? null
    );
  }

  attach(root: HTMLElement, getModeState: () => ModeState, eventTarget: HTMLElement): () => void {
    const onBeforeInput = (event: Event): void => {
      const inputEvent = event as InputEvent;
      const snapshot = toSnapshot(inputEvent);
      const modeState = getModeState();

      if (!snapshot || !modeState.enabled) {
        return;
      }

      const bridgeState = requestBridgeState(root);

      if (!bridgeState) {
        return;
      }

      const patch = applyInput(
        {
          ...bridgeState,
          token: tokens.get(root)
        },
        snapshot,
        modeState
      );

      inputEvent.preventDefault();
      applyBridgePatch(root, patch);
      tokens.set(root, patch.token);
    };

    const clearToken = (): void => {
      tokens.delete(root);
    };

    eventTarget.addEventListener("beforeinput", onBeforeInput);
    eventTarget.addEventListener("blur", clearToken);

    return () => {
      eventTarget.removeEventListener("beforeinput", onBeforeInput);
      eventTarget.removeEventListener("blur", clearToken);
    };
  }
}
