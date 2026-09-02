<template>
  <div class="argdown-input" :class="{ 'use-argvu': useArgVu }">
    <textarea ref="editorRef" class="argdown-editor"></textarea>
  </div>
</template>

<script>
import {
  ref,
  computed,
  watch,
  nextTick,
  onMounted,
  onBeforeUnmount
} from "vue";
import { useArgdownStore } from "../store.js";
import { debounce } from "lodash";
import CodeMirror from "codemirror";
import "codemirror/lib/codemirror.css";
import "codemirror/addon/mode/simple";
import argdownMode from "@argdown/codemirror-mode";
import "@argdown/codemirror-mode/codemirror-argdown.css";
import { EventBus } from "../event-bus.js";

export default {
  name: "ArgdownInput",
  props: {
    value: {
      type: [String, Object],
      default: ""
    }
  },
  emits: ["change"],
  setup(props, { emit }) {
    const store = useArgdownStore();
    const editorRef = ref(null);
    const localValue = ref(String(props.value || ""));
    const editor = ref(null);
    const needsRefresh = ref(false);
    const diagnosticMarks = ref([]);

    const useArgVu = computed(() => store.useArgVu);
    const diagnostics = computed(() => store.diagnostics);

    const debouncedChangeEmission = debounce((value) => {
      emit("change", value);
    }, 100);

    function sizeEditorToContainer() {}

    function clearDiagnostics() {
      for (const mark of diagnosticMarks.value) mark.clear();
      diagnosticMarks.value = [];
      if (editor.value) editor.value.clearGutter("argdown-diagnostics-gutter");
    }

    function sourcePosition(diagnostic) {
      if (!editor.value || !diagnostic.startLine) return null;
      const line = Math.min(
        Math.max(diagnostic.startLine - 1, 0),
        editor.value.lineCount() - 1
      );
      const lineLength = editor.value.getLine(line).length;
      const ch = Math.min(
        Math.max((diagnostic.startColumn || 1) - 1, 0),
        lineLength
      );
      return { line, ch };
    }

    function renderDiagnostics() {
      if (!editor.value) return;
      clearDiagnostics();
      const diagnosticsByLine = new Map();
      for (const diagnostic of diagnostics.value) {
        const from = sourcePosition(diagnostic);
        if (!from) continue;
        const existing = diagnosticsByLine.get(from.line);
        if (!existing || diagnostic.severity === "error") {
          diagnosticsByLine.set(from.line, diagnostic);
        }

        const endLine = Math.min(
          Math.max((diagnostic.endLine || diagnostic.startLine) - 1, from.line),
          editor.value.lineCount() - 1
        );
        const endLength = editor.value.getLine(endLine).length;
        let endCh = Math.min(
          Math.max(
            (diagnostic.endColumn || diagnostic.startColumn || 1) - 1,
            0
          ),
          endLength
        );
        if (endLine === from.line && endCh <= from.ch) {
          endCh = Math.min(from.ch + 1, endLength);
        }
        diagnosticMarks.value.push(
          editor.value.markText(
            from,
            { line: endLine, ch: endCh },
            {
              className: `argdown-diagnostic-range ${diagnostic.severity}`,
              title: `${diagnostic.code}: ${diagnostic.message}`
            }
          )
        );
      }

      for (const [line, diagnostic] of diagnosticsByLine) {
        const marker = document.createElement("button");
        marker.type = "button";
        marker.className = `argdown-diagnostic-marker ${diagnostic.severity}`;
        marker.title = `${diagnostic.code}: ${diagnostic.message}`;
        marker.setAttribute("aria-label", marker.title);
        marker.textContent = "●";
        marker.addEventListener("click", () =>
          navigateToDiagnostic(diagnostic)
        );
        editor.value.setGutterMarker(
          line,
          "argdown-diagnostics-gutter",
          marker
        );
      }
    }

    function navigateToDiagnostic(diagnostic) {
      const position = sourcePosition(diagnostic);
      if (!editor.value || !position) return;
      editor.value.setCursor(position);
      editor.value.scrollIntoView(position, 80);
      editor.value.focus();
    }

    function refreshEditor() {
      if (!editorRef.value) {
        return;
      }

      if (editor.value) {
        editor.value.toTextArea();
      }
      // Re-initialize CodeMirror
      editor.value = CodeMirror.fromTextArea(editorRef.value, {
        mode: "argdown",
        gutters: ["CodeMirror-linenumbers", "argdown-diagnostics-gutter"],
        lineNumbers: true,
        theme: "default",
        tabSize: 4,
        indentUnit: 4,
        lineWrapping: true,
        styleActiveLine: true,
        extraKeys: {
          Tab: (cm) => {
            let spaces = Array(cm.getOption("indentUnit") + 1).join(" ");
            cm.replaceSelection(spaces);
          }
        }
      });
      editor.value.setValue(String(localValue.value || ""));
      editor.value.on("change", (cm) => {
        localValue.value = cm.getValue();
        debouncedChangeEmission(cm.getValue());
      });
      renderDiagnostics();
      // Ensure sizing happens after DOM is painted
      requestAnimationFrame(() => sizeEditorToContainer());
    }

    watch(useArgVu, (newVal, oldVal) => {
      if (newVal !== oldVal) {
        needsRefresh.value = true;
        nextTick(() => {
          if (needsRefresh.value) {
            refreshEditor();
            needsRefresh.value = false;
          }
        });
      }
    });

    watch(
      () => store.argdownInput,
      (newVal) => {
        if (typeof newVal === "string" && newVal !== localValue.value) {
          localValue.value = newVal;
          if (editor.value) {
            editor.value.setValue(newVal);
            editor.value.refresh();
          }
        } else if (newVal && typeof newVal === "object") {
          let newValStr = null;

          if (newVal.content && typeof newVal.content === "string") {
            newValStr = newVal.content;
          } else if (newVal.data && typeof newVal.data === "string") {
            newValStr = newVal.data;
          } else if (newVal.text && typeof newVal.text === "string") {
            newValStr = newVal.text;
          }

          if (newValStr && newValStr !== localValue.value) {
            localValue.value = newValStr;
            if (editor.value) {
              editor.value.setValue(newValStr);
              editor.value.refresh();
            }
          }
        }
      }
    );

    watch(
      () => props.value,
      (newVal) => {
        if (typeof newVal === "string" && newVal !== localValue.value) {
          localValue.value = newVal;
          if (editor.value) {
            editor.value.setValue(newVal);
          }
        } else if (newVal && typeof newVal === "object") {
          // For objects, be conservative
          let newValStr = null;
          if (newVal.content && typeof newVal.content === "string") {
            newValStr = newVal.content;
          } else if (newVal.data && typeof newVal.data === "string") {
            newValStr = newVal.data;
          } else if (newVal.text && typeof newVal.text === "string") {
            newValStr = newVal.text;
          }

          if (newValStr && newValStr !== localValue.value) {
            localValue.value = newValStr;
            if (editor.value) {
              editor.value.setValue(newValStr);
            }
          }
        }
      }
    );

    watch(
      diagnostics,
      () => {
        nextTick(() => renderDiagnostics());
      },
      { deep: true }
    );

    onMounted(() => {
      CodeMirror.defineSimpleMode("argdown", argdownMode);
      editor.value = CodeMirror.fromTextArea(editorRef.value, {
        mode: "argdown",
        gutters: ["CodeMirror-linenumbers", "argdown-diagnostics-gutter"],
        lineNumbers: true,
        theme: "default",
        tabSize: 4,
        indentUnit: 4,
        lineWrapping: false,
        styleActiveLine: true,
        extraKeys: {
          Tab: (cm) => {
            let spaces = Array(cm.getOption("indentUnit") + 1).join(" ");
            cm.replaceSelection(spaces);
          }
        }
      });
      editor.value.setValue(String(localValue.value || ""));
      editor.value.on("change", (cm) => {
        localValue.value = cm.getValue();
        debouncedChangeEmission(cm.getValue());
      });
      editor.value.on("cursorActivity", (cm) => {
        if (!cm.hasFocus()) return;
        store.selectMapElementAtLine(cm.getCursor().line + 1);
      });
      EventBus.$on("navigate-to-diagnostic", navigateToDiagnostic);
      EventBus.$on("navigate-to-source", navigateToDiagnostic);
      renderDiagnostics();
    });

    onBeforeUnmount(() => {
      EventBus.$off("navigate-to-diagnostic", navigateToDiagnostic);
      EventBus.$off("navigate-to-source", navigateToDiagnostic);
      clearDiagnostics();
      if (editor.value) {
        editor.value.toTextArea();
      }
    });

    return {
      editorRef,
      localValue,
      editor,
      needsRefresh,
      useArgVu,
      diagnostics,
      refreshEditor
    };
  }
};
</script>

