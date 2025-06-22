<template>
  <div class="argdown-input" v-bind:class="{ 'use-argvu': useArgVu }">
    <pre
      ref="editor"
      contenteditable="true"
      @input="updateValue"
      @keydown="handleKeydown"
      class="argdown-editor"
    >{{ localValue }}</pre>
  </div>
</template>

<script>
import * as _ from "lodash";
import { useArgdownStore } from "../store.js";

export default {
  name: "argdown-input",
  data() {
    return {
      localValue: this.value,
      editorOption: {
        tabSize: 4,
        mode: "argdown",
        foldGutter: true,
        // gutters: ["CodeMirror-linenumbers"],
        styleActiveLine: true,
        lineNumbers: true,
        lint: true,
        gutters: ["CodeMirror-lint-markers"],
        line: true,
        extraKeys: {
          Tab: function (cm) {
            let spaces = Array(cm.getOption("indentUnit") + 1).join(" ");
            cm.replaceSelection(spaces);
          },
        },
      },
    };
  },
  props: ["value"],
  created: function () {
    // Initialize the editor
    this.$nextTick(() => {
      this.setupEditor();
    });
  },
  methods: {
    setupEditor() {
      const editor = this.$refs.editor;
      if (editor) {
        editor.style.fontFamily = "monospace";
        editor.style.fontSize = "1.25em";
        editor.style.padding = "1em";
        editor.style.border = "1px solid #eee";
        editor.style.width = "100%";
        editor.style.height = "100%";
        editor.style.boxSizing = "border-box";
        editor.style.overflow = "auto";
        editor.style.margin = "0";
        editor.style.whiteSpace = "pre-wrap";
        editor.style.wordWrap = "break-word";
      }
    },
    updateValue() {
      const editor = this.$refs.editor;
      if (editor) {
        this.localValue = editor.textContent || '';
        this.debouncedChangeEmission(this.localValue, this);
      }
    },
    handleKeydown(event) {
      // Handle tab key
      if (event.key === 'Tab') {
        event.preventDefault();
        const selection = window.getSelection();
        const range = selection.getRangeAt(0);
        const tabNode = document.createTextNode('    '); // 4 spaces
        range.deleteContents();
        range.insertNode(tabNode);
        range.setStartAfter(tabNode);
        range.setEndAfter(tabNode);
        selection.removeAllRanges();
        selection.addRange(range);
        this.updateValue();
      }
    },
    debouncedChangeEmission: _.debounce(function (value, component) {
      component.$emit("change", value);
    }, 100),
    refreshEditor: function () {
      this.$nextTick(() => {
        this.setupEditor();
      });
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
      this.localValue = newVal;
    },
  },
};
</script>

<style lang="scss">
.argdown-input.use-argvu .argdown-editor {
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

  .argdown-editor {
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 1em;
    font-size: 1.25em;
    border: 1px solid #eee;
    box-sizing: border-box;
    overflow: auto;
    font-family: monospace;
    background-color: #fff;
    outline: none;

    &:focus {
      border-color: #3e8eaf;
    }
  }
}
</style>
