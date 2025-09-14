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
  onBeforeUnmount,
} from "vue";
import { useArgdownStore } from "../store.js";
import * as _ from "lodash";
import CodeMirror from "codemirror";
import "codemirror/lib/codemirror.css";
import "codemirror/addon/mode/simple";
import argdownMode from "@argdown/codemirror-mode";
import "@argdown/codemirror-mode/codemirror-argdown.css";

export default {
  name: "argdown-input",
  props: ["value"],
  setup(props, { emit }) {
    const store = useArgdownStore();
    const editorRef = ref(null);
    const localValue = ref(String(props.value || ""));
    const editor = ref(null);
    const needsRefresh = ref(false);

    const useArgVu = computed(() => store.useArgVu);

    const debouncedChangeEmission = _.debounce((value) => {
      emit("change", value);
    }, 100);

    function sizeEditorToContainer() {}

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
          },
        },
      });
      editor.value.setValue(String(localValue.value || ""));
      editor.value.on("change", (cm) => {
        localValue.value = cm.getValue();
        debouncedChangeEmission(cm.getValue());
      });
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
      },
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
      },
    );

    onMounted(() => {
      CodeMirror.defineSimpleMode("argdown", argdownMode);
      editor.value = CodeMirror.fromTextArea(editorRef.value, {
        mode: "argdown",
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
          },
        },
      });
      editor.value.setValue(String(localValue.value || ""));
      editor.value.on("change", (cm) => {
        localValue.value = cm.getValue();
        debouncedChangeEmission(cm.getValue());
      });
    });

    onBeforeUnmount(() => {
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
      refreshEditor,
    };
  },
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

  .CodeMirror-line {
    line-height: 1.4 !important;
  }
}
</style>
