<template>
  <nav class="sub-nav">
    <ul class="nav-list">
      <li>
        <div class="dropdown">
          <button class="text-button dropdown-button">Examples</button>
          <ul class="dropdown-content">
            <li v-for="example in examplesList" :key="example.id">
              <a href="#" v-on:click.prevent="loadExample(example.id)">{{
                example.title
              }}</a>
            </li>
          </ul>
        </div>
      </li>
      <li>
        <button class="text-button" v-on:click="copyLink">Copy link</button>
      </li>
      <li>
        <div class="input-container argvu-font">
          <input
            :checked="useArgVu"
            @change="toggleArgVu"
            type="checkbox"
            id="use-argvu"
          />
          <label for="use-argvu">Use ArgVu font</label>
        </div>
      </li>
    </ul>
    <app-modal v-show="isModalVisible" @close="closeModal">
      <template #header>Successfully copied shareable link</template>
      <template #body>
        <input type="text" v-bind:value="link" style="width: 100%" /><br />
        <p>Show other people your Argdown code directly in the Sandbox!</p>
      </template>
    </app-modal>
  </nav>
</template>
<script>
import { ref, computed } from 'vue';
import { useArgdownStore } from '../store.js';
import appModal from "./modal.vue";

export default {
  name: "input-navigation",
  components: {
    appModal: appModal,
  },
  setup() {
    const store = useArgdownStore();
    const isModalVisible = ref(false);
    const link = ref("");
    
    const useArgVu = computed(() => store.useArgVu);
    const examplesList = computed(() => store.examplesList);
    const argdownInput = computed(() => store.argdownInput);
    
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
    
    return {
      isModalVisible,
      link,
      useArgVu,
      examplesList,
      argdownInput,
      loadExample,
      copyLink,
      showModal,
      closeModal,
      toggleArgVu
    };
  }
};
</script>
