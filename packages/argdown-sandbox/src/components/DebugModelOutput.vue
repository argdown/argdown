<template>
  <div class="debug-model-output output">
    <div class="content">
      <table v-if="statements">
        <tr
          class="statement"
          v-for="(key, index) in Object.keys(statements)"
          :key="index"
        >
          <td class="title">
            <b>title: </b> "{{ statements[key].title }}":
          </td>
          <td class="relations">
            <b>relations: </b>
            {{
              statements[key].relations
                ? statements[key].relations.length
                : 0
            }}
          </td>
        </tr>
      </table>
      <table v-if="arguments">
        <tr
          class="argument"
          v-for="(key, index) in Object.keys(arguments)"
          :key="index"
        >
          <td class="title">
            <b>title: </b>"{{ arguments[key].title }}"
          </td>
          <td class="relations">
            <b>relations:</b>
            {{
              arguments[key].relations
                ? arguments[key].relations.length
                : 0
            }}
          </td>
        </tr>
      </table>
      <table v-if="relations">
        <tr
          class="relation"
          v-for="(relation, index) in relations"
          :key="index"
        >
          <td class="relation-type">
            <b>type: </b>{{ relation.relationType }}
          </td>
          <td class="relation-from"><b>from: </b>{{ relation.from }}</td>
          <td class="relation-to"><b>to: </b>{{ relation.to }}</td>
        </tr>
      </table>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue';
import { useArgdownStore } from '../store.js';

export default {
  name: "debug-model-output",
  setup() {
    const store = useArgdownStore();
    const statements = computed(() => store.statements);
    const arguments_ = computed(() => store.arguments);
    const relations = computed(() => store.relations);
    
    return { statements, arguments: arguments_, relations };
  }
};
</script>

<style scoped>
.output .content {
  padding: 1em;
}
</style>
