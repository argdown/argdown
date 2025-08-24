<template>
  <div class="viz-js-output map-output output">
    <div class="content">
      <div ref="container" class="rendered"></div>
    </div>
  </div>
</template>

<script>
import { EventBus } from "../event-bus.js";
import { saveAsSvg, saveAsPng } from "../map-export.js";
import { VizJsMap } from "@argdown/map-views";

var saveVizAsPng = null;
var saveVizAsSvg = null;

// eslint-disable-next-line no-undef
var basePath = process.env.BASE_URL || "/";

export default {
  name: "viz-js-output",
  data() {
    return {
      vizJsMap: null
    };
  },
  computed: {
    dot() {
      return this.$store.getters.dot;
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
    dot() {
      this.updateMap();
    }
  },
  methods: {
    updateMap() {
      if (!this.vizJsMap) {
        return;
      }
      const exceptions = this.argdownData.exceptions;
      if (exceptions && exceptions.length > 0) {
        return;
      }
      let images = undefined;
      if (this.configData.images && this.configData.images.files) {
        images = Object.values(this.configData.images.files);
      }
      const props = {
        dot: this.dot,
        settings: { ...this.configData.vizJs, images },
      };
      this.vizJsMap.render(props).catch((e) => console.log(e));
    }
  },

  mounted() {
    const svgContainer = this.$refs.container;
    const workerURL = basePath + "render.browser.js";
    const vizMap = new VizJsMap(svgContainer, null, {
      workerURL: workerURL,
    });
    this.vizJsMap = vizMap;
    this.updateMap();
    var el = this.$refs.container;
    saveVizAsPng = () => {
      var scale = this.pngScale;
      saveAsPng(el.getElementsByTagName("svg")[0], scale, false);
    };
    saveVizAsSvg = () => {
      saveAsSvg(el.getElementsByTagName("svg")[0], false);
    };
    EventBus.$on("save-map-as-svg", saveVizAsSvg);
    EventBus.$on("save-map-as-png", saveVizAsPng);
  },
  // eslint-disable-next-line vue/no-deprecated-destroyed-lifecycle
  beforeDestroy() {
    EventBus.$off("save-map-as-svg", saveVizAsSvg);
    EventBus.$off("save-map-as-png", saveVizAsPng);
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
