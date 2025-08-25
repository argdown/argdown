<template>
  <div class="viz-js-output map-output output">
    <div class="content">
      <div ref="container" class="rendered"></div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { useArgdownStore } from '../store.js';
import { EventBus } from "../event-bus.js";
import { saveAsSvg, saveAsPng } from "../map-export.js";
import { VizJsMap } from "@argdown/map-views";

var saveVizAsPng = null;
var saveVizAsSvg = null;

// eslint-disable-next-line no-undef
var basePath = process.env.BASE_URL || "/";

export default {
  name: "viz-js-output",
  setup() {
    const store = useArgdownStore();
    const container = ref(null);
    const vizJsMap = ref(null);
    
    const dot = computed(() => store.dot);
    const configData = computed(() => store.configData);
    const argdownData = computed(() => store.argdownData);
    const pngScale = computed(() => store.pngScale);
    
    function updateMap() {
      if (!vizJsMap.value) {
        return;
      }
      const exceptions = argdownData.value.exceptions;
      if (exceptions && exceptions.length > 0) {
        return;
      }
      let images = undefined;
      if (configData.value.images && configData.value.images.files) {
        images = Object.values(configData.value.images.files);
      }
      const props = {
        dot: dot.value,
        settings: { ...configData.value.vizJs, images },
      };
      vizJsMap.value.render(props).catch((e) => console.log(e));
    }
    
    watch(dot, () => {
      updateMap();
    });
    
    onMounted(() => {
      const svgContainer = container.value;
      const workerURL = basePath + "render.browser.js";
      const vizMap = new VizJsMap(svgContainer, null, {
        workerURL: workerURL,
      });
      vizJsMap.value = vizMap;
      updateMap();
      var el = container.value;
      saveVizAsPng = () => {
        var scale = pngScale.value;
        saveAsPng(el.getElementsByTagName("svg")[0], scale);
      };
      saveVizAsSvg = () => {
        saveAsSvg(el.getElementsByTagName("svg")[0]);
      };
      EventBus.$on("save-map-as-svg", saveVizAsSvg);
      EventBus.$on("save-map-as-png", saveVizAsPng);
    });
    
    onBeforeUnmount(() => {
      EventBus.$off("save-map-as-svg", saveVizAsSvg);
      EventBus.$off("save-map-as-png", saveVizAsPng);
    });
    
    return {
      container,
      vizJsMap,
      dot,
      configData,
      argdownData,
      pngScale,
      updateMap
    };
  }
};
</script>

<style lang="scss" scoped>
.content {
  flex: 1;
  overflow: auto;
  display: flex;
  flex-direction: column;
  height: 100%;
  
  .rendered {
    flex: 1;
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
    /* Firefox bug fix styles */
    min-width: 0;
  }
}
</style>
