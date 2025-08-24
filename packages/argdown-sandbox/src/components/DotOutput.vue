<template>
  <div class="dot-output">
    <pre>{{ dot }}</pre>
  </div>
</template>

<script>
export default {
  name: "dot-output",
  computed: {
    dot() {
      return this.$store.getters.dot;
    }
  }
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
