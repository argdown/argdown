<template>
  <div class="dot-output">
    <pre>{{ dot }}</pre>
  </div>
</template>

<script>
import { computed } from "vue";
import { useArgdownStore } from "../store.js";

export default {
  name: "dot-output",
  setup() {
    const store = useArgdownStore();
    const dot = computed(() => store.dot);

    return { dot };
  },
};
</script>

<style scoped>
.dot-output {
  padding: 1rem;
  background-color: #f5f5f5;
  border-radius: 0.2em;
  margin: 1rem;
  overflow: auto;
}
</style>
