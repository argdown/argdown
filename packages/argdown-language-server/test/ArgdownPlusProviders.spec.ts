import { describe, expect, it } from "vitest";
import {
  ArgdownApplication,
  IArgdownResponse,
  ModelPlugin,
  ParserPlugin
} from "@argdown/core";
import {
  provideCompletion,
  provideDefinitions,
  provideHover,
  provideReferences,
  provideRenameWorkspaceEdit
} from "../src/providers";

const parseArgdownPlus = (input: string): IArgdownResponse => {
  const app = new ArgdownApplication();
  app.addPlugin(new ParserPlugin(), "parse-input");
  app.addPlugin(new ModelPlugin(), "build-model");
  return app.run({
    process: ["parse-input", "build-model"],
    input,
    parser: { syntax: "argdown+" },
    throwExceptions: true,
    logLevel: "error"
  });
};

const parseMicroArgdownPlus = (input: string): IArgdownResponse => {
  const app = new ArgdownApplication();
  app.addPlugin(new ParserPlugin(), "parse-input");
  app.addPlugin(new ModelPlugin(), "build-model");
  return app.run({
    process: ["parse-input", "build-model"],
    input,
    parser: { syntax: "micro-argdown+" },
    throwExceptions: true,
    logLevel: "error"
  });
};

describe("Argdown+ providers", function () {
  it("preserves statement type markers when renaming", function () {
    const source = `[?Q1]: Original question

[S1]: Mentions @[?Q1] in text.

[?Q1]`;
    const response = parseArgdownPlus(source);
    const uri = "file:///rename-test.argdown";
    const workspaceEdit = provideRenameWorkspaceEdit(
      response,
      "Q2",
      { line: 0, character: 2 },
      { uri }
    );
    const edits = workspaceEdit.changes![uri] || [];
    const replacementTexts = edits.map((edit) => edit.newText);
    expect(replacementTexts).to.include("[?Q2]:");
    expect(replacementTexts.some((text) => text.startsWith("@[?Q2]"))).to.equal(
      true
    );
    expect(replacementTexts).to.include("[?Q2]");
    expect(replacementTexts).to.not.include("[Q2]:");
  });

  it("uses typed IDs in statement completion and definition details", function () {
    const response = parseArgdownPlus(`[?Q1]: Why does this matter?

[@R1]: https://example.com

[S1]: Baseline statement.`);
    const bracketCompletions = provideCompletion(
      response,
      "[",
      { line: 0, character: 1 },
      "[",
      1
    );
    const labels = bracketCompletions.map((item) => item.label);
    expect(labels).to.include("[?Q1]");
    expect(labels).to.include("[@R1]");
    expect(labels).to.include("[S1]");

    const source = "[?Q1]:";
    const colonCompletions = provideCompletion(
      response,
      ":",
      { line: 0, character: source.length },
      source,
      source.length
    );
    expect(colonCompletions).to.have.length(1);
    expect(colonCompletions[0].detail).to.equal("[?Q1]: Why does this matter?");
  });

  it("renders typed IDs in hover previews", function () {
    const response = parseArgdownPlus(`[?Q1]: Why is this true?

[S1]: Because it follows.

[?Q1]
    ?> [S1]`);
    const hover = provideHover(response, { line: 0, character: 2 });
    expect(hover).to.exist;
    expect(hover!.contents).to.include("[?Q1]");
  });

  it("renders canonical shorthand symbols in hover previews", function () {
    const response = parseArgdownPlus(`[S1]: Main statement.
[S2]: Supporting statement.

[S1]
    <% [S2]

[?Q2]: Main question.

[?Q1]: Open question.

[@R1]: https://example.com

[?Q2]
    <+ [S2]
    <^ [S2]
    <? [?Q1]
    <! [S2]
    <@ [@R1]`);
    const statementHover = provideHover(response, { line: 0, character: 2 });
    expect(statementHover).to.exist;
    expect(statementHover!.contents).to.include("\n  % [S2]");
    expect(statementHover!.contents).to.not.include("<% [S2]");

    const questionHover = provideHover(response, { line: 6, character: 2 });
    expect(questionHover).to.exist;
    expect(questionHover!.contents).to.include("\n  + [S2]");
    expect(questionHover!.contents).to.include("\n  ^ [S2]");
    expect(questionHover!.contents).to.include("\n  ? [?Q1]");
    expect(questionHover!.contents).to.include("\n  ! [S2]");
    expect(questionHover!.contents).to.include("\n  @ [@R1]");
    expect(questionHover!.contents).to.not.include("<+ [S2]");
    expect(questionHover!.contents).to.not.include("<^ [S2]");
    expect(questionHover!.contents).to.not.include("<? [?Q1]");
    expect(questionHover!.contents).to.not.include("<! [S2]");
    expect(questionHover!.contents).to.not.include("<@ [@R1]");
  });

  it("indexes wrapped Micro references for hover, definition, and rename", function () {
    const source = `[S1]: Claim
<A1>: Reason

[S1]
    <+ <A1>`;
    const response = parseMicroArgdownPlus(source);
    const uri = "file:///micro-providers.argdown";

    const hover = provideHover(response, { line: 4, character: 7 });
    expect(hover).to.exist;
    expect(hover!.contents).to.include("<A1>");

    const definitions = provideDefinitions(response, uri, {
      line: 4,
      character: 7
    });
    expect(definitions).to.have.length(1);
    expect(definitions[0].range.start.line).to.equal(1);

    const references = provideReferences(
      response,
      uri,
      { line: 4, character: 7 },
      { includeDeclaration: true }
    );
    expect(references).to.have.length(2);

    const edit = provideRenameWorkspaceEdit(
      response,
      "A2",
      { line: 4, character: 7 },
      { uri }
    );
    expect(
      (edit.changes![uri] || []).map((item) => item.newText)
    ).to.have.members(["<A2>:", "<A2>"]);
  });

  it("preserves typed prefixes when renaming wrapped Micro references", function () {
    const source = `[?Q1]: Why?

[?Q1]`;
    const response = parseMicroArgdownPlus(source);
    const uri = "file:///micro-typed-rename.argdown";
    const edit = provideRenameWorkspaceEdit(
      response,
      "Q2",
      { line: 2, character: 1 },
      { uri }
    );
    expect(
      (edit.changes![uri] || []).map((item) => item.newText)
    ).to.have.members(["[?Q2]:", "[?Q2]"]);
  });

  it("locates identifier-free Micro node definitions", function () {
    const response = parseMicroArgdownPlus(`A drafted claim.
    <+ A drafted reason.`);
    const definitions = provideDefinitions(
      response,
      "file:///micro-prose.argdown",
      { line: 1, character: 10 }
    );
    expect(definitions).to.have.length(1);
    expect(definitions[0].range.start.line).to.equal(1);
    expect(definitions[0].range.start.character).to.equal(7);
  });

  it("renames Micro Excerpt blocks without replacing their content", function () {
    const source = `[>E1] >>
    Complete excerpt text.

[S1]: Claim

[S1]
    <@ [>E1]`;
    const response = parseMicroArgdownPlus(source);
    const uri = "file:///micro-excerpt-rename.argdown";
    const edit = provideRenameWorkspaceEdit(
      response,
      "E2",
      { line: 0, character: 2 },
      { uri }
    );
    expect(
      (edit.changes![uri] || []).map((item) => item.newText)
    ).to.have.members(["[>E2] >>", "[>E2]"]);
    expect((edit.changes![uri] || [])[0].range.end.line).to.equal(0);
  });
});
