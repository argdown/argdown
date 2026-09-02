import { beforeEach, describe, expect, it } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { useArgdownStore } from "../src/store.js";

const syntaxCases = [
  {
    name: "Classic Argdown",
    syntax: "argdown",
    input: `[Conclusion]: The city should expand its tree canopy.
  +> [Reason]: Trees provide shade.`,
    titles: ["Conclusion", "Reason"]
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
    typedQuestion: true
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
    typedQuestion: true
  }
];

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
  });

  it("exports DOT, GraphML, and JSON", () => {
    expect(store.dot).toContain("digraph");
    expect(store.graphml).toContain("<graphml");

    const json = JSON.parse(store.json);
    expect(json.map.nodes.map((node) => node.title)).toEqual(
      expect.arrayContaining(syntaxCase.titles)
    );
  });
});
