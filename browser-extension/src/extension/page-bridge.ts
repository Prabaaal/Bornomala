type RegisteredEditor = {
  kind: "monaco" | "codemirror";
  getState: () => {
    text: string;
    selectionStart: number;
    selectionEnd: number;
    composition: boolean;
    surfaceKind: "monaco" | "codemirror";
  } | null;
  applyPatch: (patch: { text: string; selectionStart: number; selectionEnd: number }) => void;
};

const registry = new Map<string, RegisteredEditor>();

function ensureId(root: HTMLElement, kind: "monaco" | "codemirror"): string {
  const existing = root.dataset.bornomalaEditorId;

  if (existing) {
    root.dataset.bornomalaEditorKind = kind;
    return existing;
  }

  const nextId = `bornomala-${kind}-${crypto.randomUUID()}`;
  root.dataset.bornomalaEditorId = nextId;
  root.dataset.bornomalaEditorKind = kind;
  return nextId;
}

function patchMonaco(): void {
  const monaco = (window as Window & { monaco?: any }).monaco;

  if (!monaco?.editor?.create || monaco.__bornomalaPatched) {
    return;
  }

  const originalCreate = monaco.editor.create.bind(monaco.editor);
  monaco.__bornomalaPatched = true;
  monaco.editor.create = (...args: unknown[]) => {
    const editor = originalCreate(...args);
    const root = editor.getDomNode?.();

    if (root instanceof HTMLElement) {
      const id = ensureId(root, "monaco");
      registry.set(id, {
        kind: "monaco",
        getState: () => {
          const model = editor.getModel?.();
          const selection = editor.getSelection?.();

          if (!model || !selection) {
            return null;
          }

          return {
            text: model.getValue(),
            selectionStart: model.getOffsetAt(selection.getStartPosition()),
            selectionEnd: model.getOffsetAt(selection.getEndPosition()),
            composition: false,
            surfaceKind: "monaco"
          };
        },
        applyPatch: (patch) => {
          const model = editor.getModel?.();

          if (!model) {
            return;
          }

          editor.executeEdits("bornomala", [
            {
              range: model.getFullModelRange(),
              text: patch.text
            }
          ]);
          const start = model.getPositionAt(patch.selectionStart);
          const end = model.getPositionAt(patch.selectionEnd);
          editor.setSelection({
            startLineNumber: start.lineNumber,
            startColumn: start.column,
            endLineNumber: end.lineNumber,
            endColumn: end.column
          });
        }
      });
    }

    return editor;
  };
}

function registerCodeMirror5(root: HTMLElement): void {
  const cm = (root as HTMLElement & { CodeMirror?: any }).CodeMirror;

  if (!cm) {
    return;
  }

  const id = ensureId(root, "codemirror");
  registry.set(id, {
    kind: "codemirror",
    getState: () => {
      const from = cm.getCursor("from");
      const to = cm.getCursor("to");
      return {
        text: cm.getValue(),
        selectionStart: cm.indexFromPos(from),
        selectionEnd: cm.indexFromPos(to),
        composition: false,
        surfaceKind: "codemirror"
      };
    },
    applyPatch: (patch) => {
      const doc = cm.getDoc();
      const lastLine = doc.lastLine();
      const lastPos = {
        line: lastLine,
        ch: doc.getLine(lastLine).length
      };
      doc.replaceRange(patch.text, { line: 0, ch: 0 }, lastPos, "+input");
      doc.setSelection(doc.posFromIndex(patch.selectionStart), doc.posFromIndex(patch.selectionEnd));
    }
  });
}

function registerCodeMirror6(root: HTMLElement): void {
  const view = (root as HTMLElement & { cmView?: { view?: any } }).cmView?.view;

  if (!view) {
    return;
  }

  const id = ensureId(root, "codemirror");
  registry.set(id, {
    kind: "codemirror",
    getState: () => {
      const selection = view.state.selection.main;
      return {
        text: view.state.doc.toString(),
        selectionStart: selection.from,
        selectionEnd: selection.to,
        composition: false,
        surfaceKind: "codemirror"
      };
    },
    applyPatch: (patch) => {
      view.dispatch({
        changes: {
          from: 0,
          to: view.state.doc.length,
          insert: patch.text
        },
        selection: {
          anchor: patch.selectionStart,
          head: patch.selectionEnd
        }
      });
    }
  });
}

function scanAndRegisterCodeMirror(): void {
  document.querySelectorAll<HTMLElement>(".CodeMirror").forEach(registerCodeMirror5);
  document.querySelectorAll<HTMLElement>(".cm-editor").forEach(registerCodeMirror6);
}

window.addEventListener("bornomala:request-editor-state", (event: Event) => {
  const custom = event as CustomEvent<{ editorId?: string; responseAttribute: string }>;
  const editorId = custom.detail?.editorId;
  const responseAttribute = custom.detail?.responseAttribute;

  if (!editorId || !responseAttribute) {
    return;
  }

  const editor = registry.get(editorId);
  const root = document.querySelector<HTMLElement>(`[data-bornomala-editor-id="${editorId}"]`);
  const state = editor?.getState();

  if (!root || !state) {
    return;
  }

  root.setAttribute(responseAttribute, JSON.stringify(state));
});

window.addEventListener("bornomala:apply-editor-patch", (event: Event) => {
  const custom = event as CustomEvent<{
    editorId?: string;
    patch?: { text: string; selectionStart: number; selectionEnd: number };
  }>;

  if (!custom.detail?.editorId || !custom.detail.patch) {
    return;
  }

  registry.get(custom.detail.editorId)?.applyPatch(custom.detail.patch);
});

patchMonaco();
scanAndRegisterCodeMirror();
setInterval(() => {
  patchMonaco();
  scanAndRegisterCodeMirror();
}, 1000);
