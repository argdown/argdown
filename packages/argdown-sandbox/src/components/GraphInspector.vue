<template>
  <div class="graph-tools" :class="{ 'has-selection': selectedItem }">
    <details class="graph-legend">
      <summary>Legend</summary>
      <div class="legend-content">
        <section>
          <h3>Nodes</h3>
          <div class="legend-grid">
            <button
              v-for="item in visibleNodeTypes"
              :key="item.key"
              type="button"
              class="legend-item"
              :class="{ active: nodeFilterActive(item.key) }"
              :aria-pressed="nodeFilterActive(item.key)"
              :title="`Focus ${item.label.toLowerCase()} nodes`"
              @click="store.toggleGraphFilter('nodeTypes', item.key)"
            >
              <span class="node-swatch" :class="item.key"></span>
              {{ item.label }}
            </button>
          </div>
        </section>
        <section v-if="visibleRelations.length">
          <h3>Relations</h3>
          <div class="legend-grid relations">
            <button
              v-for="item in visibleRelations"
              :key="item.key"
              type="button"
              class="legend-item"
              :class="{ active: relationFilterActive(item.key) }"
              :aria-pressed="relationFilterActive(item.key)"
              :title="`Focus ${item.label.toLowerCase()} relations`"
              @click="store.toggleGraphFilter('relationTypes', item.key)"
            >
              <span
                class="relation-swatch"
                :class="{ weak: item.weak }"
                :style="{ borderColor: item.color }"
              ></span>
              {{ item.label }}
            </button>
          </div>
        </section>
        <button
          v-if="hasGraphFilters"
          type="button"
          class="clear-filters"
          @click="store.clearGraphFilters()"
        >
          Show all
        </button>
      </div>
    </details>

    <aside v-if="selectedItem" class="graph-inspector" aria-live="polite">
      <header>
        <div>
          <span class="eyebrow">{{ selectedItem.typeLabel }}</span>
          <h2>{{ selectedItem.title }}</h2>
        </div>
        <button
          type="button"
          aria-label="Close graph inspector"
          @click="store.clearMapSelection()"
        >
          ×
        </button>
      </header>

      <p v-if="selectedItem.text" class="description">
        {{ selectedItem.text }}
      </p>
      <p v-if="selectedItem.context" class="context">
        {{ selectedItem.context }}
      </p>
      <dl>
        <template v-if="selectedItem.from">
          <dt>From</dt>
          <dd>{{ selectedItem.from }}</dd>
          <dt>To</dt>
          <dd>{{ selectedItem.to }}</dd>
        </template>
        <template v-if="selectedItem.aliases?.length">
          <dt>Aliases</dt>
          <dd>{{ selectedItem.aliases.join(", ") }}</dd>
        </template>
        <template v-if="selectedItem.tags?.length">
          <dt>Tags</dt>
          <dd>{{ selectedItem.tags.join(", ") }}</dd>
        </template>
        <template v-if="selectedItem.occurrenceCount > 1">
          <dt>Occurrences</dt>
          <dd>{{ selectedItem.occurrenceCount }}</dd>
        </template>
      </dl>
      <section
        v-if="selectedItem.occurrences.length"
        class="source-occurrences"
      >
        <h3>Source occurrences</h3>
        <div class="occurrence-list">
          <button
            v-for="occurrence in selectedItem.occurrences"
            :key="occurrence.key"
            type="button"
            :disabled="!occurrence.startLine"
            @click="navigateToSource(occurrence)"
          >
            <span class="occurrence-line">
              {{
                occurrence.startLine
                  ? `Line ${occurrence.startLine}`
                  : "Location unavailable"
              }}
            </span>
            <span v-if="occurrence.label" class="occurrence-label">
              {{ occurrence.label }}
            </span>
          </button>
        </div>
      </section>
    </aside>
  </div>
</template>

<script>
import { computed } from "vue";
import { useArgdownStore } from "../store.js";
import { EventBus } from "../event-bus.js";

const nodeTypes = {
  statement: { key: "statement", label: "Statement" },
  argument: { key: "argument", label: "Argument" },
  group: { key: "group", label: "Group" },
  question: { key: "question", label: "Question" },
  reference: { key: "reference", label: "Reference" },
  excerpt: { key: "excerpt", label: "Excerpt" }
};

const relationTypes = {
  support: { label: "Supports", color: "#00a651" },
  justifies: { label: "Justifies", color: "#00a651" },
  entails: { label: "Entails", color: "#9ccc65" },
  implies: { label: "Implies", color: "#9ccc65" },
  attack: { label: "Attacks", color: "#d92d20" },
  contrary: { label: "Contrary", color: "#d92d20" },
  contradictory: { label: "Contradictory", color: "#d92d20" },
  undercut: { label: "Undercuts", color: "#7b3fb4" },
  answers: { label: "Answers", color: "#fb8c00" },
  questions: { label: "Questions", color: "#8d4f39", weak: true },
  "is-cited-by": { label: "Cited by", color: "#7e57c2", weak: true },
  "is-presupposed-by": { label: "Presupposed by", color: "#d1a100" },
  specifies: { label: "Specifies", color: "#1aa89a" },
  "is-example-for": {
    label: "Example for",
    color: "#4caf50",
    weak: true
  },
  equal: { label: "Equal", color: "#42a5f5" },
  "potentially-equal": {
    label: "Potentially equal",
    color: "#64b5f6",
    weak: true
  }
};

