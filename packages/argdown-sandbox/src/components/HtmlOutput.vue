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
import { computed } from 'vue';
import { useArgdownStore } from '../store.js';

export default {
  name: "html-output",
  props: {
    source: {
      type: Boolean,
      default: false
    }
  },
  setup() {
    const store = useArgdownStore();
    const html = computed(() => store.html);
    
    return { html };
  }
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
