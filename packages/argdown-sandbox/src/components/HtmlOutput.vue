<template>
  <div class="html-output output">
    <div class="content">
      <div v-if="source" class="html-source">
        <pre><code>{{ html }}</code></pre>
      </div>
      <div v-else class="html-rendered" v-html="html"></div>
    </div>
  </div>
</template>

<script>
import { useArgdownStore } from "../store.js";

export default {
  name: "html-output",
  props: {
    source: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    store() {
      return useArgdownStore();
    },
    html() {
      return this.store.html;
    },
  },
};
</script>

<style scoped>
.output .content {
  padding: 1em;
}
.html-source pre {
  background-color: #f5f5f5;
  padding: 1em;
  border-radius: 4px;
  overflow-x: auto;
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>
