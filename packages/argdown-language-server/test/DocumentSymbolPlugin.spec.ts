import { describe, it, expect } from "vitest";
import { ArgdownApplication, ParserPlugin, ModelPlugin } from "@argdown/core";
import { DocumentSymbolPlugin } from "../src/providers/DocumentSymbolPlugin";
import { FoldingRangesPlugin } from "../src/providers/FoldingRangesPlugin";

let app = new ArgdownApplication();

describe("DocumentSymbolPlugin", function () {
  const parserPlugin = new ParserPlugin();
  const modelPlugin = new ModelPlugin();
  const documentSymbolPlugin = new DocumentSymbolPlugin();
  app.addPlugin(parserPlugin, "parse-input");
  app.addPlugin(modelPlugin, "build-model");
  app.addPlugin(documentSymbolPlugin, "export-symbols");
  it("sanity test", function () {
    const source = `[T1]: Hello World`;
    const result = app.run({
      process: ["parse-input", "build-model", "export-symbols"],
      input: source,
      logLevel: "error"
    });
    expect(result.documentSymbols).to.exist;
    expect(result.documentSymbols!.length).to.equal(1);
    expect(result.documentSymbols![0].name).to.equal("[T1]");
  });
  it("can create document symbols for relations", function () {
    const source = `
A
  - B
    +> C`;
    const result = app.run({
      process: ["parse-input", "build-model", "export-symbols"],
      input: source,
      logLevel: "error"
    });
    //console.log(JSON.stringify(result.documentSymbols, null, 2));
    expect(result.documentSymbols).to.exist;
    expect(result.documentSymbols!.length).to.equal(1);
    expect(result.documentSymbols![0].name).to.equal("[Untitled 1]");
  });
  it("can create list of document symbols for headings, statements, arguments, relations and pcss", function () {
    const source = `
    # Heading 1

    Hello Earth!

    [S1]: Hello _World_!

    ## Heading 1.2

    <A1>: Just because.
      - <A2>: Basta.

    # Heading 2

    <A1>

    (1) A
    (2) B
    ----
    (3) C`;
    const result = app.run({
      process: ["parse-input", "build-model", "export-symbols"],
      input: source,
      logLevel: "error"
    });
    // console.log(astToString(result.ast!));
    //console.log(JSON.stringify(result.documentSymbols, null, 2));
    expect(result.documentSymbols).to.exist;
    expect(result.documentSymbols!.length).to.equal(2);
    expect(result.documentSymbols![0].name).to.equal("# Heading 1");
    expect(result.documentSymbols![0].children![0].name).to.equal(
      "[Untitled 1]"
    );
    expect(result.documentSymbols![0].children![1].name).to.equal("[S1]");
    expect(result.documentSymbols![0].children![2].name).to.equal(
      "## Heading 1.2"
    );
    expect(result.documentSymbols![0].children![2].children![0].name).to.equal(
      "<A1>"
    );
    expect(
      result.documentSymbols![0].children![2].children![0].children![0].name
    ).to.equal("<- <A2>");
    expect(result.documentSymbols![1].name).to.equal("# Heading 2");
    expect(result.documentSymbols![1].children![0].name).to.equal("<A1>");
    expect(result.documentSymbols![1].children![1].name).to.equal("PCS <A1>");
    expect(result.documentSymbols![1].children![1].children![0].name).to.equal(
      "(1) [Untitled 2]"
    );
    expect(result.documentSymbols![1].children![1].children![1].name).to.equal(
      "(2) [Untitled 3]"
    );
    expect(result.documentSymbols![1].children![1].children![2].name).to.equal(
      "----"
    );
    expect(result.documentSymbols![1].children![1].children![3].name).to.equal(
      "(3) [Untitled 4]"
    );
  });
  it("uses typed IDs for argdown+ statement symbols and relations", function () {
    const source = `
[?Q1]: Why?

[?Q1]
  :> [?Q2]: A narrower question.`;
    const result = app.run({
      process: ["parse-input", "build-model", "export-symbols"],
      input: source,
      parser: { syntax: "argdown+" },
      logLevel: "error"
    });
    expect(result.documentSymbols).to.exist;
    expect(result.documentSymbols![0].name).to.equal("[?Q1]");
    expect(result.documentSymbols![1].name).to.equal("[?Q1]");
    expect(result.documentSymbols![1].children![0].name).to.equal(":> [?Q2]");
  });
  it("uses canonical shorthand labels for reverse shorthand-capable relations", function () {
    const source = `
[S1]: Main statement.
[?Q2]: Main question.
[S2]: Supporting statement.
[?Q1]: Open question.
[@R1]: https://example.com

[S1]
  <% [S2]

[?Q2]
  <+ [S2]
  <^ [S2]
  <? [?Q1]
  <! [S2]
  <@ [@R1]`;
    const result = app.run({
      process: ["parse-input", "build-model", "export-symbols"],
      input: source,
      parser: { syntax: "argdown+" },
      logLevel: "error"
    });
    expect(result.documentSymbols).to.exist;
    expect(result.documentSymbols![1].name).to.equal("[S1]");
    expect(result.documentSymbols![1].children![0].name).to.equal("% [S2]");
    expect(result.documentSymbols![2].name).to.equal("[?Q2]");
    expect(result.documentSymbols![2].children![0].name).to.equal("+ [S2]");
    expect(result.documentSymbols![2].children![1].name).to.equal("^ [S2]");
    expect(result.documentSymbols![2].children![2].name).to.equal("? [?Q1]");
    expect(result.documentSymbols![2].children![3].name).to.equal("! [S2]");
    expect(result.documentSymbols![2].children![4].name).to.equal("@ [@R1]");
  });
  it("creates symbols for Micro definitions and discourse roots", function () {
    const result = app.run({
      process: ["parse-input", "build-model", "export-symbols"],
      parser: { syntax: "micro-argdown+" },
      input: `[?Q1]: Why?
<A1>: Because.

[?Q1]
    <+ <A1>`,
      logLevel: "error"
    });
    expect(result.documentSymbols!.map((symbol) => symbol.name)).to.deep.equal([
      "[?Q1]",
      "<A1>",
      "[?Q1]"
    ]);
  });
  it("creates folding ranges for Micro discourse trees", function () {
    const foldingApp = new ArgdownApplication();
    foldingApp.addPlugin(new ParserPlugin(), "parse-input");
    foldingApp.addPlugin(new ModelPlugin(), "build-model");
    foldingApp.addPlugin(new FoldingRangesPlugin(), "export-folding");
    const result = foldingApp.run({
      process: ["parse-input", "build-model", "export-folding"],
      parser: { syntax: "micro-argdown+" },
      input: `[S1]
    <+ <A1>
        <^ [S2]`,
      logLevel: "error"
    });
    expect(result.foldingRanges).to.deep.equal([{ startLine: 0, endLine: 2 }]);
  });
});