<style lang="scss">
.argdown-input.use-argvu .argdown-editor,
.argdown-input.use-argvu .CodeMirror {
  font-family: "ArgVu Sans Mono Regular", monospace !important;
  font-size: 1em !important;
  font-feature-settings: "dlig" 1;
}

.input-maximized {
  .argdown-input {
    width: 100%;
    margin: 0;
  }
}

.argdown-input {
  flex: 1 1 auto;
  height: 100%;
  min-height: 0; /* Chrome: allow flex children to shrink properly */
  max-height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  .argdown-editor {
    width: 100%;
    height: 0;
    display: none;
    margin: 0;
    border: 1px solid #eee;
    box-sizing: border-box;
    background-color: #fff;
    max-height: 100%;
    flex: 0 0 auto;
    font-family: monospace;
    font-size: 1.25em;
    padding: 1em;
    resize: none;
    outline: none;

    &:focus {
      border-color: #3e8eaf;
    }
  }

  .CodeMirror {
    /* Allow editor to grow with flex container */
    flex: 1 1 auto;
    height: auto;
    min-height: 0; /* Chrome: critical to avoid collapsing */
    width: 100%;
    display: flex;
    flex-direction: column;
    font-family: monospace;
    font-size: 1.25em;
  }

  /* Ensure CodeMirror internals fill available height even when empty */
  .CodeMirror-scroll {
    flex: 1 1 auto;
    height: auto;
    min-height: 0; /* Chrome: allow scroll area to expand */
  }

  .CodeMirror-gutters {
    padding-left: 20px;
  }

  .argdown-diagnostics-gutter {
    width: 0.9rem;
  }

  .argdown-diagnostic-marker {
    width: 0.9rem;
    height: 1.2rem;
    margin: 0;
    padding: 0;
    border: 0;
    background: transparent;
    font-size: 0.65rem;
    line-height: 1;
  }

  .argdown-diagnostic-marker.error {
    color: #d92d20;
  }

  .argdown-diagnostic-marker.warning {
    color: #dc8b00;
  }

  .argdown-diagnostic-marker.information {
    color: #2878b5;
  }

  .argdown-diagnostic-range.error {
    text-decoration: underline wavy #d92d20;
    text-decoration-skip-ink: none;
  }

  .argdown-diagnostic-range.warning {
    text-decoration: underline wavy #dc8b00;
    text-decoration-skip-ink: none;
  }

  .argdown-diagnostic-range.information {
    text-decoration: underline dotted #2878b5;
  }

  .CodeMirror-line {
    line-height: 1.4 !important;
  }
}
</style>
