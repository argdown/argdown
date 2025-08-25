<template>
  <div class="json-output">
    <pre>{{ json }}</pre>
  </div>
</template>

<script>
import { computed } from 'vue';
import { useArgdownStore } from '../store.js';

export default {
  name: "json-output",
  setup() {
    const store = useArgdownStore();
    const json = computed(() => store.json);
    
    return { json };
  }
};
</script>

<style scoped>
.json-output {
  padding: 1rem;
  background-color: #f5f5f5;
  border-radius: 0.2em;
  margin: 1rem;
  overflow: auto;
}
</style>
