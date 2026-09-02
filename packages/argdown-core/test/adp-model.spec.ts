import { expect } from "chai";
import { describe, it } from "mocha";
import {
  ArgdownApplication,
  ParserPlugin,
  DataPlugin,
  ModelPlugin,
  ArgdownPluginError,
  IArgument,
  IEquivalenceClass,
  RelationType,
  DiscussionPointType,
  ArgdownTypes
} from "../src/index";

describe("ADP Model", function () {
  const app = new ArgdownApplication();
  app.addPlugin(new ParserPlugin(), "parse-input");
  app.addPlugin(new DataPlugin(), "build-model");
  app.addPlugin(new ModelPlugin(), "build-model");

  it("keeps typed-looking identifiers literal in legacy syntax", function () {
    const response = app.run({
      process: ["parse-input", "build-model"],
      input: "[?Q]: This is a legacy statement identifier."
    });

    expect(response.statements!["?Q"]).to.exist;
    expect(response.statements!["Q"]).to.equal(undefined);
  });

  it("does not tokenize Argdown+ relations in legacy syntax", function () {
    const response = app.run({
      process: ["parse-input", "build-model"],
      input: "[S1]: One\n    => [S2]: Two"
    });

    expect(response.relations).to.have.length(0);
  });

  it("activates Argdown+ from frontmatter before parsing and model prepare", function () {
    const request = {
      process: ["parse-input", "build-model"],
      input: `===
parser:
  syntax: argdown+
===

[S1]: One
    => [S2]: Two`
    };
    const response = app.run(request);

    expect(response.parserErrors).to.have.length(0);
    expect(response.relations).to.have.length(1);
    expect(response.relations![0].relationType).to.equal(RelationType.IMPLIES);
    expect((request as any).model.mode).to.equal("strict");
    expect((request as any).model.transformArgumentRelations).to.equal(false);
  });

  it("throws on discussion-point type conflicts in argdown+ mode", function () {
    const source = `
[S1]: A statement

[?S1]: A conflicting question
`;
    expect(() =>
      app.run({
        process: ["parse-input", "build-model"],
        input: source,
        parser: { syntax: "argdown+" },
        throwExceptions: true
      })
    ).to.throw(ArgdownPluginError);
  });

  it("stores relation-level statement text as edge contextual text in argdown+ mode", function () {
    const source = `
[S1]: Root statement
    :> [S2]: Contextualized text { note: "edge-only" }

[S2]: Canonical text
`;
    const response = app.run({
      process: ["parse-input", "build-model"],
      input: source,
      parser: { syntax: "argdown+" }
    });

    const s2 = response.statements!["S2"] as IEquivalenceClass;
    expect(s2).to.exist;
    expect(IEquivalenceClass.getCanonicalMemberText(s2)).to.equal(
      "Canonical text"
    );
    // relation-level definition becomes a reference-like occurrence in ADP mode
    const relationLevelMember = s2.members.find((m) => m.startLine === 3);
    expect(relationLevelMember).to.exist;
    expect(relationLevelMember!.text).to.equal(undefined);
    expect(relationLevelMember!.isReference).to.equal(true);

    const relation = response.relations![0];
    expect(relation).to.exist;
    expect(relation.occurrences[0].contextualText).to.equal(
      "Contextualized text"
    );
    expect(relation.occurrences[0].contextualData).to.deep.equal({
      note: "edge-only"
    });
  });

  it("throws on invalid adp relation type combinations in argdown+ mode", function () {
    const source = `
[S1]: A statement
    ?> [S2]: Another statement
`;
    expect(() =>
      app.run({
        process: ["parse-input", "build-model"],
        input: source,
        parser: { syntax: "argdown+" },
        throwExceptions: true
      })
    ).to.throw(ArgdownPluginError);
  });

  it("infers anonymous answer targets as questions in argdown+ mode", function () {
    const source = `
[S1]: Electric vehicles reduce urban air pollution.
    !> Does EV adoption affect local pollution?
`;
    const response = app.run({
      process: ["parse-input", "build-model"],
      input: source,
      parser: { syntax: "argdown+" },
      throwExceptions: true
    });
    const relation = response.relations![0];
    expect(relation.relationType).to.equal(RelationType.ANSWERS);
    expect(relation.to!.type).to.equal(ArgdownTypes.EQUIVALENCE_CLASS);
    const toEc = relation.to as IEquivalenceClass;
    expect(toEc.discussionPointType).to.equal(DiscussionPointType.QUESTION);
  });

  it("infers anonymous '<+' sources as arguments in argdown+ mode", function () {
    const source = `
[S1]: Electric vehicles reduce urban air pollution.
    <+ The Tailpipe Emission Elimination Argument
`;
    const response = app.run({
      process: ["parse-input", "build-model"],
      input: source,
      parser: { syntax: "argdown+" },
      throwExceptions: true
    });
    const relation = response.relations![0];
    expect(relation.relationType).to.equal(RelationType.JUSTIFIES);
    expect(relation.from!.type).to.equal(ArgdownTypes.ARGUMENT);
    expect(relation.occurrences[0].contextualText).to.equal(
      "The Tailpipe Emission Elimination Argument"
    );
  });

  it("normalizes statement-source +> to implies in argdown+ mode", function () {
    const source = `
[S1]: Source statement
    +> [S2]: Target statement
`;
    const response = app.run({
      process: ["parse-input", "build-model"],
      input: source,
      parser: { syntax: "argdown+" },
      throwExceptions: true
    });
    const relation = response.relations![0];
    expect(relation.relationType).to.equal(RelationType.IMPLIES);
  });

  it("normalizes presupposition in parent-child direction", function () {
    const response = app.run({
      process: ["parse-input", "build-model"],
      input: `<A1>: Argument
    <^ [S1]: Premise`,
      parser: { syntax: "argdown+" }
    });
    const relation = response.relations![0];
    expect(relation.relationType).to.equal(RelationType.IS_PRESUPPOSED_BY);
    expect(relation.from!.title).to.equal("S1");
    expect(relation.to!.title).to.equal("A1");
  });

  it("interprets argument-source +> as justifies in argdown+ mode", function () {
    const source = `
<A1>: Supporting argument
    +> [S1]: Supported statement
`;
    const response = app.run({
      process: ["parse-input", "build-model"],
      input: source,
      parser: { syntax: "argdown+" },
      throwExceptions: true
    });
    const relation = response.relations![0];
    expect(relation.relationType).to.equal(RelationType.JUSTIFIES);
    expect(relation.from!.type).to.equal(ArgdownTypes.ARGUMENT);
    expect(relation.to!.type).to.equal(ArgdownTypes.EQUIVALENCE_CLASS);
  });

  it("supports reverse relation shorthands in argdown+ mode", function () {
    const source = `
[S1]: Root
    ^ [S2]
    % [S3]
    ? [?Q1]

[?Q2]: Root question
    ! [S4]

[S5]: Root cited target
    @ [@R1]
`;
    const response = app.run({
      process: ["parse-input", "build-model"],
      input: source,
      parser: { syntax: "argdown+" },
      throwExceptions: true
    });

    const presupposedBy = response.relations!.find(
      (r) =>
        r.relationType === RelationType.IS_PRESUPPOSED_BY &&
        r.from!.title === "S2" &&
        r.to!.title === "S1"
    );
    expect(presupposedBy).to.exist;

    const questions = response.relations!.find(
      (r) =>
        r.relationType === RelationType.QUESTIONS &&
        r.from!.title === "Q1" &&
        r.to!.title === "S1"
    );
    expect(questions).to.exist;

    const exampleFor = response.relations!.find(
      (r) =>
        r.relationType === RelationType.IS_EXAMPLE_FOR &&
        r.from!.title === "S3" &&
        r.to!.title === "S1"
    );
    expect(exampleFor).to.exist;

    const answers = response.relations!.find(
      (r) =>
        r.relationType === RelationType.ANSWERS &&
        r.from!.title === "S4" &&
        r.to!.title === "Q2"
    );
    expect(answers).to.exist;

    const citedBy = response.relations!.find(
      (r) =>
        r.relationType === RelationType.IS_CITED_BY &&
        r.from!.title === "R1" &&
        r.to!.title === "S5"
    );
    expect(citedBy).to.exist;
  });

  it("keeps reconstructed argument relations on argument nodes in argdown+ mode", function () {
    const source = `
<A1>: A reconstructed argument
    (1) [S1]: Premise
    ----
    (2) [S2]: Conclusion

<A1>
    +> [S3]: Supported by argument node
`;
    const response = app.run({
      process: ["parse-input", "build-model"],
      input: source,
      parser: { syntax: "argdown+" },
      throwExceptions: true
    });
    const relation = response.relations!.find(
      (r) => r.relationType === RelationType.JUSTIFIES && r.to!.title === "S3"
    );
    expect(relation).to.exist;
    expect(relation!.from!.type).to.equal(ArgdownTypes.ARGUMENT);
    expect(relation!.from!.title).to.equal("A1");
  });

  it("requires block operator for excerpt definitions in argdown+ mode", function () {
    const source = `
[>E1]: This should fail without a block.
`;
    expect(() =>
      app.run({
        process: ["parse-input", "build-model"],
        input: source,
        parser: { syntax: "argdown+" },
        throwExceptions: true
      })
    ).to.throw(ArgdownPluginError);
  });

  it("parses excerpt block definitions and preserves multiline text", function () {
    const source = `
[>E1] >>
    First line.
    => not a relation token.
    Second line.
`;
    const response = app.run({
      process: ["parse-input", "build-model"],
      input: source,
      parser: { syntax: "argdown+" },
      throwExceptions: true
    });
    const excerpt = response.statements!["E1"] as IEquivalenceClass;
    expect(excerpt.discussionPointType).to.equal(DiscussionPointType.EXCERPT);
    expect(IEquivalenceClass.getCanonicalMemberText(excerpt)).to.equal(
      "First line.\n=> not a relation token.\nSecond line."
    );
  });

  it("rejects multiline statement text without block operator in argdown+ mode", function () {
    const source = `
[S1]: First line.
Second line.
`;
    expect(() =>
      app.run({
        process: ["parse-input", "build-model"],
        input: source,
        parser: { syntax: "argdown+" },
        throwExceptions: true
      })
    ).to.throw(ArgdownPluginError);
  });

  it("stores relation-level block text as edge contextual text in argdown+ mode", function () {
    const source = `
[S1]: Root statement
    <: [S2] >>
        Context line 1.
        Context line 2.

[S2]: Canonical text
`;
    const response = app.run({
      process: ["parse-input", "build-model"],
      input: source,
      parser: { syntax: "argdown+" },
      throwExceptions: true
    });
    const relation = response.relations![0];
    expect(relation.occurrences[0].contextualText).to.equal(
      "Context line 1.\nContext line 2."
    );
    const s2 = response.statements!["S2"] as IEquivalenceClass;
    const relationLevelMember = s2.members.find((m) => m.startLine === 3);
    expect(relationLevelMember).to.exist;
    expect(relationLevelMember!.text).to.equal(undefined);
  });

  it("stores relation-level block metadata on edge contextual data in argdown+ mode", function () {
    const source = `
[S1]: Root statement
    <: [S2] >>
        Context line.
    { note: "edge-data" }

[S2]: Canonical text
`;
    const response = app.run({
      process: ["parse-input", "build-model"],
      input: source,
      parser: { syntax: "argdown+" },
      throwExceptions: true
    });
    const relation = response.relations![0];
    expect(relation.occurrences[0].contextualText).to.equal("Context line.");
    expect(relation.occurrences[0].contextualData).to.deep.equal({
      note: "edge-data"
    });
  });

  it("infers anonymous block relation members as excerpts in argdown+ mode", function () {
    const source = `
[S1]: Root statement
    <@ >>
        https://example.org/source
`;
    const response = app.run({
      process: ["parse-input", "build-model"],
      input: source,
      parser: { syntax: "argdown+" },
      throwExceptions: true
    });
    const relation = response.relations![0];
    expect(relation.relationType).to.equal(RelationType.IS_CITED_BY);
    expect(relation.from!.type).to.equal(ArgdownTypes.EQUIVALENCE_CLASS);
    const fromEc = relation.from as IEquivalenceClass;
    expect(fromEc.discussionPointType).to.equal(DiscussionPointType.EXCERPT);
  });

  it("treats prefixes inside anonymous blocks as literal Excerpt content", function () {
    const source = `
[S1]: Root statement
    <@ >>
        ? Is this resolved?
`;
    const response = app.run({
      process: ["parse-input", "build-model"],
      input: source,
      parser: { syntax: "argdown+" },
      throwExceptions: true
    });
    const relation = response.relations![0];
    expect(relation.relationType).to.equal(RelationType.IS_CITED_BY);
    expect(relation.from!.type).to.equal(ArgdownTypes.EQUIVALENCE_CLASS);
    const excerpt = relation.from as IEquivalenceClass;
    expect(excerpt.discussionPointType).to.equal(DiscussionPointType.EXCERPT);
    expect(excerpt.canonicalText).to.equal("? Is this resolved?");
  });

  it("maps pcs premises and conclusion to adp semantic relations", function () {
    const source = `
<A1>: The Spectrometer Argument

(1) [S1]: The reading is 475nm.
(2) [S2]: Spectrometers are reliable.
----
(3) [S3]: The sky is blue.
`;
    const response = app.run({
      process: ["parse-input", "build-model"],
      input: source,
      parser: { syntax: "argdown+" },
      throwExceptions: true
    });
    const p1 = response.relations!.find(
      (r) =>
        r.relationType === RelationType.IS_PRESUPPOSED_BY &&
        r.from!.title === "S1" &&
        r.to!.title === "A1"
    );
    const p2 = response.relations!.find(
      (r) =>
        r.relationType === RelationType.IS_PRESUPPOSED_BY &&
        r.from!.title === "S2" &&
        r.to!.title === "A1"
    );
    const c = response.relations!.find(
      (r) =>
        r.relationType === RelationType.JUSTIFIES &&
        r.from!.title === "A1" &&
        r.to!.title === "S3"
    );
    expect(p1).to.exist;
    expect(p2).to.exist;
    expect(c).to.exist;
  });

  it("builds canonical discussionPoints index in argdown+ mode", function () {
    const source = `
[S1]: Statement
[?Q1]: Question
[@R1]: Reference
[>E1] >>
    Excerpt text.

<A1>: Argument
`;
    const response = app.run({
      process: ["parse-input", "build-model"],
      input: source,
      parser: { syntax: "argdown+" },
      throwExceptions: true
    });
    expect(response.discussionPoints).to.exist;
    expect(response.discussionPoints!["[S1]"]).to.equal(
      response.statements!["S1"]
    );
    expect(response.discussionPoints!["[?Q1]"]).to.equal(
      response.statements!["Q1"]
    );
    expect(response.discussionPoints!["[@R1]"]).to.equal(
      response.statements!["R1"]
    );
    expect(response.discussionPoints!["[>E1]"]).to.equal(undefined);
    expect(response.excerpts!["E1"]).to.equal(response.statements!["E1"]);
    expect(response.discussionPoints!["<A1>"]).to.equal(
      response.arguments!["A1"]
    );
  });

  it("keeps Excerpts outside discussionPoints and marks their entity kind", function () {
    const response = app.run({
      process: ["parse-input", "build-model"],
      input: `[>E1] >>
    Exact excerpt.`,
      parser: { syntax: "argdown+" },
      throwExceptions: true
    });

    expect(response.discussionPoints).to.not.have.property("[>E1]");
    expect(response.excerpts!.E1.entityKind).to.equal("text-artifact");
    expect(response.statements!.E1).to.equal(response.excerpts!.E1);
  });

  it("rejects non-citation and equality relations involving Excerpts", function () {
    const invalidSources = [
      `[>E1] >>
    Excerpt.

[S1]: Claim

[S1]
    => [>E1]`,
      `[>E1] >>
    Excerpt one.

[>E2] >>
    Excerpt two.

[>E1]
    == [>E2]`,
      `[>E1] >>
    Excerpt one.

[>E2] >>
    Excerpt two.

[>E1]
    @> [>E2]`
    ];
    for (const input of invalidSources) {
      expect(() =>
        app.run({
          process: ["parse-input", "build-model"],
          input,
          parser: { syntax: "argdown+" },
          throwExceptions: true
        })
      ).to.throw(ArgdownPluginError);
    }
  });

  it("merges different Excerpt identifiers with identical exact text", function () {
    const response = app.run({
      process: ["parse-input", "build-model"],
      input: `[>E1] >>
    Identical excerpt.

[>E2] >>
    Identical excerpt.`,
      parser: { syntax: "argdown+" },
      throwExceptions: true
    });

    expect(response.excerpts!.E1).to.equal(response.excerpts!.E2);
    expect(response.diagnostics!.map((d) => d.code)).to.include(
      "adp-duplicate-excerpt-alias"
    );
  });

  it("requires a root Excerpt for contextual citation selections", function () {
    expect(() =>
      app.run({
        process: ["parse-input", "build-model"],
        input: `[S1]: Claim
    <@ [>E1]: selected passage`,
        parser: { syntax: "argdown+" },
        throwExceptions: true
      })
    ).to.throw(ArgdownPluginError);
  });

  it("warns when an Excerpt citation selection does not match its root text", function () {
    const response = app.run({
      process: ["parse-input", "build-model"],
      input: `[>E1] >>
    Complete exact excerpt.

[S1]: Claim
    <@ [>E1]: a different passage`,
      parser: { syntax: "argdown+" },
      throwExceptions: true
    });

    expect(response.diagnostics!.map((d) => d.code)).to.include(
      "adp-excerpt-selection-mismatch"
    );
  });

  it("includes statement and argument with same title as separate discussionPoints in argdown mode", function () {
    const source = `
[X]: Statement X

<X>: Argument X
`;
    const response = app.run({
      process: ["parse-input", "build-model"],
      input: source,
      throwExceptions: true
    });
    expect(response.discussionPoints).to.exist;
    expect(response.discussionPoints!["[X]"]).to.equal(
      response.statements!["X"]
    );
    expect(response.discussionPoints!["<X>"]).to.equal(
      response.arguments!["X"]
    );
  });

  it("warns when directed Statement attack syntax loses direction", function () {
    const response = app.run({
      process: ["parse-input", "build-model"],
      input: "[S1]: One\n    -> [S2]: Two",
      parser: { syntax: "argdown+" }
    });

    expect(response.relations![0].relationType).to.equal(RelationType.CONTRARY);
    expect(response.diagnostics!.map((d) => d.code)).to.include(
      "adp-directed-statement-attack"
    );
  });

  it("warns when a generic legacy attack involves an Argument", function () {
    const response = app.run({
      process: ["parse-input", "build-model"],
      input: "<A1>: Argument\n    -> <A2>: Other argument",
      parser: { syntax: "argdown+" }
    });

    expect(response.relations![0].relationType).to.equal(RelationType.ATTACK);
    expect(response.diagnostics!.map((d) => d.code)).to.include(
      "adp-generic-argument-attack"
    );
  });

  it("warns and overrides an explicitly loose Argdown+ model", function () {
    const response = app.run({
      process: ["parse-input", "build-model"],
      input: "[S1]: One",
      parser: { syntax: "argdown+" },
      model: { mode: "loose" as any }
    });

    expect(response.diagnostics!.map((d) => d.code)).to.include(
      "adp-loose-mode-ignored"
    );
  });

  it("uses the first non-empty root definition as canonical text", function () {
    const response = app.run({
      process: ["parse-input", "build-model"],
      input: "[S1]: First wording.\n\n[S1]: Later wording.",
      parser: { syntax: "argdown+" }
    });

    expect(response.statements!["S1"].canonicalText).to.equal("First wording.");
    expect(
      IEquivalenceClass.getCanonicalMemberText(response.statements!["S1"])
    ).to.equal("First wording.");
    expect(response.diagnostics!.map((d) => d.code)).to.include(
      "adp-competing-context-free-text"
    );
  });

  it("keeps relation-level Argument text and data on the relation occurrence", function () {
    const response = app.run({
      process: ["parse-input", "build-model"],
      input: `[S1]: Claim
    <+ <A1>: Contextual argument wording { role: edge }`,
      parser: { syntax: "argdown+" }
    });

    expect(response.relations![0].occurrences[0].contextualText).to.equal(
      "Contextual argument wording"
    );
    expect(response.relations![0].occurrences[0].contextualData).to.deep.equal({
      role: "edge"
    });
    expect(response.arguments!["A1"].data).to.equal(undefined);
  });

  it("supports optional blocks for explicit Arguments", function () {
    const response = app.run({
      process: ["parse-input", "build-model"],
      input: `<A1> >>
    First line.
    Second line.`,
      parser: { syntax: "argdown+" },
      throwExceptions: true
    });

    expect(
      IArgument.getCanonicalMemberText(response.arguments!["A1"])
    ).to.equal("First line.\nSecond line.");
  });

  it("supports optional blocks for every explicit non-Excerpt DP type", function () {
    const response = app.run({
      process: ["parse-input", "build-model"],
      input: `[S1] >>
    Statement block.

[?Q1] >>
    Question block.

[@R1] >>
    Reference block.`,
      parser: { syntax: "argdown+" },
      throwExceptions: true
    });

    expect(response.statements!["S1"].canonicalText).to.equal(
      "Statement block."
    );
    expect(response.statements!["Q1"].canonicalText).to.equal(
      "Question block."
    );
    expect(response.statements!["R1"].canonicalText).to.equal(
      "Reference block."
    );
  });

  it("can keep explicit API syntax ahead of frontmatter by merge policy", function () {
    const response = app.run({
      process: ["parse-input", "build-model"],
      parser: { syntax: "argdown" },
      data: { frontMatterSettingsMode: "default" as any },
      input: `===
parser:
  syntax: argdown+
===

[?Q1]: Legacy title`
    });

    expect(response.statements!["?Q1"]).to.exist;
    expect(response.statements!["Q1"]).to.equal(undefined);
  });
});
