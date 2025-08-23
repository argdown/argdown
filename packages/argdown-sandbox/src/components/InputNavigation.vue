<template>
  <nav class="sub-nav">
    <ul class="nav-list">
      <li>
        <div class="dropdown">
          <button class="text-button dropdown-button">Examples</button>
          <ul class="dropdown-content">
            <li v-for="example in store.examplesList" :key="example.id">
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
import { useArgdownStore } from "../store.js";
import { storeToRefs } from "pinia";
import { ref } from "vue";
import appModal from "./modal.vue";

export default {
  name: "input-navigation",
  components: {
    appModal: appModal,
  },
  setup() {
    const store = useArgdownStore();
    const { useArgVu, argdownInput, examplesList } = storeToRefs(store);
    
    const isModalVisible = ref(false);
    const link = ref("");
    
    const loadExample = async (example) => {
      try {
        await store.loadExample({ id: example });
        // do stuff
      } catch (error) {
        console.error("Failed to load example:", error);
      }
    };
    
    const copyLink = () => {
      const input = encodeURIComponent(argdownInput.value);
      const linkText = `https://argdown.org/sandbox/map/?argdown=${input}`;
      navigator.clipboard.writeText(linkText);
      link.value = linkText;
      showModal();
    };
    
    const showModal = () => {
      isModalVisible.value = true;
    };
    
    const closeModal = () => {
      isModalVisible.value = false;
    };
    
    const toggleArgVu = (event) => {
      store.setUseArgVu(event.target.checked);
    };
    
    return {
      store,
      useArgVu,
      examplesList,
      isModalVisible,
      link,
      loadExample,
      copyLink,
      showModal,
      closeModal,
      toggleArgVu
    };
  },
};
</script>
