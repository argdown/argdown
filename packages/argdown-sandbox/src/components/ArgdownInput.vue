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
    const localValue = ref(String(props.value || ''));
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
      editor.value.setValue(String(localValue.value || ''));
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
      // Only process if we have a valid string value
      if (typeof newVal === 'string' && newVal !== localValue.value) {
        console.log('Setting editor value to new string content');
        localValue.value = newVal;
        if (editor.value) {
          editor.value.setValue(newVal);
          editor.value.refresh();
        }
      } else if (newVal && typeof newVal === 'object') {
        // For objects, be more conservative - only update if we can extract meaningful content
        let newValStr = null;
        
        // Try to extract content from common properties
        if (newVal.content && typeof newVal.content === 'string') {
          newValStr = newVal.content;
        } else if (newVal.data && typeof newVal.data === 'string') {
          newValStr = newVal.data;
        } else if (newVal.text && typeof newVal.text === 'string') {
          newValStr = newVal.text;
        }
        
        // Only update if we found valid string content and it's different
        if (newValStr && newValStr !== localValue.value) {
          console.log('Setting editor value to extracted object content');
          localValue.value = newValStr;
          if (editor.value) {
            editor.value.setValue(newValStr);
            editor.value.refresh();
          }
        } else {
          console.log('Skipping object update - no valid string content found or no change');
        }
      } else if (newVal === null || newVal === undefined) {
        // Don't clear the editor for null/undefined values
        console.log('Skipping update - null/undefined value, preserving existing content');
      } else {
        // For other types, log but don't update
        console.log('Skipping update - unexpected value type:', typeof newVal, newVal);
      }
    });
    
    watch(() => props.value, (newVal) => {
      // Only update if we have a valid string value and it's different
      if (typeof newVal === 'string' && newVal !== localValue.value) {
        console.log('Props value changed, updating editor');
        localValue.value = newVal;
        if (editor.value) {
          editor.value.setValue(newVal);
        }
      } else if (newVal && typeof newVal === 'object') {
        // For objects, be conservative
        let newValStr = null;
        if (newVal.content && typeof newVal.content === 'string') {
          newValStr = newVal.content;
        } else if (newVal.data && typeof newVal.data === 'string') {
          newValStr = newVal.data;
        } else if (newVal.text && typeof newVal.text === 'string') {
          newValStr = newVal.text;
        }
        
        if (newValStr && newValStr !== localValue.value) {
          console.log('Props object value changed, updating editor');
          localValue.value = newValStr;
          if (editor.value) {
            editor.value.setValue(newValStr);
          }
        }
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
      editor.value.setValue(String(localValue.value || ''));
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
