<template>
  <div class="json-output">
    <pre>{{ json }}</pre>
  </div>
</template>

<script>
export default {
  name: "json-output",
  computed: {
    json() {
      return this.$store.getters.json;
    }
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
