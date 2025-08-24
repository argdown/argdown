<template>
  <div class="dagre-d3-output map-output output">
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
import { DagreMap } from "@argdown/map-views";
import "../scss/dagre.css";

var saveDagreAsPng = null;
var saveDagreAsSvg = null;

export default {
  name: "dagre-d3-output",
  setup() {
    const store = useArgdownStore();
    const container = ref(null);
    const dagreD3Map = ref(null);
    
    const map = computed(() => store.map);
    const configData = computed(() => store.configData);
    const argdownData = computed(() => store.argdownData);
    const pngScale = computed(() => store.pngScale);
    
    function updateMap() {
      if (!dagreD3Map.value) {
        return;
      }
      const exceptions = argdownData.value.exceptions;
      if (exceptions && exceptions.length > 0) {
        return;
      }
      const props = {
        settings: configData.value.dagre,
        map: map.value,
      };
      
      try {
        const result = dagreD3Map.value.render(props);
        if (result && typeof result.catch === 'function') {
          result.catch((e) => console.log(e));
        }
      } catch (error) {
        console.log('Error rendering map:', error);
      }
    }
    
    watch(map, () => {
      updateMap();
    });
    
    onMounted(() => {
      const containerEl = container.value;
      
      // Create SVG element
      const svgElement = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svgElement.setAttribute("width", "100%");
      svgElement.setAttribute("height", "100%");
      svgElement.style.display = "block";
      
      // Append SVG to container
      containerEl.appendChild(svgElement);
      
      // Create DagreMap with the SVG element
      const dagreMap = new DagreMap(svgElement);
      dagreD3Map.value = dagreMap;
      updateMap();
      
      var el = containerEl;
      saveDagreAsPng = () => {
        var scale = pngScale.value;
        saveAsPng(el.getElementsByTagName("svg")[0], scale, false);
      };
      saveDagreAsSvg = () => {
        saveAsSvg(el.getElementsByTagName("svg")[0], false);
      };
      EventBus.$on("save-map-as-svg", saveDagreAsSvg);
      EventBus.$on("save-map-as-png", saveDagreAsPng);
    });
    
    onBeforeUnmount(() => {
      EventBus.$off("save-map-as-svg", saveDagreAsSvg);
      EventBus.$off("save-map-as-png", saveDagreAsPng);
    });
    
    return {
      container,
      dagreD3Map,
      map,
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
