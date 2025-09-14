<template>
  <div class="dagre-d3-output map-output output">
    <div class="content">
      <div ref="container" class="rendered">
        <svg
          ref="svgElement"
          width="100%"
          height="100%"
          style="display: block"
        ></svg>
      </div>
    </div>
  </div>
</template>

<script>
import {
  ref,
  computed,
  watch,
  onMounted,
  onBeforeUnmount,
  nextTick,
} from "vue";
import { useArgdownStore } from "../store.js";
import { EventBus } from "../event-bus.js";
import { saveAsSvg, saveAsPng } from "../map-export.js";
import { DagreMap } from "@argdown/map-views";
import "../scss/dagre.css";

export default {
  name: "dagre-d3-output",
  setup() {
    const store = useArgdownStore();
    const container = ref(null);
    const svgElement = ref(null);
    const dagreD3Map = ref(null);
    const isInitializing = ref(false);

    // Computed properties
    const map = computed(() => store.map);
    const configData = computed(() => store.configData);
    const argdownData = computed(() => store.argdownData);
    const pngScale = computed(() => store.pngScale);

    // Export functions
    const saveDagreAsPng = () => {
      if (!svgElement.value) {
        console.warn("PNG export: No SVG element found for Dagre map.");
        return;
      }
      const scaleNum = parseFloat(pngScale.value) || 1;
      saveAsPng(svgElement.value, scaleNum, true);
    };

    const saveDagreAsSvg = () => {
      if (!svgElement.value) {
        console.warn("SVG export: No SVG element found for Dagre map.");
        return;
      }
      saveAsSvg(svgElement.value, true);
    };

    // Initialize SVG dimensions
    function updateSvgDimensions() {
      if (!container.value) return;

      const rect = container.value.getBoundingClientRect();
      let width = rect.width;
      let height = rect.height;

      // Ensure valid dimensions
      if (!width || width <= 0 || isNaN(width)) {
        width = 800;
      }
      if (!height || height <= 0 || isNaN(height)) {
        height = 600;
      }

      // Ensure minimum dimensions
      width = Math.max(width, 100);
      height = Math.max(height, 100);

      if (svgElement.value) {
        svgElement.value.setAttribute("width", width);
        svgElement.value.setAttribute("height", height);
      }
    }

    // Initialize Dagre map
    function initializeMap() {
      if (isInitializing.value || !svgElement.value) return;

      isInitializing.value = true;

      try {
        dagreD3Map.value = new DagreMap(svgElement.value);
        renderMap();
      } catch (error) {
        console.error("Failed to initialize Dagre map:", error);
      } finally {
        isInitializing.value = false;
      }
    }

    // Render map
    function renderMap() {
      if (!dagreD3Map.value) return;

      const exceptions = argdownData.value.exceptions;
      if (exceptions && exceptions.length > 0) return;

      const props = {
        settings: configData.value.dagre,
        map: map.value,
      };

      try {
        const result = dagreD3Map.value.render(props);
        if (result && typeof result.catch === "function") {
          result.catch((e) => console.error("Dagre render error:", e));
        }
      } catch (error) {
        console.error("Error rendering Dagre map:", error);
      }
    }

    // Watchers
    watch(map, () => {
      if (!isInitializing.value) {
        renderMap();
      }
    });

    // Lifecycle
    onMounted(() => {
      nextTick(() => {
        updateSvgDimensions();
        // Wait a bit more to ensure dimensions are stable
        setTimeout(() => {
          initializeMap();
          // Set up event listeners after initialization
          EventBus.$on("save-map-as-svg", saveDagreAsSvg);
          EventBus.$on("save-map-as-png", saveDagreAsPng);
        }, 50);
      });
    });

    onBeforeUnmount(() => {
      EventBus.$off("save-map-as-svg", saveDagreAsSvg);
      EventBus.$off("save-map-as-png", saveDagreAsPng);
    });

    return {
      container,
      svgElement,
      map,
      configData,
      argdownData,
      pngScale,
    };
  },
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