function flattenNodes(nodes, result = []) {
  for (const node of nodes || []) {
    result.push(node);
    if (node.children) flattenNodes(node.children, result);
  }
  return result;
}

function canonicalMember(entity) {
  return (
    entity?.canonicalMember ||
    entity?.members?.find((member) => !member.isReference && member.text) ||
    entity?.members?.[0]
  );
}

function nodeType(node) {
  if (node.type === "argument-map-node") return "argument";
  if (node.type === "group-map-node") return "group";
  return node.discussionPointType || "statement";
}

function sourceOccurrences(items) {
  return (items || []).map((occurrence, index) => ({
    key: `${occurrence.startLine || "unknown"}-${occurrence.startColumn || 0}-${index}`,
    startLine: occurrence.startLine,
    startColumn: occurrence.startColumn || 1,
    endLine: occurrence.endLine,
    label:
      occurrence.contextualText ||
      occurrence.text ||
      (occurrence.isReference ? "Reference" : "")
  }));
}

export default {
  name: "GraphInspector",
  setup() {
    const store = useArgdownStore();
    const flatNodes = computed(() => flattenNodes(store.map?.nodes || []));
    const hasGraphFilters = computed(
      () =>
        store.graphFilters.nodeTypes.length > 0 ||
        store.graphFilters.relationTypes.length > 0
    );

    const visibleNodeTypes = computed(() => {
      const keys = new Set(flatNodes.value.map(nodeType));
      return [...keys]
        .map((key) => nodeTypes[key] || nodeTypes.statement)
        .filter((item, index, items) => items.indexOf(item) === index);
    });

    const visibleRelations = computed(() => {
      const keys = new Set(
        (store.map?.edges || []).map((edge) => edge.relationType)
      );
      return [...keys].map((key) => ({
        key,
        label: relationTypes[key]?.label || key,
        color: relationTypes[key]?.color || "#667085",
        weak: relationTypes[key]?.weak || false
      }));
    });

    const selectedItem = computed(() => {
      const selection = store.selectedMapElement;
      if (!selection) return null;

      if (selection.kind === "edge") {
        const edge = store.map?.edges?.find((item) => item.id === selection.id);
        if (!edge) return null;
        const occurrences = sourceOccurrences(edge.relationOccurrences);
        const relation = relationTypes[edge.relationType];
        return {
          typeLabel: "Relation",
          title: relation?.label || edge.relationType,
          from: edge.from.labelTitle || edge.from.title,
          to: edge.to.labelTitle || edge.to.title,
          context: edge.contextualText,
          occurrences,
          occurrenceCount: occurrences.length
        };
      }

      const node = flatNodes.value.find((item) => item.id === selection.id);
      if (!node) return null;
      const type = nodeType(node);
      const entity =
        node.type === "argument-map-node"
          ? store.argdownData.arguments?.[node.title]
          : store.argdownData.statements?.[node.title];
      const member = canonicalMember(entity);
      const occurrences = sourceOccurrences(
        entity?.members || (node.section ? [node.section] : [])
      );
      return {
        typeLabel: nodeTypes[type]?.label || "Statement",
        title: node.labelTitle || node.title || "Untitled",
        text: node.labelText || member?.text,
        aliases: node.aliases,
        tags: node.tags,
        occurrences,
        occurrenceCount: occurrences.length
      };
    });

    function navigateToSource(occurrence) {
      if (!occurrence?.startLine) return;
      EventBus.$emit("navigate-to-source", {
        startLine: occurrence.startLine,
        startColumn: occurrence.startColumn || 1
      });
    }

    function nodeFilterActive(type) {
      return store.graphFilters.nodeTypes.includes(type);
    }

    function relationFilterActive(type) {
      return store.graphFilters.relationTypes.includes(type);
    }

    return {
      store,
      visibleNodeTypes,
      visibleRelations,
      selectedItem,
      hasGraphFilters,
      nodeFilterActive,
      relationFilterActive,
      navigateToSource
    };
  }
};
</script>

<style scoped>
.graph-tools {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  z-index: 5;
  display: flex;
  max-width: min(19rem, calc(100% - 1.5rem));
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
  color: #24364b;
  font-family: Arial, sans-serif;
}

.graph-tools.has-selection {
  position: relative;
  inset: auto;
  z-index: 5;
  width: 100%;
  max-width: none;
  flex: 0 0 auto;
  flex-direction: row-reverse;
  align-items: flex-start;
  gap: 0.6rem;
  box-sizing: border-box;
  padding: 0.55rem 0.75rem;
  border-top: 1px solid #dce4eb;
  background: #f7fafc;
}

