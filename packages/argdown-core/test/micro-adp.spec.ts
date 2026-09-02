import { expect } from "chai";
import { describe, it } from "mocha";
import * as fs from "fs";
import {
  ArgumentSelectionPlugin,
  ArgdownApplication,
  ColorPlugin,
  DataPlugin,
  DiscussionPointType,
  HtmlExportPlugin,
  MapPlugin,
  ModelPlugin,
  ParserPlugin,
  PreselectionPlugin,
  RelationType,
  StatementSelectionPlugin,
  convertMicroToArgdownPlus,
  convertArgdownPlusToMicro,
  normalizedGraphsEqual,
  parseMicroArgdown,
  serializeMicroArgdown
} from "../src";

describe("Micro-Argdown+", function () {
  it("treats every unwrapped node as prose and never as a bare mention", function () {
    const document = parseMicroArgdown(`[S1]: Claim
<A1>: Defined argument

[S1]
    <+ A1
    <+ <A1>`);

    expect(document.relations).to.have.length(2);
    expect(document.relations[0].from).to.not.equal(document.relations[1].from);
    expect((document.relations[0].from as any).hasExplicitIdentifier).to.equal(
      false
    );
    expect((document.relations[1].from as any).hasExplicitIdentifier).to.equal(
      true
    );
    expect(
      document.relations.every((r) => r.relationType === RelationType.JUSTIFIES)
    ).to.equal(true);
  });

  it("does not let a forward definition capture earlier unwrapped prose", function () {
    const document = parseMicroArgdown(`[S1]
    <+ A1

<A1>: Defined later
[S1]: Claim

[S1]
    <+ <A1>`);

    expect(document.relations).to.have.length(2);
    expect(document.relations[0].from).to.not.equal(document.relations[1].from);
    expect((document.relations[0].from as any).canonicalText).to.equal("A1");
    expect((document.relations[1].from as any).canonicalText).to.equal(
      "Defined later"
    );
  });

  it("stores contextual text only after an explicitly wrapped child", function () {
    const document = parseMicroArgdown(`[S1]: Claim
<A1>: Argument

[S1]
    <+ <A1>: Context-only wording`);

    expect(document.relations[0].occurrences[0].contextualText).to.equal(
      "Context-only wording"
    );
    expect(document.arguments["A1"].canonicalText).to.equal("Argument");
  });

  it("requires a colon after wrappers while keeping prose colons literal", function () {
    const document = parseMicroArgdown(`[S1]: Claim

Time: this entire line is prose.

[S1]
    => [S2] missing delimiter`);
    expect(
      Object.values(document.discussionPoints).some(
        (dp) => dp.canonicalText === "Time: this entire line is prose."
      )
    ).to.equal(true);
    expect(document.diagnostics.map((d) => d.code)).to.include(
      "micro-invalid-node-suffix"
    );
  });

  it("keeps contrariness and contradiction distinct", function () {
    const document = parseMicroArgdown(`[S1]: One
[S2]: Two
[S3]: Three

[S1]
    - [S2]
    >< [S3]`);

    expect(document.relations.map((r) => r.relationType)).to.have.members([
      RelationType.CONTRARY,
      RelationType.CONTRADICTORY
    ]);
  });

  it("supports shared comments without treating URL slashes as comments", function () {
    const document = parseMicroArgdown(`/* lead */
[@R1]: https://example.com/report // source note
<!-- hidden -->
[S1]: Claim

[S1]
    <@ [@R1]`);

    expect(document.statements["R1"].canonicalText).to.equal(
      "https://example.com/report"
    );
    expect(document.relations[0].relationType).to.equal(
      RelationType.IS_CITED_BY
    );
  });

  it("does not treat # as a Micro comment marker", function () {
    const document = parseMicroArgdown("# This remains node text");
    expect(Object.values(document.discussionPoints)[0].canonicalText).to.equal(
      "# This remains node text"
    );
  });

  it("reports global identifier type conflicts", function () {
    const document = parseMicroArgdown(`[S1]: Statement
<S1>: Argument`);
    expect(document.diagnostics.map((d) => d.code)).to.include(
      "micro-type-conflict"
    );
  });

  it("reports type ambiguity when no drafting default applies", function () {
    const document = parseMicroArgdown(`Root
    == Another node`);
    expect(document.diagnostics.map((d) => d.code)).to.include(
      "micro-ambiguous-type"
    );
  });

  it("merges identical anonymous prose but not distinct explicit identifiers", function () {
    const document = parseMicroArgdown(`[S1]: Same wording
[S2]: Same wording

Same anonymous wording

Same anonymous wording`);
    expect(document.statements["S1"]).to.not.equal(document.statements["S2"]);
    expect(
      Object.values(document.discussionPoints).filter(
        (dp) => dp.canonicalText === "Same anonymous wording"
      )
    ).to.have.length(1);
  });

  it("round-trips through canonical Micro output", function () {
    const first = parseMicroArgdown(`Renewables reduce costs.
    <+ Storage balances supply.`);
    const serialized = serializeMicroArgdown(first);
    const second = parseMicroArgdown(serialized);

    expect(serialized).to.contain("CONTEXT-FREE DEFINITIONS:");
    expect(serialized).to.contain("<A1>");
    expect(second.relations.map((r) => r.relationType)).to.deep.equal(
      first.relations.map((r) => r.relationType)
    );
  });

  it("integrates with parser.syntax and converts to parseable full Argdown+", function () {
    const app = new ArgdownApplication();
    app.addPlugin(new ParserPlugin(), "parse-input");
    app.addPlugin(new DataPlugin(), "build-model");
    app.addPlugin(new ModelPlugin(), "build-model");
    const response = app.run({
      process: ["parse-input", "build-model"],
      input: `[S1]: Claim
<A1>: Argument

[S1]
    <+ <A1>`,
      parser: { syntax: "micro-argdown+" }
    });

    expect(response.arguments!["A1"].discussionPointType).to.equal(
      DiscussionPointType.ARGUMENT
    );
    const converted = convertMicroToArgdownPlus(response.microDocument!);
    expect(converted.diagnostics).to.be.empty;
    const full = app.run({
      process: ["parse-input", "build-model"],
      input: converted.output!,
      parser: { syntax: "argdown+" },
      throwExceptions: true
    });
    expect(full.parserErrors).to.be.empty;
    expect(full.relations![0].relationType).to.equal(RelationType.JUSTIFIES);
  });

  it("activates Micro-Argdown+ from frontmatter without parsing it as prose", function () {
    const app = new ArgdownApplication();
    app.addPlugin(new ParserPlugin(), "parse-input");
    app.addPlugin(new DataPlugin(), "build-model");
    app.addPlugin(new ModelPlugin(), "build-model");
    const response = app.run({
      process: ["parse-input", "build-model"],
      input: `===
parser:
  syntax: micro-argdown+
===

[S1]: Claim
<A1>: Argument

[S1]
    <+ <A1>`
    });

    expect(response.frontMatter).to.deep.include({
      parser: { syntax: "micro-argdown+" }
    });
    expect(response.microDocument).to.not.equal(undefined);
    expect(response.discussionPoints).to.have.keys("[S1]", "<A1>");
    expect(response.relations).to.have.length(1);
    expect(response.diagnostics).to.be.empty;
  });

  it("provides the empty model collections required by map colorization", function () {
    const app = new ArgdownApplication();
    app.addPlugin(new ParserPlugin(), "parse-input");
    app.addPlugin(new DataPlugin(), "build-model");
    app.addPlugin(new ModelPlugin(), "build-model");
    app.addPlugin(new PreselectionPlugin(), "build-map");
    app.addPlugin(new StatementSelectionPlugin(), "build-map");
    app.addPlugin(new ArgumentSelectionPlugin(), "build-map");
    app.addPlugin(new MapPlugin(), "build-map");
    app.addPlugin(new ColorPlugin(), "colorize");

    const response = app.run({
      process: ["parse-input", "build-model", "build-map", "colorize"],
      input: `===
parser:
  syntax: micro-argdown+
===

[S1]: Claim
<A1>: Argument

[S1]
    <+ <A1>`
    });

    expect(response.exceptions).to.be.empty;
    expect(response.tags).to.deep.equal({});
    expect(response.sections).to.deep.equal([]);
    expect(response.map?.nodes.map((node) => node.title)).to.have.members([
      "S1",
      "A1"
    ]);
    expect(response.map?.edges).to.have.length(1);
  });

  it("exports Micro-Argdown+ through the regular semantic HTML view", function () {
    const app = new ArgdownApplication();
    app.addPlugin(new ParserPlugin(), "parse-input");
    app.addPlugin(new DataPlugin(), "build-model");
    app.addPlugin(new ModelPlugin(), "build-model");
    app.addPlugin(new HtmlExportPlugin({ headless: true }), "export-html");

    const response = app.run({
      process: ["parse-input", "build-model", "export-html"],
      input: `[?Question]: Should the city expand its tree canopy?
[Answer]: The city should expand its tree canopy.
<Reason>: Trees provide shade.

[?Question]
    <! [Answer]
        <+ <Reason>`,
      parser: { syntax: "micro-argdown+" }
    });

    expect(response.exceptions).to.be.empty;
    expect(response.html).to.contain('<div class="argdown">');
    expect(response.html).to.contain(
      '[?<span class="title statement-title">Question</span>'
    );
    expect(response.html).to.contain("Answer");
    expect(response.html).to.contain("Reason");
  });

  it("produces the same normalized graph for paired full and Micro fixtures", function () {
    const app = new ArgdownApplication();
    app.addPlugin(new ParserPlugin(), "parse-input");
    app.addPlugin(new DataPlugin(), "build-model");
    app.addPlugin(new ModelPlugin(), "build-model");
    const full = app.run({
      process: ["parse-input", "build-model"],
      input: fs.readFileSync(
        "./test/fixtures/argdown-plus/typed-core.argdown",
        "utf8"
      )
    });
    const micro = parseMicroArgdown(
      fs.readFileSync(
        "./test/fixtures/micro-argdown-plus/typed-core.micro.argdown",
        "utf8"
      )
    );
    expect(full.parserErrors).to.be.empty;
    expect(micro.diagnostics.filter((d) => d.severity === "error")).to.be.empty;
    expect(normalizedGraphsEqual(full, micro)).to.equal(true);
  });

  it("diagnoses unsupported full-to-Micro argument structure", function () {
    const result = convertArgdownPlusToMicro({
      discussionPoints: {},
      statements: {},
      arguments: {
        A1: {
          type: "argument" as any,
          title: "A1",
          discussionPointType: DiscussionPointType.ARGUMENT,
          relations: [],
          members: [],
          pcs: [
            { type: "statement" as any, title: "P1", role: "premise" as any }
          ]
        }
      },
      relations: []
    });
    expect(result.output).to.equal(undefined);
    expect(result.diagnostics.map((d) => d.code)).to.include(
      "micro-unsupported-adp-feature"
    );
  });

  it("preserves contextual text attached to a relation source", function () {
    const app = new ArgdownApplication();
    app.addPlugin(new ParserPlugin(), "parse-input");
    app.addPlugin(new DataPlugin(), "build-model");
    app.addPlugin(new ModelPlugin(), "build-model");
    const full = app.run({
      process: ["parse-input", "build-model"],
      parser: { syntax: "argdown+" },
      input: `[S1]: Claim

[>E1] >>
    Canonical excerpt.

[S1]
    <@ [>E1] >>
        Contextual excerpt.`
    });
    const converted = convertArgdownPlusToMicro(full);
    expect(converted.diagnostics).to.be.empty;
    const micro = parseMicroArgdown(converted.output!);
    expect(micro.diagnostics.filter((d) => d.severity === "error")).to.be.empty;
    expect(micro.relations[0].from!.title).to.equal("E1");
    expect(micro.relations[0].to!.title).to.equal("S1");
    expect(micro.relations[0].occurrences[0].contextualText).to.equal(
      "Contextual excerpt."
    );
  });

  it("expands inline contextual excerpts to full Argdown+ blocks", function () {
    const micro = parseMicroArgdown(`[S1]: Claim
[>E1]: Canonical excerpt.

[S1]
    <@ [>E1]: Contextual excerpt.`);
    const converted = convertMicroToArgdownPlus(micro);
    expect(converted.output).to.contain(
      "<@ [>E1] >>\n        Contextual excerpt."
    );

    const app = new ArgdownApplication();
    app.addPlugin(new ParserPlugin(), "parse-input");
    app.addPlugin(new DataPlugin(), "build-model");
    app.addPlugin(new ModelPlugin(), "build-model");
    const full = app.run({
      process: ["parse-input", "build-model"],
      parser: { syntax: "argdown+" },
      input: converted.output!,
      throwExceptions: true
    });
    expect(full.relations![0].occurrences[0].contextualText).to.equal(
      "Contextual excerpt."
    );
  });

  it("supports exact multiline Excerpt blocks and keeps block markers literal", function () {
    const document = parseMicroArgdown(`[>E1] >>
    First line.
    // literal comment marker
    => literal relation marker

[S1]: Claim

[S1]
    <@ [>E1] >>
        First line.
        // literal selection text`);

    expect(document.excerpts.E1.canonicalText).to.equal(
      "First line.\n// literal comment marker\n=> literal relation marker"
    );
    expect(document.relations[0].occurrences[0].contextualText).to.equal(
      "First line.\n// literal selection text"
    );
    expect(document.diagnostics.map((d) => d.code)).to.include(
      "adp-excerpt-selection-mismatch"
    );
  });

  it("merges anonymous and explicitly aliased Excerpts by exact normalized text", function () {
    const anonymous = parseMicroArgdown(`[S1]: Claim

[S1]
    <@ >>
        Same exact excerpt.

[S1]
    <@ >>
        Same exact excerpt.`);
    expect(anonymous.relations).to.have.length(1);
    expect(anonymous.relations[0].occurrences).to.have.length(2);

    const aliased = parseMicroArgdown(`[>E1]: Same exact excerpt.
[>E2]: Same exact excerpt.`);
    expect(aliased.excerpts.E1).to.equal(aliased.excerpts.E2);
    expect(aliased.diagnostics.map((d) => d.code)).to.include(
      "adp-duplicate-excerpt-alias"
    );
    const serialized = serializeMicroArgdown(aliased);
    expect(serialized).to.contain("[>E1]: Same exact excerpt.");
    expect(serialized).to.contain("[>E2]: Same exact excerpt.");
    expect(
      normalizedGraphsEqual(aliased, parseMicroArgdown(serialized))
    ).to.equal(true);
  });

  it("converts multiline Excerpts to Micro without folding their text", function () {
    const app = new ArgdownApplication();
    app.addPlugin(new ParserPlugin(), "parse-input");
    app.addPlugin(new DataPlugin(), "build-model");
    app.addPlugin(new ModelPlugin(), "build-model");
    const full = app.run({
      process: ["parse-input", "build-model"],
      parser: { syntax: "argdown+" },
      input: `[>E1] >>
    First exact line.
    Second exact line.`
    });
    const converted = convertArgdownPlusToMicro(full);
    expect(converted.diagnostics).to.be.empty;
    expect(converted.output).to.contain(
      "[>E1] >>\n    First exact line.\n    Second exact line."
    );
  });

  it("rejects conflicting Excerpt definitions and non-Excerpt blocks", function () {
    const document = parseMicroArgdown(`[>E1]: First text.
[>E1]: Different text.

[S1] >>
    Invalid multiline statement.`);
    expect(document.diagnostics.map((d) => d.code)).to.include.members([
      "adp-excerpt-definition-conflict",
      "micro-non-excerpt-block"
    ]);
  });

  it("restricts Excerpts to citation and excludes them from equality", function () {
    const document = parseMicroArgdown(`[>E1]: Excerpt.
[S1]: Claim

[S1]
    => [>E1]
    == [>E1]`);
    expect(document.diagnostics.map((d) => d.code)).to.include.members([
      "adp-invalid-excerpt-relation",
      "adp-excerpt-equality"
    ]);
  });

  it("requires a complete root Excerpt before contextual selection", function () {
    const document = parseMicroArgdown(`[S1]: Claim

[S1]
    <@ [>E1]: selected passage`);
    expect(document.diagnostics.map((d) => d.code)).to.include(
      "adp-excerpt-context-without-root"
    );
  });

  it("makes block-bearing Micro occurrences leaves", function () {
    const document = parseMicroArgdown(`[S1]: Claim

[S1]
    <@ >>
        Excerpt.
        @> [S1]`);
    expect(document.relations).to.have.length(1);
    expect(document.excerpts).to.not.be.empty;
  });

  it("diagnoses metadata and multiline text lost by full-to-Micro conversion", function () {
    const app = new ArgdownApplication();
    app.addPlugin(new ParserPlugin(), "parse-input");
    app.addPlugin(new DataPlugin(), "build-model");
    app.addPlugin(new ModelPlugin(), "build-model");
    const full = app.run({
      process: ["parse-input", "build-model"],
      parser: { syntax: "argdown+" },
      input: `[S1] >>
    First line.
    Second line.
{ note: "metadata" }`
    });
    const converted = convertArgdownPlusToMicro(full);
    expect(converted.output).to.equal(undefined);
    expect(converted.diagnostics).to.have.length.greaterThan(0);
    expect(converted.diagnostics.every((d) => d.severity === "error")).to.equal(
      true
    );
  });

  it("assigns safe typed IDs when converting identifier-free full nodes", function () {
    const app = new ArgdownApplication();
    app.addPlugin(new ParserPlugin(), "parse-input");
    app.addPlugin(new DataPlugin(), "build-model");
    app.addPlugin(new ModelPlugin(), "build-model");
    const full = app.run({
      process: ["parse-input", "build-model"],
      parser: { syntax: "argdown+" },
      input: "A claim written without an identifier."
    });
    const converted = convertArgdownPlusToMicro(full);
    expect(converted.diagnostics).to.be.empty;
    expect(converted.output).to.contain(
      "[S1]: A claim written without an identifier."
    );
    expect(converted.output).to.not.contain("[Untitled 1]");
  });

  it("preserves every contextual occurrence during full-to-Micro conversion", function () {
    const app = new ArgdownApplication();
    app.addPlugin(new ParserPlugin(), "parse-input");
    app.addPlugin(new DataPlugin(), "build-model");
    app.addPlugin(new ModelPlugin(), "build-model");
    const full = app.run({
      process: ["parse-input", "build-model"],
      parser: { syntax: "argdown+" },
      input: `[S1]: Source
[S2]: Target

[S1]
    => [S2]: First context.

[S1]
    => [S2]: Second context.`
    });
    const converted = convertArgdownPlusToMicro(full);
    expect(converted.diagnostics).to.be.empty;
    const micro = parseMicroArgdown(converted.output!);
    expect(
      micro.relations[0].occurrences.map((o) => o.contextualText)
    ).to.deep.equal(["First context.", "Second context."]);
  });

  it("diagnoses full document section structure instead of dropping it", function () {
    const app = new ArgdownApplication();
    app.addPlugin(new ParserPlugin(), "parse-input");
    app.addPlugin(new DataPlugin(), "build-model");
    app.addPlugin(new ModelPlugin(), "build-model");
    const full = app.run({
      process: ["parse-input", "build-model"],
      parser: { syntax: "argdown+" },
      input: "# A section\n\n[S1]: Claim"
    });
    const converted = convertArgdownPlusToMicro(full);
    expect(converted.output).to.equal(undefined);
    expect(converted.diagnostics[0].message).to.contain("section structure");
  });

  it("diagnoses classic cross-type identifier reuse during Micro conversion", function () {
    const app = new ArgdownApplication();
    app.addPlugin(new ParserPlugin(), "parse-input");
    app.addPlugin(new DataPlugin(), "build-model");
    app.addPlugin(new ModelPlugin(), "build-model");
    const classic = app.run({
      process: ["parse-input", "build-model"],
      input: "[X]: Statement\n\n<X>: Argument"
    });
    const converted = convertArgdownPlusToMicro(classic);
    expect(converted.output).to.equal(undefined);
    expect(
      converted.diagnostics.some((d) => d.message.includes("global typed"))
    ).to.equal(true);
  });
});
