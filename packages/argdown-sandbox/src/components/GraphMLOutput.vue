<template>
  <div class="graphml-output">
    <pre>{{ graphml }}</pre>
  </div>
</template>

<script>
export default {
  name: "graphml-output",
  computed: {
    graphml() {
      return this.$store.getters.graphml;
    }
  }
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
