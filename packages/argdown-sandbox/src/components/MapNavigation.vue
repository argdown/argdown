<template>
  <nav class="sub-nav">
    <ul class="nav-list">
      <li>
        <router-link to="/map/viz-js">Viz Js Map</router-link>
      </li>
      <li>
        <router-link to="/map/dagre-d3">Dagre D3 Map</router-link>
      </li>
      <li>
        <router-link to="/map/dot">Dot Source</router-link>
      </li>
      <li>
        <router-link to="/map/graphml">GraphML Source</router-link>
      </li>
      <!-- <li><router-link to="/map/graphml">GraphML Source</router-link></li> -->
      <li
        v-if="$route.name == 'map-viz-js' || $route.name == 'map-dagre-d3'"
        class="save-map"
      >
        save map as
        <a class="save-as-svg" href @click.stop.prevent="saveAsSvg">svg</a>
        <a class="save as png" href @click.stop.prevent="openSaveAsPngDialog"
          >png</a
        >
      </li>
    </ul>
    <div v-if="showSaveAsPngDialog" class="save-as-png-dialog">
      <h3>PNG Export</h3>
      <label for="save-as-png-scale"
        >Scale
        <input
          id="save-as-png-scale"
          v-model="pngScale"
          type="number"
          min="0"
          max="100"
      /></label>

      <div class="submit-cancel">
        <button type="button" @click.prevent.stop="saveAsPng">
          Create PNG
        </button>
        <button type="button" @click.prevent.stop="closeSaveAsPngDialog">
          Cancel
        </button>
      </div>
    </div>
  </nav>
</template>

<script>
import { computed } from "vue";
import { useRoute } from "vue-router";
import { useArgdownStore } from "../store.js";
import { EventBus } from "../event-bus.js";

export default {
  setup() {
    const route = useRoute();
    const store = useArgdownStore();

    const currentRoute = computed(() => route);
    const showSaveAsPngDialog = computed(() => store.showSaveAsPngDialog);
    const pngScale = computed(() => store.pngScale);

    function saveAsSvg() {
      EventBus.$emit("save-map-as-svg");
    }

    function saveAsPng() {
      EventBus.$emit("save-map-as-png");
      store.closeSaveAsPngDialog();
    }

    function openSaveAsPngDialog() {
      store.openSaveAsPngDialog();
    }

    function closeSaveAsPngDialog() {
      store.closeSaveAsPngDialog();
    }

    return {
      currentRoute,
      saveAsSvg,
      saveAsPng,
      openSaveAsPngDialog,
      showSaveAsPngDialog,
      pngScale,
      closeSaveAsPngDialog
    };
  }
};
</script>

<style lang="scss" scoped>
.save-map {
  border-left: 1px solid #eee;
  color: #999;
  padding-left: 1em;
  display: flex;
  align-items: center;
}
.save-as-png-dialog {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 10000;
  width: 300px;
  background-color: #fff;
  border: 2px solid #264260;
  border-radius: 5px;
  padding: 1rem 2rem 1rem 2rem;
  font-size: 1.2em;
  display: flex;
  flex-direction: column;
  gap: 10px;
  h3 {
    font-weight: bold;
  }
  label {
    /* margin-right: 0 1em; */
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  input {
    font-size: 1em;
    padding: 0.25em;
  }
  .submit-cancel {
    display: flex;
    justify-content: space-between;
    width: 100%;
  }
  button {
    font-size: 1em;
    padding: 0.5em 1em;
    text-wrap: nowrap;
    margin: 0;
  }
}
</style>
