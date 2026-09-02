<template>
  <div
    class="dagre-d3-output map-output output"
    @click="handleGraphInteraction"
    @keydown="handleGraphKeydown"
  >
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
    <GraphInspector />
  </div>
</template>

<script>
import {
  ref,
  computed,
  watch,
  onMounted,
  onBeforeUnmount,
  nextTick
} from "vue";
import { useArgdownStore } from "../store.js";
import { EventBus } from "../event-bus.js";
import { saveAsSvg, saveAsPng } from "../map-export.js";
import { DagreMap } from "@argdown/map-views";
import "@argdown/map-views/style.css";
import GraphInspector from "./GraphInspector.vue";
import {
  decorateGraph,
  selectionFromEvent,
  syncGraphSelection
} from "../graph-selection.js";

export default {
  name: "DagreD3Output",
  components: { GraphInspector },
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
    const selectedMapElement = computed(() => store.selectedMapElement);

    function decorateRenderedMap() {
      decorateGraph(svgElement.value, map.value, (group) => group.id);
      syncGraphSelection(svgElement.value, selectedMapElement.value);
    }

    function handleGraphInteraction(event) {
      const selection = selectionFromEvent(event);
      if (!selection) return;
      store.selectMapElement(selection);
    }

    function handleGraphKeydown(event) {
      if (event.key !== "Enter" && event.key !== " ") return;
      const selection = selectionFromEvent(event);
      if (!selection) return;
      event.preventDefault();
      store.selectMapElement(selection);
    }

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
      if (exceptions && exceptions.length > 0) {
        svgElement.value?.replaceChildren();
        return;
      }

      const props = {
        settings: configData.value.dagre,
        map: map.value
      };

      try {
        const result = dagreD3Map.value.render(props);
        decorateRenderedMap();
        if (result && typeof result.catch === "function") {
          result
            .then(() => decorateRenderedMap())
            .catch((e) => console.error("Dagre render error:", e));
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

    watch(
      selectedMapElement,
      (selection) => syncGraphSelection(svgElement.value, selection),
      { deep: true }
    );

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
      handleGraphInteraction,
      handleGraphKeydown
    };
  }
};
</script>

<style lang="scss" scoped>
.map-output {
  position: relative;
  display: flex;
  flex-direction: column;
}

:deep(g.node),
:deep(g.edgePath) {
  cursor: pointer;
}

:deep(.edge-hit-target) {
  fill: none !important;
  stroke: transparent !important;
  stroke-width: 14px !important;
  pointer-events: stroke;
}

:deep(g.node:focus-visible),
:deep(g.edgePath:focus-visible) {
  outline: 2px solid #006b8f;
  outline-offset: 3px;
}

:deep(g.node.graph-selected rect) {
  stroke: #006b8f !important;
  stroke-width: 5px !important;
}

:deep(g.edgePath.graph-selected > path:not(.edge-hit-target)) {
  stroke-width: 5px !important;
  filter: drop-shadow(0 0 2px rgb(0 107 143 / 45%));
}

.content {
  flex: 1;
  overflow: auto;
  display: flex;
  flex-direction: column;
  height: auto;

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
