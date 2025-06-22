<template>
  <div class="dagre-d3-output map-output output">
    <div class="content">
      <div ref="container" class="rendered"></div>
    </div>
  </div>
</template>

<script>
import { useArgdownStore } from "../store.js";
import { EventBus } from "../event-bus.js";
import { saveAsSvg, saveAsPng } from "../map-export.js";
import { DagreMap } from "@argdown/map-views";

var saveDagreAsPng = null;
var saveDagreAsSvg = null;

export default {
  name: "dagre-d3-output",
  computed: {
    store() {
      return useArgdownStore();
    },
    map() {
      this.updateMap();
      this.store.configData;
      this.store.configData;
      return this.store.map;
    },
    settings() {
      return this.store.configData.dagre;
    },
  },
  methods: {
    updateMap() {
      if (!this.$_dagreD3Map) {
        return;
      }
      const exceptions = this.store.argdownData.exceptions;
      if (exceptions && exceptions.length > 0) {
        return;
      }
      const props = {
        settings: this.store.configData.dagre,
        map: this.store.map,
      };
      this.$_dagreD3Map.render(props).catch((e) => console.log(e));
    },
  },
  watch: {
    map() {
      // console.log('map watcher called!')
    },
  },

  mounted() {
    const svgContainer = this.$refs.container;
    this.$_dagreD3Map = new DagreMap(svgContainer);
    this.updateMap();
    var el = this.$refs.container;
    var store = this.store;
    saveDagreAsPng = function () {
      var scale = store.pngScale;
      saveAsPng(el.getElementsByTagName("svg")[0], scale, false);
    };
    saveDagreAsSvg = function () {
      saveAsSvg(el.getElementsByTagName("svg")[0], false);
    };
    EventBus.$on("save-map-as-svg", saveDagreAsSvg);
    EventBus.$on("save-map-as-png", saveDagreAsPng);
  },
  beforeUnmount() {
    EventBus.$off("save-map-as-svg", saveDagreAsSvg);
    EventBus.$off("save-map-as-png", saveDagreAsPng);
  },
};
</script>

<style lang="scss" scoped>
.content {
  flex: 1;
  overflow: auto;
  .rendered {
    flex: 1;
    display: flex;
    flex-direction: column;
    /* Firefox bug fix styles */
    min-width: 0;
    min-height: 0;
  }
}
</style>
