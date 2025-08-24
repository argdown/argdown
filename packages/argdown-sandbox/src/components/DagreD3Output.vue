<template>
  <div class="dagre-d3-output map-output output">
    <div class="content">
      <div ref="container" class="rendered"></div>
    </div>
  </div>
</template>

<script>
import { EventBus } from "../event-bus.js";
import { saveAsSvg, saveAsPng } from "../map-export.js";
import { DagreMap } from "@argdown/map-views";
import "../scss/dagre.css";

var saveDagreAsPng = null;
var saveDagreAsSvg = null;

export default {
  name: "dagre-d3-output",
  data() {
    return {
      dagreD3Map: null
    };
  },
  computed: {
    map() {
      return this.$store.getters.map;
    },
    configData() {
      return this.$store.getters.configData;
    },
    argdownData() {
      return this.$store.getters.argdownData;
    },
    pngScale() {
      return this.$store.state.pngScale;
    }
  },
  watch: {
    map() {
      this.updateMap();
    }
  },
  methods: {
    updateMap() {
      if (!this.dagreD3Map) {
        return;
      }
      const exceptions = this.argdownData.exceptions;
      if (exceptions && exceptions.length > 0) {
        return;
      }
      const props = {
        settings: this.configData.dagre,
        map: this.map,
      };
      
      try {
        const result = this.dagreD3Map.render(props);
        if (result && typeof result.catch === 'function') {
          result.catch((e) => console.log(e));
        }
      } catch (error) {
        console.log('Error rendering map:', error);
      }
    }
  },

  mounted() {
    const container = this.$refs.container;
    
    // Create SVG element
    const svgElement = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svgElement.setAttribute("width", "100%");
    svgElement.setAttribute("height", "100%");
    svgElement.style.display = "block";
    
    // Append SVG to container
    container.appendChild(svgElement);
    
    // Create DagreMap with the SVG element
    const dagreMap = new DagreMap(svgElement);
    this.dagreD3Map = dagreMap;
    this.updateMap();
    
    var el = this.$refs.container;
    saveDagreAsPng = () => {
      var scale = this.pngScale;
      saveAsPng(el.getElementsByTagName("svg")[0], scale, false);
    };
    saveDagreAsSvg = () => {
      saveAsSvg(el.getElementsByTagName("svg")[0], false);
    };
    EventBus.$on("save-map-as-svg", saveDagreAsSvg);
    EventBus.$on("save-map-as-png", saveDagreAsPng);
  },
  // eslint-disable-next-line vue/no-deprecated-destroyed-lifecycle
  beforeDestroy() {
    EventBus.$off("save-map-as-svg", saveDagreAsSvg);
    EventBus.$off("save-map-as-png", saveDagreAsPng);
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
