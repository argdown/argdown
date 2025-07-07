<template>
  <div class="argdown-input" :class="{ 'use-argvu': useArgVu }">
    <textarea ref="editor" class="argdown-editor"></textarea>
  </div>
</template>

<script>
import * as _ from "lodash";
import { useArgdownStore } from "../store.js";
import CodeMirror from "codemirror";
import "codemirror/lib/codemirror.css";
import "codemirror/addon/mode/simple";
import argdownMode from "@argdown/codemirror-mode";
import "@argdown/codemirror-mode/codemirror-argdown.css";

export default {
  name: "argdown-input",
  data() {
    return {
      localValue: this.value,
      editor: null,
    };
  },
  props: ["value"],
  mounted() {
    CodeMirror.defineSimpleMode("argdown", argdownMode);
    this.editor = CodeMirror.fromTextArea(this.$refs.editor, {
      mode: "argdown",
      lineNumbers: true,
      theme: "default",
      tabSize: 4,
      indentUnit: 4,
      lineWrapping: true,
      styleActiveLine: true,
      extraKeys: {
        Tab: function (cm) {
          let spaces = Array(cm.getOption("indentUnit") + 1).join(" ");
          cm.replaceSelection(spaces);
        },
      },
    });
    this.editor.setValue(this.localValue);
    this.editor.on("change", (cm) => {
      this.localValue = cm.getValue();
      this.debouncedChangeEmission(this.localValue, this);
    });
    this.editor.setSize("100%", "100%");
  },
  beforeUnmount() {
    if (this.editor) {
      this.editor.toTextArea();
    }
  },
  methods: {
    debouncedChangeEmission: _.debounce(function (value, component) {
      component.$emit("change", value);
    }, 100),
    refreshEditor() {
      if (this.editor) {
        this.editor.toTextArea();
      }
      // Re-initialize CodeMirror
      this.editor = CodeMirror.fromTextArea(this.$refs.editor, {
        mode: "argdown",
        lineNumbers: true,
        theme: "default",
        tabSize: 4,
        indentUnit: 4,
        lineWrapping: true,
        styleActiveLine: true,
        extraKeys: {
          Tab: function (cm) {
            let spaces = Array(cm.getOption("indentUnit") + 1).join(" ");
            cm.replaceSelection(spaces);
          },
        },
      });
      this.editor.setValue(this.localValue);
      this.editor.on("change", (cm) => {
        this.localValue = cm.getValue();
        this.debouncedChangeEmission(this.localValue, this);
      });
      this.editor.setSize("100%", "100%");
    },
  },
  computed: {
    store() {
      return useArgdownStore();
    },
    useArgVu() {
      return this.store.useArgVuState;
    },
  },
  watch: {
    useArgVu() {
      this.refreshEditor();
    },
    value(newVal) {
      if (this.editor && newVal !== this.localValue) {
        this.localValue = newVal;
        this.editor.setValue(newVal);
      }
    },
  },
};
</script>

<style lang="scss">
.argdown-input.use-argvu .argdown-editor,
.argdown-input.use-argvu .CodeMirror {
  font-family: monospace;
  font-size: 1em;
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
    line-height: 1.3 !important;
  }
}
</style>
