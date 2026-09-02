<template>
  <div
    class="viz-js-output map-output output"
    @click="handleGraphInteraction"
    @keydown="handleGraphKeydown"
  >
    <div class="content">
      <div ref="container" class="rendered">
        <svg
          ref="svgElement"
          :width="svgWidth"
          :height="svgHeight"
          :viewBox="`0 0 ${svgWidth} ${svgHeight}`"
          style="display: block; width: 100%; height: 100%; overflow: visible"
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
import { VizJsMap } from "@argdown/map-views";
import GraphInspector from "./GraphInspector.vue";
import {
  decorateGraph,
  selectionFromEvent,
  syncGraphFilters,
  syncGraphSelection
} from "../graph-selection.js";

export default {
  name: "VizJsOutput",
  components: { GraphInspector },
  setup() {
    const store = useArgdownStore();
    const container = ref(null);
    const svgElement = ref(null);
    const vizJsMap = ref(null);
    const isInitializing = ref(false);

    // Reactive SVG dimensions
    const svgWidth = ref(800);
    const svgHeight = ref(600);

    // Computed properties
    const dot = computed(() => store.dot);
    const configData = computed(() => store.configData);
    const argdownData = computed(() => store.argdownData);
    const pngScale = computed(() => store.pngScale);
    const map = computed(() => store.map);
    const selectedMapElement = computed(() => store.selectedMapElement);
    const graphFilters = computed(() => store.graphFilters);

    function decorateRenderedMap() {
      decorateGraph(svgElement.value, map.value);
      syncGraphFilters(svgElement.value, graphFilters.value);
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

    // Export functions - defined at component scope
    const saveVizAsPng = () => {
      if (!svgElement.value) {
        console.warn("PNG export: No SVG element found for Viz.js map.");
        return;
      }
      const scaleNum = parseFloat(pngScale.value) || 1;
      saveAsPng(svgElement.value, scaleNum, false);
    };

    const saveVizAsSvg = () => {
      if (!svgElement.value) {
        console.warn("SVG export: No SVG element found for Viz.js map.");
        return;
      }
      saveAsSvg(svgElement.value, false);
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

      svgWidth.value = width;
      svgHeight.value = height;
    }

    function refitMapAfterLayoutChange() {
      nextTick(() => {
        requestAnimationFrame(() => {
          updateSvgDimensions();
          nextTick(() => vizJsMap.value?.zoomManager.showAllAndCenterMap());
        });
      });
    }

    function handleResize() {
      refitMapAfterLayoutChange();
    }

    // Initialize Viz.js map
    function initializeMap() {
      if (isInitializing.value || !svgElement.value) return;

      isInitializing.value = true;

      try {
        // Verify SVG dimensions before initializing
        const width = parseFloat(svgElement.value.getAttribute("width"));
        const height = parseFloat(svgElement.value.getAttribute("height"));

        if (isNaN(width) || isNaN(height) || width <= 0 || height <= 0) {
          setTimeout(() => {
            isInitializing.value = false;
            updateSvgDimensions();
            initializeMap();
          }, 100);
          return;
        }

        vizJsMap.value = new VizJsMap(svgElement.value);

        // Initial render
        renderMap();
      } catch (error) {
        console.error("Failed to initialize Viz.js map:", error);
      } finally {
        isInitializing.value = false;
      }
    }

    // Render map
    function renderMap() {
      if (!vizJsMap.value) return;

      const exceptions = argdownData.value.exceptions;
      if ((exceptions && exceptions.length > 0) || !dot.value) {
        svgElement.value?.replaceChildren();
        return;
      }

      // Verify SVG dimensions before rendering
      if (!svgElement.value) {
        return;
      }

      const width = parseFloat(svgElement.value.getAttribute("width"));
      const height = parseFloat(svgElement.value.getAttribute("height"));

      if (isNaN(width) || isNaN(height) || width <= 0 || height <= 0) {
        return;
      }

      let images = undefined;
      if (configData.value.images && configData.value.images.files) {
        images = Object.values(configData.value.images.files);
      }

      const props = {
        dot: dot.value,
        settings: { ...configData.value.vizJs, images }
      };

      vizJsMap.value
        .render(props)
        .then(() => decorateRenderedMap())
        .catch((error) => {
          svgElement.value?.replaceChildren();
          console.error("Viz.js render error:", error);
          // If render fails due to dimension issues, try reinitializing
          if (error.message && error.message.includes("NaN")) {
            setTimeout(() => {
              updateSvgDimensions();
              initializeMap();
            }, 200);
          }
        });
    }

    // Watchers
    watch(dot, () => {
      if (!isInitializing.value) {
        renderMap();
      }
    });

    watch(
      selectedMapElement,
      (selection, previousSelection) => {
        syncGraphSelection(svgElement.value, selection);
        if (Boolean(selection) !== Boolean(previousSelection)) {
          refitMapAfterLayoutChange();
        }
      },
      { deep: true }
    );

    watch(
      graphFilters,
      (filters) => syncGraphFilters(svgElement.value, filters),
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
          EventBus.$on("save-map-as-svg", saveVizAsSvg);
          EventBus.$on("save-map-as-png", saveVizAsPng);
          window.addEventListener("resize", handleResize);
        }, 50);
      });
    });

    onBeforeUnmount(() => {
      EventBus.$off("save-map-as-svg", saveVizAsSvg);
      EventBus.$off("save-map-as-png", saveVizAsPng);
      window.removeEventListener("resize", handleResize);

      if (vizJsMap.value) {
        vizJsMap.value = null;
      }
    });

    return {
      container,
      svgElement,
      svgWidth,
      svgHeight,
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
:deep(g.cluster),
:deep(g.edge) {
  cursor: pointer;
}

:deep(.graph-filtered-out:not(.graph-selected)) {
  opacity: 0.12;
  pointer-events: none;
}

:deep(.edge-hit-target) {
  fill: none !important;
  stroke: transparent !important;
  stroke-width: 14px !important;
  pointer-events: stroke;
}

:deep(g.node:focus-visible),
:deep(g.cluster:focus-visible),
:deep(g.edge:focus-visible) {
  outline: 2px solid #006b8f;
  outline-offset: 3px;
}

:deep(g.node.graph-selected path),
:deep(g.node.graph-selected polygon),
:deep(g.node.graph-selected ellipse) {
  stroke: #006b8f !important;
  stroke-width: 5px !important;
}

:deep(g.cluster.graph-selected path),
:deep(g.cluster.graph-selected polygon) {
  stroke: #006b8f !important;
  stroke-width: 5px !important;
}

:deep(g.edge.graph-selected path:not(.edge-hit-target)) {
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
    min-width: 0;
  }
}
</style>
