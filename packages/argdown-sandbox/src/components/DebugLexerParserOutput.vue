<template>
  <div class="debug-output output">
    <div class="content">
      <div v-if="lexerErrors && lexerErrors.length > 0" class="lexer-errors">
        <h2>Parser Errors ({{ lexerErrors.length }})</h2>
        <table
          class="lexer-error error"
          v-for="(error, index) in lexerErrors"
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
      <div v-if="parserErrors && parserErrors.length > 0" class="parser-errors">
        <h2>Parser Errors ({{ parserErrors.length }})</h2>
        <table
          class="parser-error error"
          v-for="(error, index) in parserErrors"
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
      <div v-if="ast" class="ast">
        <h2>AST</h2>
        <pre v-html="ast"></pre>
      </div>
      <div v-if="tokens" class="tokens">
        <h2>Tokens</h2>
        <pre v-html="tokens"></pre>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from "vue";
import { useArgdownStore } from "../store.js";

export default {
  name: "debug-lexer-parser-output",
  setup() {
    const store = useArgdownStore();
    const lexerErrors = computed(() => store.lexerErrors);
    const parserErrors = computed(() => store.parserErrors);
    const ast = computed(() => store.ast);
    const tokens = computed(() => store.tokens);

    return { lexerErrors, parserErrors, ast, tokens };
  },
};
</script>

<style scoped>
.output .content {
  padding: 1em;
}
</style>
