<template>
  <div class="debug-model-output output">
    <div class="content">
      <table v-if="store.statements">
        <tr
          class="statement"
          v-for="(key, index) in Object.keys(store.statements)"
          :key="index"
        >
          <td class="title">
            <b>title: </b> "{{ store.statements[key].title }}":
          </td>
          <td class="relations">
            <b>relations: </b>
            {{
              store.statements[key].relations
                ? store.statements[key].relations.length
                : 0
            }}
          </td>
        </tr>
      </table>
      <table v-if="store.arguments">
        <tr
          class="argument"
          v-for="(key, index) in Object.keys(store.arguments)"
          :key="index"
        >
          <td class="title">
            <b>title: </b>"{{ store.arguments[key].title }}"
          </td>
          <td class="relations">
            <b>relations:</b>
            {{
              store.arguments[key].relations
                ? store.arguments[key].relations.length
                : 0
            }}
          </td>
        </tr>
      </table>
      <table v-if="store.relations">
        <tr
          class="relation"
          v-for="(relation, index) in store.relations"
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
import { useArgdownStore } from "../store.js";

export default {
  name: "debug-model-output",
  computed: {
    store() {
      return useArgdownStore();
    },
  },
};
</script>

<style scoped>
.output .content {
  padding: 1em;
}
</style>
