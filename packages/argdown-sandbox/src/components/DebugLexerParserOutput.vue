<template>
  <div class="debug-output output">
    <div class="content">
      <div
        v-if="store.lexerErrors && store.lexerErrors.length > 0"
        class="lexer-errors"
      >
        <h2>Parser Errors ({{ store.lexerErrors.length }})</h2>
        <table
          class="lexer-error error"
          v-for="(error, index) in store.lexerErrors"
          :key="index"
        >
          <tbody>
            <tr>
              <td class="line">{{ error.line }}</td>
              <td class="message">{{ error.message }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div
        v-if="store.parserErrors && store.parserErrors.length > 0"
        class="parser-errors"
      >
        <h2>Parser Errors ({{ store.parserErrors.length }})</h2>
        <table
          class="parser-error error"
          v-for="(error, index) in store.parserErrors"
          :key="index"
        >
          <tbody>
            <tr>
              <td class="line">{{ error.line }}</td>
              <td class="message">{{ error.message }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="store.ast" class="ast">
        <h2>AST</h2>
        <pre v-html="store.ast"></pre>
      </div>
      <div v-if="store.tokens" class="tokens">
        <h2>Tokens</h2>
        <pre v-html="store.tokens"></pre>
      </div>
    </div>
  </div>
</template>

<script>
import { useArgdownStore } from "../store.js";

export default {
  name: "debug-lexer-parser-output",
  computed: {
    store() {
      return useArgdownStore();
    },
  },
};
</script>

<style scoped>
.output .content {
  padding: 1em;
}
</style>
