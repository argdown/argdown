<template>
  <div class="argdown-input" :class="{ 'use-argvu': useArgVu }">
    <textarea ref="editorRef" class="argdown-editor"></textarea>
  </div>
</template>

<script>
import * as _ from "lodash";
import CodeMirror from "codemirror";
import "codemirror/lib/codemirror.css";
import "codemirror/addon/mode/simple";
import argdownMode from "@argdown/codemirror-mode";
import "@argdown/codemirror-mode/codemirror-argdown.css";

export default {
  name: "argdown-input",
  props: ["value"],
  data() {
    return {
      localValue: this.value,
      editor: null,
      needsRefresh: false
    };
  },
  computed: {
    useArgVu() {
      return this.$store.state.useArgVu;
    }
  },
  watch: {
    useArgVu(newVal, oldVal) {
      if (newVal !== oldVal) {
        this.needsRefresh = true;
        this.$nextTick(() => {
          if (this.needsRefresh) {
            this.refreshEditor();
            this.needsRefresh = false;
          }
        });
      }
    },
    '$store.state.argdownInput'(newVal) {
      if (this.editor && newVal !== this.localValue) {
        // Only update if it's a significant change (example switching)
        if (!newVal.includes(this.localValue) && !this.localValue.includes(newVal)) {
          console.log('Setting editor value to new content (example switch)');
          this.localValue = newVal;
          this.editor.setValue(newVal);
          this.editor.refresh();
        }
      }
    },
    value(newVal) {
      if (this.editor && newVal !== this.localValue) {
        this.localValue = newVal;
        this.editor.setValue(newVal);
      }
    }
  },
  methods: {
    debouncedChangeEmission: _.debounce(function (value) {
      this.$emit("change", value);
    }, 100),
    
    refreshEditor() {
      if (!this.$refs.editorRef) {
        console.log("Editor ref not available yet, skipping refresh");
        return;
      }
      
      if (this.editor) {
        this.editor.toTextArea();
      }
      // Re-initialize CodeMirror
      this.editor = CodeMirror.fromTextArea(this.$refs.editorRef, {
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
      this.editor.setValue(this.localValue);
      this.editor.on("change", (cm) => {
        this.localValue = cm.getValue();
        this.debouncedChangeEmission(cm.getValue());
      });
      this.editor.setSize("100%", "100%");
    }
  },
  mounted() {
    CodeMirror.defineSimpleMode("argdown", argdownMode);
    this.editor = CodeMirror.fromTextArea(this.$refs.editorRef, {
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
    this.editor.setValue(this.localValue);
    this.editor.on("change", (cm) => {
      this.localValue = cm.getValue();
      this.debouncedChangeEmission(cm.getValue());
    });
    this.editor.setSize("100%", "100%");
  },
  // eslint-disable-next-line vue/no-deprecated-destroyed-lifecycle
  beforeDestroy() {
    if (this.editor) {
      this.editor.toTextArea();
    }
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
