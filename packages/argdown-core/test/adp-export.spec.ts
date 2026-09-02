import { expect } from "chai";
import { describe, it } from "mocha";
import {
  ArgdownApplication,
  ArgumentSelectionPlugin,
  ColorPlugin,
  DataPlugin,
  DiscussionPointType,
  DotExportPlugin,
  GraphMLExportPlugin,
  GroupPlugin,
  JSONExportPlugin,
  MapPlugin,
  ModelPlugin,
  ParserPlugin,
  PreselectionPlugin,
  StatementSelectionPlugin,
  prepareForJSON
} from "../src";

const createApp = () => {
  const app = new ArgdownApplication();
  app.addPlugin(new ParserPlugin(), "parse-input");
  app.addPlugin(new DataPlugin(), "build-model");
  app.addPlugin(new ModelPlugin(), "build-model");
  app.addPlugin(new PreselectionPlugin(), "build-map");
  app.addPlugin(new StatementSelectionPlugin(), "build-map");
  app.addPlugin(new ArgumentSelectionPlugin(), "build-map");
  app.addPlugin(new MapPlugin(), "build-map");
  app.addPlugin(new GroupPlugin(), "build-map");
  app.addPlugin(new ColorPlugin(), "colorize");
  app.addPlugin(new DotExportPlugin(), "export-dot");
  app.addPlugin(new GraphMLExportPlugin(), "export-graphml");
  app.addPlugin(new JSONExportPlugin(), "export-json");
  return app;
};

describe("Argdown+ downstream fidelity", function () {
  it("preserves DP types and contextual relation occurrences in maps and JSON", function () {
    const response = createApp().run({
      process: ["parse-input", "build-model", "build-map"],
      input: `[?Q1]: Question

[S1]: Answer
    !> [?Q1]: Contextual question`,
      parser: { syntax: "argdown+" },
      selection: { includeStatements: ["Q1", "S1"] }
    });

    const questionNode = response.map!.nodes.find(
      (node) => node.title === "Q1"
    )!;
    expect(questionNode.discussionPointType).to.equal(
      DiscussionPointType.QUESTION
    );
    expect(
      response.map!.edges[0].relationOccurrences![0].contextualText
    ).to.equal("Contextual question");
    const json = prepareForJSON(response.relations![0]);
    expect(json.occurrences[0].contextualText).to.equal("Contextual question");
  });

  it("uses dashed weak-relation styles in DOT and GraphML", function () {
    const response = createApp().run({
      process: [
        "parse-input",
        "build-model",
        "build-map",
        "colorize",
        "export-dot",
        "export-graphml"
      ],
      input: `[@R1]: Source

[S1]: Claim
    <@ [@R1]`,
      parser: { syntax: "argdown+" },
      selection: { includeStatements: ["R1", "S1"] }
    });

    expect(response.dot).to.contain('type="is-cited-by"');
    expect(response.dot).to.contain('style="dashed"');
    expect(response.dot).to.contain('discussionPointType="reference"');
    expect(response.graphml).to.contain('type="dashed"');
    expect(response.graphml).to.contain('<data key="d2">reference</data>');
  });

  it("exports Excerpts as text artifacts with citation selections", function () {
    const response = createApp().run({
      process: [
        "parse-input",
        "build-model",
        "build-map",
        "colorize",
        "export-dot",
        "export-graphml",
        "export-json"
      ],
      input: `[>E1] >>
    Complete quoted paragraph.

[>E2] >>
    Complete quoted paragraph.

[S1]: Claim
    <@ [>E1]: quoted paragraph`,
      parser: { syntax: "argdown+" },
      selection: { includeStatements: ["E1", "S1"] }
    });

    const excerptNode = response.map!.nodes.find(
      (node) => node.title === "E1"
    )!;
    expect(excerptNode.entityKind).to.equal("text-artifact");
    expect(response.map!.edges[0].contextualText).to.equal("quoted paragraph");
    expect(response.dot).to.contain('entityKind="text-artifact"');
    expect(response.dot).to.contain("relationOccurrences=");
    expect(response.dot).to.contain("quoted paragraph");
    expect(response.dot).to.contain("aliases=");
    expect(response.graphml).to.contain('<data key="d3">text-artifact</data>');
    expect(response.graphml).to.contain('<data key="d4">');
    expect(response.graphml).to.contain("quoted paragraph");
    expect(response.graphml).to.contain('<data key="d5">');
    expect(response.graphml).to.contain("E2");
    const json = prepareForJSON(response.relations![0]);
    expect(json.occurrences[0].contextualText).to.equal("quoted paragraph");
    const exported = JSON.parse(response.json!);
    expect(exported.excerpts.E1.entityKind).to.equal("text-artifact");
    expect(
      exported.map.nodes.find((node: any) => node.title === "E1").entityKind
    ).to.equal("text-artifact");
    expect(exported.relations[0].occurrences[0].contextualText).to.equal(
      "quoted paragraph"
    );
  });
});
