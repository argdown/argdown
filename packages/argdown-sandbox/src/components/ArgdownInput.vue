<template>
  <div class="argdown-input" v-bind:class="{ 'use-argvu': useArgVu }">
    <textarea
      ref="textarea"
      v-model="localValue"
      @input="updateValue"
      class="argdown-textarea"
    ></textarea>
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
    // Initialize the textarea with syntax highlighting
    this.$nextTick(() => {
      this.setupTextarea();
    });
  },
  methods: {
    setupTextarea() {
      const textarea = this.$refs.textarea;
      if (textarea) {
        textarea.style.fontFamily = this.useArgVu ? "monospace" : "monospace";
        textarea.style.fontSize = "1.25em";
        textarea.style.padding = "1em";
        textarea.style.border = "1px solid #eee";
        textarea.style.width = "100%";
        textarea.style.height = "100%";
        textarea.style.resize = "none";
        textarea.style.boxSizing = "border-box";
      }
    },
    updateValue: function () {
      this.debouncedChangeEmission(this.localValue, this);
    },
    debouncedChangeEmission: _.debounce(function (value, component) {
      component.$emit("change", value);
    }, 100),
    refreshEditor: function () {
      this.$nextTick(() => {
        this.setupTextarea();
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
.argdown-input.use-argvu .argdown-textarea {
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
  overflow: hidden;

  .argdown-textarea {
    flex: 1;
    padding: 1em;
    width: 100%;
    height: 100%;
    font-size: 1.25em;
    border: 1px solid #eee;
    resize: none;
    box-sizing: border-box;

    &:focus {
      outline: none;
      border-color: #3e8eaf;
    }
  }
}
</style>
