<template>
  <div class="debug-output output">
    <div class="content">
      <section class="diagnostics">
        <h2>Diagnostics ({{ diagnostics.length }})</h2>
        <p v-if="diagnostics.length === 0" class="empty-state">
          No lexer, parser, or semantic diagnostics.
        </p>
        <button
          v-for="(diagnostic, index) in diagnostics"
          :key="`${diagnostic.code}-${index}`"
          type="button"
          class="diagnostic"
          :class="diagnostic.severity"
          :disabled="!diagnostic.startLine"
          @click="navigateToDiagnostic(diagnostic)"
        >
          <span class="severity">{{ diagnostic.severity }}</span>
          <span v-if="diagnostic.startLine" class="location">
            {{ diagnostic.startLine }}:{{ diagnostic.startColumn || 1 }}
          </span>
          <span class="message">
            <strong>{{ diagnostic.code }}</strong>
            {{ diagnostic.message }}
          </span>
        </button>
      </section>
      <details v-if="ast" class="ast">
        <summary>Abstract syntax tree</summary>
        <pre v-html="ast"></pre>
      </details>
      <details v-if="tokens" class="tokens">
        <summary>Tokens</summary>
        <pre v-html="tokens"></pre>
      </details>
    </div>
  </div>
</template>

<script>
import { computed } from "vue";
import { useArgdownStore } from "../store.js";
import { EventBus } from "../event-bus.js";

export default {
  name: "DebugLexerParserOutput",
  setup() {
    const store = useArgdownStore();
    const diagnostics = computed(() => store.diagnostics);
    const ast = computed(() => store.ast);
    const tokens = computed(() => store.tokens);

    function navigateToDiagnostic(diagnostic) {
      EventBus.$emit("navigate-to-diagnostic", diagnostic);
    }

    return { diagnostics, ast, tokens, navigateToDiagnostic };
  }
};
</script>

<style scoped>
.output .content {
  padding: 1em;
}

.diagnostics h2 {
  margin-top: 0;
}

.empty-state {
  color: #587080;
}

.diagnostic {
  display: grid;
  grid-template-columns: 6rem 4rem 1fr;
  width: 100%;
  height: auto;
  margin: 0 0 0.5rem;
  padding: 0.75rem;
  text-align: left;
  border-left-width: 0.35rem;
}

.diagnostic:disabled {
  cursor: default;
  opacity: 1;
}

.diagnostic.error {
  border-left-color: #d92d20;
}

.diagnostic.warning {
  border-left-color: #dc8b00;
}

.diagnostic.information {
  border-left-color: #2878b5;
}

.severity {
  text-transform: capitalize;
}

.location {
  font-family: monospace;
}

details {
  margin-top: 1rem;
}

summary {
  cursor: pointer;
  font-size: 1.1rem;
  font-weight: 500;
}
</style>
