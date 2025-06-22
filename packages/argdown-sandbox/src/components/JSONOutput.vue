<template>
  <div class="json-output">
    <pre>{{ store.json }}</pre>
  </div>
</template>

<script>
import { useArgdownStore } from "../store.js";

export default {
  name: "json-output",
  computed: {
    store() {
      return useArgdownStore();
    },
  },
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