.graph-legend,
.graph-inspector {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid #cad5df;
  border-radius: 0.45rem;
  background: rgb(255 255 255 / 96%);
  box-shadow: 0 0.25rem 1rem rgb(36 54 75 / 14%);
}

.graph-legend {
  position: relative;
  width: auto;
  min-width: 5.5rem;
}

.has-selection .graph-legend {
  flex: 0 0 auto;
}

.graph-legend summary {
  padding: 0.45rem 0.65rem;
  cursor: pointer;
  font-weight: 600;
  list-style-position: inside;
}

.legend-content {
  width: 17rem;
  max-height: 18rem;
  overflow: auto;
  padding: 0 0.75rem 0.75rem;
}

.has-selection .legend-content {
  position: absolute;
  right: 0;
  bottom: calc(100% + 0.45rem);
  box-sizing: border-box;
  border: 1px solid #cad5df;
  border-radius: 0.45rem;
  background: #fff;
  box-shadow: 0 0.25rem 1rem rgb(36 54 75 / 14%);
}

.legend-content section + section {
  margin-top: 0.7rem;
}

.legend-content h3 {
  margin: 0 0 0.35rem;
  color: #607287;
  font-size: 0.72rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.legend-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.35rem 0.65rem;
  font-size: 0.8rem;
}

.legend-item {
  display: flex;
  width: 100%;
  height: auto;
  align-items: center;
  gap: 0.35rem;
  margin: 0;
  padding: 0.25rem 0.3rem;
  border: 1px solid transparent;
  background: transparent;
  color: inherit;
  font-size: inherit;
  text-align: left;
}

.legend-item:hover,
.legend-item:focus-visible {
  border-color: #8bb8ca;
  background: #eef8fc;
}

.legend-item.active {
  border-color: #3e8eaf;
  background: #dff2f9;
  color: #194f65;
  font-weight: 600;
}

.clear-filters {
  width: 100%;
  height: auto;
  margin: 0.7rem 0 0;
  justify-content: center;
  padding: 0.35rem 0.5rem;
  border-color: #8bb8ca;
  background: #eef8fc;
  color: #27657e;
  font-weight: 600;
}

.node-swatch {
  width: 1.25rem;
  height: 0.75rem;
  box-sizing: border-box;
  border: 2px solid #1b9e77;
  border-radius: 0.2rem;
  background: white;
}

.node-swatch.argument {
  border-color: #111;
  background: #1b9e77;
}

.node-swatch.group {
  border-color: #98a6b5;
  background: #dde3e8;
}

.node-swatch.question {
  border-style: dashed;
}

.node-swatch.reference {
  border-style: dotted;
}

.node-swatch.excerpt {
  border-style: dashed;
  border-width: 2px;
}

.relation-swatch {
  width: 1.35rem;
  border-top: 3px solid;
}

.relation-swatch.weak {
  border-top-style: dashed;
}

.graph-inspector {
  flex: 1 1 auto;
  min-width: 0;
  padding: 0.8rem;
}

.graph-inspector header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
}

.graph-inspector h2 {
  margin: 0.1rem 0 0;
  font-size: 1rem;
  line-height: 1.25;
}

.graph-inspector .eyebrow {
  color: #607287;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.graph-inspector header button {
  width: 1.7rem;
  height: 1.7rem;
  padding: 0;
  border: 0;
  background: transparent;
  color: #607287;
  font-size: 1.35rem;
  line-height: 1;
}

.description,
.context {
  margin: 0.65rem 0 0;
  font-size: 0.85rem;
  line-height: 1.4;
}

.context {
  padding-left: 0.65rem;
  border-left: 3px solid #7e57c2;
  color: #46566a;
}

dl {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.25rem 0.6rem;
  margin: 0.65rem 0 0;
  font-size: 0.78rem;
}

dt {
  color: #607287;
  font-weight: 600;
}

dd {
  margin: 0;
  overflow-wrap: anywhere;
}

.source-occurrences {
  margin-top: 0.75rem;
}

.source-occurrences h3 {
  margin: 0 0 0.4rem;
  color: #607287;
  font-size: 0.72rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.occurrence-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
  gap: 0.35rem;
}

.occurrence-list button {
  display: flex;
  width: 100%;
  height: auto;
  min-width: 0;
  align-items: flex-start;
  margin: 0;
  padding: 0.4rem 0.5rem;
  border-color: #8bb8ca;
  background: #eef8fc;
  color: #27657e;
  text-align: left;
}

.occurrence-line {
  flex: 0 0 auto;
  font-weight: 700;
}

.occurrence-label {
  min-width: 0;
  overflow: hidden;
  color: #46566a;
  font-size: 0.76rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 850px) {
  .graph-tools {
    top: 0.5rem;
    right: 0.5rem;
    max-width: min(17rem, calc(100% - 1rem));
  }
}
</style>
