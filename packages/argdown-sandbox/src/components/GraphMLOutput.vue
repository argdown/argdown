<template>
  <div class="graphml-output">
    <pre>{{ graphml }}</pre>
  </div>
</template>

<script>
import { computed } from "vue";
import { useArgdownStore } from "../store.js";

export default {
  name: "graphml-output",
  setup() {
    const store = useArgdownStore();
    const graphml = computed(() => store.graphml);

    return { graphml };
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
