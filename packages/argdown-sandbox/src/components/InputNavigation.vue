<template>
  <nav class="sub-nav">
    <ul class="nav-list">
      <li>
        <div class="dropdown">
          <button class="text-button dropdown-button">Examples</button>
          <ul class="dropdown-content">
            <li v-for="example in examplesList" :key="example.id">
              <a href="#" @click.prevent="loadExample(example.id)">{{
                example.title
              }}</a>
            </li>
          </ul>
        </div>
      </li>
      <li class="copy-link-item">
        <button class="text-button" @click="copyLink">Copy link</button>
      </li>
      <li class="syntax-control">
        <label for="syntax-mode">Syntax</label>
        <select
          id="syntax-mode"
          :value="activeSyntax"
          :disabled="Boolean(documentSyntax)"
          :title="syntaxControlTitle"
          @change="setSyntax"
        >
          <option value="argdown">Classic</option>
          <option value="argdown+">Argdown+</option>
          <option value="micro-argdown+">Micro</option>
        </select>
        <span
          v-if="documentSyntax"
          class="mode-source"
          title="Set by document frontmatter"
        >
          document
        </span>
      </li>
      <li>
        <router-link
          class="diagnostic-status"
          :class="{ 'has-errors': errorCount, 'has-warnings': warningCount }"
          to="/debug/lexer-parser"
          title="Open diagnostics"
        >
          <span class="diagnostic-long">
            {{ errorCount }} errors · {{ warningCount }} warnings
          </span>
          <span class="diagnostic-short" aria-hidden="true">
            {{ errorCount }} E · {{ warningCount }} W
          </span>
        </router-link>
      </li>
      <li>
        <div class="input-container argvu-font">
          <input
            id="use-argvu"
            :checked="useArgVu"
            type="checkbox"
            @change="toggleArgVu"
          />
          <label for="use-argvu">Use ArgVu font</label>
        </div>
      </li>
    </ul>
    <app-modal v-show="isModalVisible" @close="closeModal">
      <template #header>Successfully copied shareable link</template>
      <template #body>
        <input type="text" :value="link" style="width: 100%" /><br />
        <p>Show other people your Argdown code directly in the Sandbox!</p>
      </template>
    </app-modal>
  </nav>
</template>
<script>
import { ref, computed } from "vue";
import { useArgdownStore } from "../store.js";
import appModal from "./modal.vue";

export default {
  name: "InputNavigation",
  components: {
    appModal: appModal
  },
  setup() {
    const store = useArgdownStore();
    const isModalVisible = ref(false);
    const link = ref("");

    const useArgVu = computed(() => store.useArgVu);
    const examplesList = computed(() => store.examplesList);
    const argdownInput = computed(() => store.argdownInput);
    const activeSyntax = computed(() => store.activeSyntax);
    const documentSyntax = computed(() => store.documentSyntax);
    const errorCount = computed(() => store.errorCount);
    const warningCount = computed(() => store.warningCount);
    const syntaxControlTitle = computed(() =>
      documentSyntax.value
        ? "This document selects its syntax mode in frontmatter"
        : "Select the parser syntax mode"
    );

    async function loadExample(example) {
      try {
        await store.loadExample({ id: example });
        // do stuff
      } catch (error) {
        console.error("Failed to load example:", error);
      }
    }

    function copyLink() {
      const input = encodeURIComponent(argdownInput.value);
      const linkText = `https://argdown.org/sandbox/map/?argdown=${input}`;
      navigator.clipboard.writeText(linkText);
      link.value = linkText;
      showModal();
    }

    function showModal() {
      isModalVisible.value = true;
    }

    function closeModal() {
      isModalVisible.value = false;
    }

    function toggleArgVu(event) {
      store.setUseArgVu(event.target.checked);
    }

    function setSyntax(event) {
      store.setSyntax(event.target.value);
    }

    return {
      isModalVisible,
      link,
      useArgVu,
      examplesList,
      argdownInput,
      activeSyntax,
      documentSyntax,
      errorCount,
      warningCount,
      syntaxControlTitle,
      loadExample,
      copyLink,
      showModal,
      closeModal,
      toggleArgVu,
      setSyntax
    };
  }
};
</script>

<style scoped>
.syntax-control {
  align-items: center;
  gap: 0.35rem;
  padding: 0 0.35rem;
}

.syntax-control label {
  color: #2c3e50;
  font-weight: 500;
}

.syntax-control select {
  height: 2rem;
  border: 1px solid #ccc;
  border-radius: 0.2em;
  background: #fff;
}

.mode-source {
  border-radius: 1em;
  padding: 0.15rem 0.45rem;
  background: #e8f2f6;
  color: #27657e;
  font-size: 0.75rem;
}

.diagnostic-status {
  text-decoration: none;
  white-space: nowrap;
}

.diagnostic-status.has-warnings {
  color: #8a5a00;
}

.diagnostic-status.has-errors {
  color: #b42318;
}

.diagnostic-short {
  display: none;
}

@media (max-width: 1200px) {
  .syntax-control > label,
  .argvu-font,
  .diagnostic-long {
    display: none;
  }

  .diagnostic-short {
    display: inline;
  }

  .diagnostic-status {
    padding-right: 0.4rem;
    padding-left: 0.4rem;
  }
}

@media (max-width: 850px) {
  .copy-link-item,
  .mode-source {
    display: none;
  }
}
</style>
