<template>
  <div class="argdown-input" :class="{ 'use-argvu': useArgVu }">
    <textarea ref="editorRef" class="argdown-editor"></textarea>
  </div>
</template>

<script>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue';
import { useArgdownStore } from '../store.js';
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
    const localValue = ref(props.value);
    const editor = ref(null);
    const needsRefresh = ref(false);
    
    const useArgVu = computed(() => store.useArgVu);
    
    const debouncedChangeEmission = _.debounce((value) => {
      emit("change", value);
    }, 100);
    
    function refreshEditor() {
      if (!editorRef.value) {
        console.log("Editor ref not available yet, skipping refresh");
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
      editor.value.setValue(localValue.value);
      editor.value.on("change", (cm) => {
        localValue.value = cm.getValue();
        debouncedChangeEmission(cm.getValue());
      });
      editor.value.setSize("100%", "100%");
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
    
    watch(() => store.argdownInput, (newVal) => {
      if (editor.value && newVal !== localValue.value) {
        // Only update if it's a significant change (example switching)
        if (!newVal.includes(localValue.value) && !localValue.value.includes(newVal)) {
          console.log('Setting editor value to new content (example switch)');
          localValue.value = newVal;
          editor.value.setValue(newVal);
          editor.value.refresh();
        }
      }
    });
    
    watch(() => props.value, (newVal) => {
      if (editor.value && newVal !== localValue.value) {
        localValue.value = newVal;
        editor.value.setValue(newVal);
      }
    });
    
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
      editor.value.setValue(localValue.value);
      editor.value.on("change", (cm) => {
        localValue.value = cm.getValue();
        debouncedChangeEmission(cm.getValue());
      });
      editor.value.setSize("100%", "100%");
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
      refreshEditor
    };
  }
};
</script>

<style lang="scss">
.argdown-input.use-argvu .argdown-editor,
.argdown-input.use-argvu .CodeMirror {
  font-family: 'ArgVu Sans Mono Regular', monospace !important;
  font-size: 1em !important;
  font-feature-settings: 'dlig' 1;
}

.input-maximized {
  .argdown-input {
    max-width: 60em;
    width: 100%;
    margin: 0 auto;
  }
}

.argdown-input {
  flex: 1;
  height: 100%;
  min-height: 0;
  max-height: calc(100vh - 2.5em);
  overflow: hidden;
  display: flex;
  flex-direction: column;

  .argdown-editor {
    width: 100%;
    height: 100%;
    margin: 0;
    border: 1px solid #eee;
    box-sizing: border-box;
    background-color: #fff;
    max-height: 100%;
    flex: 1;
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
    height: 100%;
    font-family: monospace;
    font-size: 1.25em;
  }

  .CodeMirror-gutters {
    padding-left: 20px;
  }

  .CodeMirror-line {
    line-height: 1.4 !important;
  }
}
</style>
