<template>
  <div class="dot-output">
    <pre>{{ store.dot }}</pre>
  </div>
</template>

<script>
import { useArgdownStore } from "../store.js";

export default {
  name: "dot-output",
  computed: {
    store() {
      return useArgdownStore();
    },
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
