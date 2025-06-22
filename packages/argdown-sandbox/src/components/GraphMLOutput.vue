<template>
  <div class="graphml-output">
    <pre>{{ store.graphml }}</pre>
  </div>
</template>

<script>
import { useArgdownStore } from "../store.js";

export default {
  name: "graphml-output",
  computed: {
    store() {
      return useArgdownStore();
    },
  },
};
</script>

<style scoped>
.graphml-output {
  padding: 1rem;
  background-color: #f5f5f5;
  border-radius: 0.2em;
  margin: 1rem;
  overflow: auto;
}
</style>
