<template>
  <div class="settings">
    <h3>Model Settings</h3>
    <div class="setting">
      <label for="removeTagsFromText">Remove tags from text</label>
      <input
        type="checkbox"
        id="removeTagsFromText"
        v-model="config.model.removeTagsFromText"
      />
    </div>
    <h3>Selection Settings</h3>
    <div class="setting">
      <label for="excludeDisconnected">Exclude disconnected statements</label>
      <input
        type="checkbox"
        id="excludeDisconnected"
        v-model="config.selection.excludeDisconnected"
      />
    </div>
    <div class="setting">
      <label for="statementSelectionMode">Statement selection mode</label>
      <select
        id="statementSelectionMode"
        v-model="config.selection.statementSelectionMode"
      >
        <option value="WITH_TITLE">With title</option>
        <option value="WITHOUT_TITLE">Without title</option>
        <option value="ALL">All</option>
      </select>
    </div>
    <h3>Map Settings</h3>
    <div class="setting">
      <label for="argumentLabelMode">Argument label mode</label>
      <select
        id="argumentLabelMode"
        v-model="config.map.argumentLabelMode"
      >
        <option value="HIDE_UNTITLED">Hide untitled</option>
        <option value="SHOW_TITLE">Show title</option>
        <option value="SHOW_TITLE_IF_DIFFERENT">Show title if different</option>
      </select>
    </div>
    <div class="setting">
      <label for="statementLabelMode">Statement label mode</label>
      <select
        id="statementLabelMode"
        v-model="config.map.statementLabelMode"
      >
        <option value="HIDE_UNTITLED">Hide untitled</option>
        <option value="SHOW_TITLE">Show title</option>
        <option value="SHOW_TITLE_IF_DIFFERENT">Show title if different</option>
      </select>
    </div>
    <div class="setting">
      <label for="groupDepth">Group depth</label>
      <input
        id="groupDepth"
        type="number"
        v-model="config.map.groupDepth"
      />
    </div>
    <h3>GraphViz Settings</h3>
    <div class="setting">
      <label for="graphVizRankDir">Rank direction</label>
      <select
        id="graphVizRankDir"
        v-model="config.dot.graphVizSettings.rankdir"
      >
        <option value="TB">Top to bottom</option>
        <option value="BT">Bottom to top</option>
        <option value="LR">Left to right</option>
        <option value="RL">Right to left</option>
      </select>
    </div>
    <div class="setting">
      <label for="graphVizConcentrate">Concentrate edges</label>
      <input
        type="checkbox"
        id="graphVizConcentrate"
        v-model="config.dot.graphVizSettings.concentrate"
      />
    </div>
    <div class="setting">
      <label for="graphVizRatio">Ratio</label>
      <input
        id="graphVizRatio"
        type="text"
        v-model="config.dot.graphVizSettings.ratio"
      />
    </div>
    <div class="setting">
      <label for="graphVizSize">Size</label>
      <input
        id="graphVizSize"
        type="text"
        v-model="config.dot.graphVizSettings.size"
      />
    </div>
  </div>
</template>

<script>
import { computed } from 'vue';
import { useArgdownStore } from '../store.js';

export default {
  name: "settings",
  setup() {
    const store = useArgdownStore();
    const config = computed(() => store.configData);
    
    return { config };
  }
};
</script>

<style scoped>
.settings {
  padding: 1rem;
}
.setting {
  margin-bottom: 1rem;
}
.setting label {
  display: inline-block;
  width: 200px;
  margin-right: 1rem;
}
</style>
