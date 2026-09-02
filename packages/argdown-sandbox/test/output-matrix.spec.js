import { beforeEach, describe, expect, it } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { useArgdownStore } from "../src/store.js";

const syntaxCases = [
  {
    name: "Classic Argdown",
    syntax: "argdown",
    input: `[Conclusion]: The city should expand its tree canopy.
  +> [Reason]: Trees provide shade.`,
    titles: ["Conclusion", "Reason"],
    nodeLine: 1,
    nodeTitle: "Conclusion",
    edgeLine: 2
  },
  {
    name: "Argdown+",
    syntax: "argdown+",
    input: `[?Question]: Should the city expand its tree canopy?

[Answer]: The city should expand its tree canopy.
  !> [?Question]
  <+ <Reason>

<Reason>: Trees provide shade.`,
    titles: ["Question", "Answer", "Reason"],
    typedQuestion: true,
    nodeLine: 1,
    nodeTitle: "Question",
    edgeLine: 4
  },
  {
    name: "Micro-Argdown+",
    syntax: "micro-argdown+",
    input: `CONTEXT-FREE DEFINITIONS:
[?Question]: Should the city expand its tree canopy?
[Answer]: The city should expand its tree canopy.
<Reason>: Trees provide shade.

DISCOURSE TREE:
[?Question]
    <! [Answer]
        <+ <Reason>`,
    titles: ["Question", "Answer", "Reason"],
    typedQuestion: true,
    nodeLine: 2,
    nodeTitle: "Question",
    edgeLine: 8
  }
];

function flattenNodes(nodes, result = []) {
  for (const node of nodes || []) {
    result.push(node);
    if (node.children) flattenNodes(node.children, result);
  }
  return result;
}

describe.each(syntaxCases)("$name sandbox outputs", (syntaxCase) => {
  let store;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useArgdownStore();
    store.setSyntax(syntaxCase.syntax);
    store.setArgdownInput(syntaxCase.input);
  });

  it("has a clean diagnostics route", () => {
    expect(store.activeSyntax).toBe(syntaxCase.syntax);
    expect(store.lexerErrors).toEqual([]);
    expect(store.parserErrors).toEqual([]);
    expect(store.diagnostics).toEqual([]);
    expect(store.errorCount).toBe(0);
  });

  it("renders the HTML route", () => {
    expect(store.html).toContain('<div class="argdown">');
    for (const title of syntaxCase.titles) {
      expect(store.html).toContain(title);
    }
    if (syntaxCase.typedQuestion) {
      expect(store.html).toContain(
        '[?<span class="title statement-title">Question</span>'
      );
    }
  });

  it("provides the Dagre and Viz.js map inputs", () => {
    expect(store.map.nodes.map((node) => node.title)).toEqual(
      expect.arrayContaining(syntaxCase.titles)
    );
    expect(store.map.edges.length).toBeGreaterThan(0);
    expect(store.dot).toContain("digraph");
    for (const title of syntaxCase.titles) {
      expect(store.dot).toContain(title);
    }
    for (const node of flattenNodes(store.map.nodes)) {
      expect(store.dot).toContain(`id="${node.id}"`);
    }
    for (const edge of store.map.edges) {
      expect(store.dot).toContain(`id="${edge.id}"`);
    }
  });

  it("exports DOT, GraphML, and JSON", () => {
    expect(store.dot).toContain("digraph");
    expect(store.graphml).toContain("<graphml");

    const json = JSON.parse(store.json);
    expect(json.map.nodes.map((node) => node.title)).toEqual(
      expect.arrayContaining(syntaxCase.titles)
    );
  });

  it("links source lines to graph nodes and edges", () => {
    store.selectMapElementAtLine(syntaxCase.nodeLine);
    expect(store.selectedMapElement.kind).toBe("node");
    expect(
      store.map.nodes.find((node) => node.id === store.selectedMapElement.id)
        ?.title
    ).toBe(syntaxCase.nodeTitle);

    store.selectMapElementAtLine(syntaxCase.edgeLine);
    expect(store.selectedMapElement.kind).toBe("edge");
    expect(
      store.map.edges.some((edge) => edge.id === store.selectedMapElement.id)
    ).toBe(true);

    const selection = { ...store.selectedMapElement };
    store.setArgdownInput(syntaxCase.input);
    expect(store.selectedMapElement).toEqual(selection);

    store.selectMapElementAtLine(999);
    expect(store.selectedMapElement).toBe(null);
  });

  it("keeps graph focus filters across renderers and clears them on edits", () => {
    store.toggleGraphFilter("nodeTypes", "statement");
    store.toggleGraphFilter("relationTypes", store.map.edges[0].relationType);
    expect(store.graphFilters.nodeTypes).toEqual(["statement"]);
    expect(store.graphFilters.relationTypes).toHaveLength(1);

    store.setViewState("output-maximized");
    expect(store.graphFilters.nodeTypes).toEqual(["statement"]);
    store.setArgdownInput(`${syntaxCase.input}\n`);
    expect(store.graphFilters).toEqual({ nodeTypes: [], relationTypes: [] });
  });
});

describe("graph relation edge cases", () => {
  beforeEach(() => setActivePinia(createPinia()));

  it("keeps parallel and symmetric relations distinct", () => {
    const store = useArgdownStore();
    store.setSyntax("argdown+");
    store.setArgdownInput(`[A]: Alpha
  => [B]: Beta
  >< [B]`);

    expect(store.diagnostics).toEqual([]);
    expect(store.map.edges).toHaveLength(2);
    expect(new Set(store.map.edges.map((edge) => edge.id)).size).toBe(2);
    expect(new Set(store.map.edges.map((edge) => edge.relationType))).toEqual(
      new Set(["implies", "contradictory"])
    );
  });

  it("retains every occurrence of a repeated relation", () => {
    const store = useArgdownStore();
    store.setSyntax("argdown");
    store.setArgdownInput(`<Reason>: Alpha
  +> [Claim]: Beta

<Reason>
  +> [Claim]`);

    expect(store.map.edges).toHaveLength(1);
    expect(
      store.map.edges[0].relationOccurrences.map(
        (occurrence) => occurrence.startLine
      )
    ).toEqual([2, 5]);
  });
});
