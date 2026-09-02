# Argdown+ and Micro-Argdown+ Alignment

**Status:** Implemented revised Excerpt/Micro contract
**Scope:** Full Argdown+, Micro-Argdown+, conversion between them, and migration from classic Argdown

## 1. Goal

Full Argdown+ and Micro-Argdown+ should share one normalized graph and differ primarily in surface syntax:

- full Argdown+ remains a syntactic superset of classic Argdown and retains its richer document features;
- Micro-Argdown+ favors fast, indentation-based drafting, identifier-free prose, and canonical output;
- conversion is defined over the normalized graph rather than by token-for-token rewriting;
- full Argdown+ to Micro conversion is lossless for a declared profile and diagnostic for unsupported features;
- Micro to full Argdown+ conversion should be total for every valid Micro document.

The concise Micro grammar is normative in [micro-argdown-plus.md](micro-argdown-plus.md). This document records the shared semantics, compatibility decisions, diagnostics, and implementation sequence.

## 2. Shared Semantic Contract

### 2.1 Discussion Points and Text Artifacts

Both dialects use four Discussion Point types and one text-artifact type in one global explicit identifier namespace:

| Kind | Type | Canonical wrapper |
| --- | --- | --- |
| Discussion Point | Statement | `[ID]` |
| Discussion Point | Question | `[?ID]` |
| Discussion Point | Argument | `<ID>` |
| Discussion Point | Reference | `[@ID]` |
| Text artifact | Excerpt | `[>ID]` |

An identifier cannot denote different entity types in the same document. Explicit definitions are resolved document-wide before drafting fallbacks are finalized. In Micro, wrapped identifiers and unwrapped prose occupy distinct identity spaces: a later definition of `<A1>` does not capture an earlier unwrapped `A1`.

The normalized API must distinguish:

- `DiscussionPoint = Statement | Question | Argument | Reference`;
- `TextArtifact = Excerpt`;
- `RelationEndpoint = DiscussionPoint | TextArtifact | Inference`.

Excerpt identity is its exact normalized text. Identical anonymous Excerpts merge, while any character difference after normalization creates another artifact. Explicit IDs name these value-like artifacts; duplicate exact text under different IDs is an alias condition, not an equality relation. Excerpts are deliberately excluded from `==` and `~=`.

### 2.2 Relations

| Relation | Subject | Object | Canonical Micro symbol |
| --- | --- | --- | --- |
| `implies` | Statement | Statement | `=>` / `<=` |
| `justifies` | Argument | Statement | `+>` / `<+` |
| `isPresupposedBy` | Statement | Discussion Point | `^>` / `<^` |
| `contradicts` | Statement | Statement | `><` |
| `contrary` | Statement | Statement | `-` |
| `specifies` | Statement or Question | Same type | `:>` / `<:` |
| `isExampleFor` | Statement | Statement | `%>` / `<%` |
| `answers` | Statement | Question | `!>` / `<!` |
| `questions` | Question | Discussion Point | `?>` / `<?` |
| `isCitedBy` | Reference | Discussion Point or Excerpt | `@>` / `<@` |
| `isCitedBy` | Excerpt | Discussion Point | `@>` / `<@` |
| `isEqual` | Discussion Point | Same type | `==` |
| `isPotentiallyEqual` | Discussion Point | Same type | `~=` |

`contrary`, `contradicts`, `isEqual`, and `isPotentiallyEqual` are symmetric.

Excerpts may occur only in citation relations. Excerpt-to-Excerpt citation is invalid. The intended citation shapes are Reference-to-Discussion-Point, Reference-to-Excerpt, and Excerpt-to-Discussion-Point.

Presupposition follows the ordinary parent/child direction rule. Under parent `P`, `^> C` means `P isPresupposedBy C`, while `<^ C` means `C isPresupposedBy P`. Thus a premise beneath an Argument is written:

```text
<A1>
    <^ [S1]
```

and normalizes to `[S1] isPresupposedBy <A1>`.

### 2.3 Contrariness and Contradiction

Contrary Statements cannot both be true but may both be false. Contradictory Statements can neither both be true nor both be false.

- `-` denotes only `contrary`;
- `><` denotes only `contradicts`;
- neither relation applies directly to Arguments.

This distinction must survive parsing, model construction, serialization, rendering, and conversion.

### 2.4 Support and Implication

Legacy support syntax remains type-sensitive on input:

- Argument to Statement support normalizes to `justifies`;
- Statement to Statement support normalizes to `implies` in Argdown+;
- canonical Argdown+ and Micro output uses `=>` or `<=` for Statement implication;
- canonical output uses `+>` or `<+` only for Argument justification;
- the one-character `+` shorthand is accepted for reverse `<+` input but is not canonical.

The current model contains separate `ENTAILS` and `IMPLIES` values. Alignment should not remove `ENTAILS` globally because classic strict Argdown may expose it through the public API. In Argdown+ mode, however, both explicit implication and legacy Statement support should converge on the `IMPLIES` relation. A later compatibility release may alias or deprecate `ENTAILS` more broadly.

### 2.5 Object-Level Scope

The graph records the discourse structure asserted by a document; it does not generally make its own edges into objects of further discussion. Authenticity of an Excerpt, for example, concerns the Reference-to-Excerpt provenance edge and does not justify a `questions` edge to the Excerpt itself. Undercut remains a specific relation to a structural inference, not a general mechanism for reifying or validating arbitrary edges. A `justifies` edge likewise records a presented justificatory claim rather than certifying that it succeeds.

## 3. Legacy Attack Policy

### 3.1 Statement Attacks

In strict semantics, legacy `-`, `->`, and `<-` between two Statements normalize to symmetric `contrary`. The direction carried by `->` or `<-` is therefore discarded.

Argdown+ should accept these forms for compatibility. A directed form should emit a warning after endpoint types are known:

> Directed attack syntax between Statements is interpreted as symmetric contrariness in Argdown+. Use `-` for contrariness or `><` for contradiction.

Plain `-` is the canonical contrary symbol and should not warn by default.

### 3.2 Argument Attacks

A legacy attack involving an Argument is a generic dialectical `attack`, not contrariness. For a reconstructed argument, a precise negative relation normally has one of three targets:

1. an undermining relation targets a premise with contrariness or contradiction;
2. a rebutting relation targets the conclusion with contrariness or contradiction;
3. an undercut targets the inference from premises to conclusion.

A direct Argument attack is useful while an argument is unreconstructed or the target is not yet known, but is underspecified and cannot be refined safely by a converter.

Full Argdown+ should therefore continue to parse generic Argument attacks for legacy migration, while treating them as non-canonical and emitting a refinement warning. Micro-Argdown+ does not include generic attack or undercut in its lossless core profile. A full document containing either requires an extension or a conversion diagnostic.

## 4. Micro Drafting and Disambiguation

Micro intentionally prioritizes writing prose and has no bare-identifier mention syntax.

After comments and the relation symbol are removed, a child is parsed as follows:

1. a wrapped form is an explicit mention;
2. an anonymous `>>` block is an Excerpt;
3. every other complete unwrapped remainder, including a single token, is one identifier-free Discussion Point;
4. contextual inline text is recognized only after `:` following an explicitly wrapped target.

Examples:

```text
[S1]
    <+ A1
    <+ Storage balances renewable generation.
    <+ <A1>: Short wording in this context.
```

These mean, respectively:

1. an identifier-free Argument whose complete text is `A1`;
2. one identifier-free Argument whose text and identity are the full sentence;
3. an explicit reference to `A1` with occurrence-scoped contextual text.

Neither `A1` nor `Storage` is resolved against document-wide explicit identifiers. A reference always uses a wrapper. A colon in unwrapped prose remains ordinary text; after a wrapper it is the mandatory delimiter for inline attached text.

### 4.1 Type Inference

Inference order is:

1. explicit wrapper;
2. anonymous `>>` Excerpt marker;
3. uniquely determined relation constraint;
4. documented relation-specific default;
5. Statement fallback.

The important drafting default is that an untyped source introduced by `<+` or `+` is an Argument. Explicit Statement typing overrides the default and converts the relation to implication:

```text
[P]
    <+ <A>  // A justifies P
    <+ [S]  // S implies P; canonical spelling is <= [S]
```

Ambiguous cases with no default require an explicit wrapper. Later explicit definitions cannot change or capture text-derived identities.

### 4.2 Text as Identity

Identifier-free text is trimmed at its outer boundary and otherwise retained exactly. It initially serves as both node text and an implicit document-local identity key.

- identical case- and punctuation-sensitive text merges;
- changing the text changes the implicit identity;
- explicit IDs are required for distinct nodes with identical wording or stable identity across wording changes;
- canonical output assigns deterministic, type-appropriate safe identifiers, skipping explicit identifiers already in use, and preserves the prose as context-free definition text.

Generated canonical identifiers avoid imposing identifier escaping rules on arbitrary prose containing characters such as `]` or `>`. They do not change the within-document merging behavior of the implicit text key.

### 4.3 Excerpts, Blocks, and Contextual Selections

Micro permits source newlines only in Excerpts. `>>` is therefore an Excerpt marker rather than a general multiline container:

```text
[S1]
    <@ >>
        An anonymous exact passage cited for S1.
```

`>>` after an explicitly non-Excerpt wrapper is invalid. Block content is indentation-bounded and opaque to relation/comment tokenization. A block-bearing occurrence is a leaf in its Micro tree; further citation edges involving an identified Excerpt use another root/reference occurrence.

An explicit Excerpt may carry occurrence-scoped contextual text on a citation edge only when a complete root-level definition exists:

```text
[>E1] >>
    A complete source paragraph containing a directly quoted sentence and its context.

[S1]
    <@ [>E1]: A directly quoted sentence.
```

The contextual text selects the passage used by that citation occurrence; it does not redefine the Excerpt. The Excerpt must be the explicitly wrapped child carrying the text, so Excerpt-to-DP citation selections use inverse `<@ [>E]` syntax beneath the DP. A mismatch after structural whitespace normalization produces a warning, not an error, because ellipses or editorial brackets may be legitimate.

## 5. Comments

All variants use the existing Argdown comment vocabulary:

- `//` line comments;
- `/* ... */` block comments;
- `<!-- ... -->` HTML/Markdown comments.

`//` starts a comment only at the beginning of input or after whitespace so that URLs remain valid. `#` is not a comment marker because classic Argdown uses it for headings and tags.

Comments are source information rather than normalized graph data. A source-aware editor may preserve them; graph conversion and canonical serialization need not do so. Comment markers within `>>` content are literal Excerpt text.

## 6. Conversion Contract

### 6.1 Micro to Full Argdown+

Every valid Micro document must convert to full Argdown+ without semantic loss:

- optional Micro headers and Markdown fence lines are removed;
- identifier-free Discussion Points and anonymous Excerpts receive deterministic safe identifiers;
- inline Micro excerpt definitions are expanded to full `>>` excerpt blocks;
- contextual text and Excerpt passage selections are emitted as relation-level definitions;
- shorthand support between Statements is emitted as `=>` or `<=`;
- comments are either preserved by a source-aware conversion or deliberately omitted;
- full Argdown+ block separation and configuration are generated as needed.

### 6.2 Full Argdown+ to Micro

Conversion is lossless only for the Micro profile. The converter must diagnose rather than silently discard unsupported constructs, including:

- generic Argument attacks and undercuts;
- PCS details that cannot be represented by the normalized Micro relation graph;
- metadata or frontmatter requested for preservation;
- multiline non-Excerpt text or occurrence data not representable in the Micro surface form;
- Excerpt relations other than citation and Excerpt equality relations;
- other full Argdown document structures outside definitions and discourse trees.

A normalize-then-serialize round trip is considered successful when both outputs produce the same Discussion Points, exact Excerpt artifacts and aliases, normalized relations, context-free text, and occurrence-scoped contextual text/selections. Source formatting and comments outside Excerpt blocks are not part of graph equivalence.

## 7. Audited Baseline and Implemented Resolution

The 2026-09-01 source audit found that the earlier Argdown+ work was a prototype rather than the completed architecture previously reported in `ADP-PLAN.md`. The remediation and Micro implementation now resolve the audited gaps as follows.

| Gap | Audited behavior | Implemented resolution |
| --- | --- | --- |
| Syntax-mode isolation | One unconditional lexer/parser and unconditional typed-ID parsing | Classic and Argdown+ lexers are isolated; Micro has a dedicated parser; legacy `[?Q]` remains literal |
| Frontmatter activation | Frontmatter merged after parsing and plugin preparation | Frontmatter is resolved once before processor selection, lexing, and preparation, using the documented merge policy |
| DP core model | `discussionPoints` was a late index over legacy maps | DPs share a base contract, are registered during traversal, and `statements`/`arguments` are re-derived compatibility views; Excerpts live separately as exact text artifacts |
| Contextual relation data | Context was AST-only and Argument context mutated the Argument | Normalized relation occurrences carry endpoint, text, data, and range through JSON and maps; Excerpt context is a root-backed citation passage selection |
| Render fidelity | DP types and weak styles diverged or disappeared | Map nodes carry DP type, HTML preserves wrappers, and DOT/GraphML use the common weak-relation policy already reflected by Dagre |
| Language-server activation | Servers parsed default syntax and omitted model diagnostics | Node config/frontmatter and browser frontmatter activate modes before parsing; structured diagnostics and Micro/full providers are covered |
| Editor grammar consistency | TextMate retained obsolete `*` and `~~` symbols | TextMate uses `%>`/`<%` and `~=`, matching the other bundled grammars |
| Contract and release evidence | Fixtures and core contract were absent | Core contract, paired fixtures, normalized graph comparison, export tests, and language-server regressions are present |

### 7.1 Request Resolution and Mode Isolation

Introduce a preflight request resolver that runs once before processors:

1. scan the common `===` YAML frontmatter envelope without requiring an Argdown grammar mode;
2. load any authorized external configuration;
3. merge defaults, frontmatter, external config, and explicit API settings using one documented precedence order;
4. determine `parser.syntax` before lexing;
5. apply Argdown+ invariants (`model.mode = strict`, `transformArgumentRelations = false`) before any plugin prepares;
6. emit a warning if a caller explicitly requested incompatible loose settings rather than silently overriding them.

`data.frontMatterSettingsMode` controls precedence. Its compatibility default is `priority`, so frontmatter wins; `default` preserves explicit API/config values, and `ignore` skips frontmatter settings. Argdown+ invariants remain enforced and diagnostic regardless of merge policy.

The lexer and parser must then be selected or configured by the resolved syntax. Default `argdown` must reject Argdown+-only relation tokens, block syntax, and typed-marker semantics. Identifier parsing such as `parseStatementIdentifier` must be guarded by Argdown+ mode.

### 7.2 Primary Entity and Relation-Occurrence Model

Introduce a normalized document model with primary stores for:

- typed Discussion Points, including canonical context-free text and all definition occurrences;
- exact Excerpt artifacts, their identifier aliases, normalized content, and citation selections;
- structural inferences, explicitly separate from the DP namespace;
- normalized relations;
- relation occurrences carrying source range, contextualized endpoint, contextual text, and contextual data.

`statements` and `arguments` remain public compatibility views derived from this model. `IExcerpt` is a text artifact outside `DiscussionPoint`. `IInference` remains a structural relation endpoint for undercuts and PCS processing. The shared graph contract must explicitly distinguish `DiscussionPoint`, `TextArtifact`, and `RelationEndpoint`.

Root definitions retain all occurrence texts. The first non-empty root definition becomes canonical context-free text; a later different non-empty definition is preserved as an alternate occurrence and emits `adp-competing-context-free-text`. This replaces the undocumented last-member-wins behavior.

Relation-level contextualization uses one occurrence model, but Excerpt occurrences have stricter semantics: contextual text is a citation-only selection from a complete root-defined Excerpt rather than an alternate formulation.

### 7.3 Downstream Fidelity

The normalized model is not complete until its information survives every public path:

- JSON must serialize relation occurrences and contextual text/data;
- `IMapNode` must carry `entityKind` plus the applicable DP/Excerpt type, and `IMapEdge` must retain relevant occurrence/context fields;
- HTML must use shared entity-wrapper formatting instead of reconstructing every entity as `[title]`;
- DOT, GraphML, and Dagre must consume one weak-relation style policy for `~=`, `%>`, `?>`, and `@>`;
- relation-level Argument context must not be merged into the Argument's context-free description;
- graph-equivalence snapshots must compare core, JSON, map, and serialized representations.

### 7.4 Remaining Specification Decisions

The following audited ambiguities are resolved as target behavior:

1. All legacy support spellings (`+`, `+>`, and `<+`) remain type-sensitive input. Statement-to-Statement uses normalize to `implies`; Argument-to-Statement uses normalize to `justifies`. Canonical output uses `=>`/`<=` and `+>`/`<+`, respectively.
2. Full Argdown+ keeps `>>` mandatory for Excerpts and optional for every Discussion Point type. Micro uses `>>` only for Excerpts, where an anonymous block implies Excerpt locally; multiline non-Excerpt content is outside the Micro profile.
3. Multiple root definitions retain all occurrences and use the first non-empty text as the canonical neutral text, with a warning for competing later text.
4. Inferences remain explicit structural graph objects outside the DP namespace. Undercut may target an inference; Micro conversion diagnoses this unsupported structure.
5. Selecting Argdown+ while explicitly requesting loose model behavior produces a warning and still enforces Argdown+ invariants.
6. Full Argdown+ frontmatter examples are normative because preflight activation now occurs before tokenization and plugin preparation.
7. Excerpts are exact text artifacts outside the DP union, participate only in citation, and are excluded from semantic equality.
8. Root Excerpt text is the complete artifact; contextual Excerpt text is a citation-occurrence passage selection and requires that complete root definition.
9. Micro has no bare mentions. All unwrapped non-block content, including a single token matching a known ID, is identifier-free prose.

## 8. Diagnostics

The core exposes structured diagnostics with `code`, `severity`, `message`, source, and source range in addition to legacy parser errors and plugin exceptions.

Initial diagnostic codes:

| Code | Severity | Condition |
| --- | --- | --- |
| `adp-directed-statement-attack` | Warning | `->` or `<-` resolves between Statements and loses direction |
| `adp-generic-argument-attack` | Warning | Legacy attack involves an Argument and remains underspecified |
| `adp-legacy-statement-support` | Information | Statement support syntax normalizes to explicit implication |
| `adp-loose-mode-ignored` | Warning | Argdown+ selection overrides an explicitly requested loose model mode |
| `adp-competing-context-free-text` | Warning | A later root definition supplies different neutral text for the same DP |
| `micro-type-conflict` | Error | Explicit or inferred uses assign incompatible types to one identity |
| `micro-ambiguous-type` | Error | Relation constraints leave multiple types and no default applies |
| `micro-unsupported-adp-feature` | Error | Full-to-Micro conversion would lose unsupported data or structure |
| `adp-invalid-excerpt-relation` | Error | An Excerpt occurs in a non-citation relation or Excerpt-to-Excerpt citation |
| `adp-excerpt-equality` | Error | `==` or `~=` uses an Excerpt endpoint |
| `adp-excerpt-definition-conflict` | Error | One Excerpt ID is assigned different normalized exact text |
| `adp-duplicate-excerpt-alias` | Information | Different explicit IDs define identical normalized Excerpt text |
| `adp-excerpt-context-without-root` | Error | An explicit Excerpt selection lacks a complete root definition |
| `adp-excerpt-selection-mismatch` | Warning | Contextual selection is not found after structural whitespace normalization |
| `micro-non-excerpt-block` | Error | Micro `>>` follows an explicitly non-Excerpt entity |
| `micro-multiline-non-excerpt` | Error | Micro input or full-to-Micro conversion contains multiline non-Excerpt text |

Language-server integrations should publish warnings and information diagnostics without preventing rendering or export.

## 9. Implementation Plan

### Phase 0: Contract Fixtures and Current-Behavior Baseline

1. Create the missing core Argdown+ contract in `packages/argdown-core/README.md` and link it to the normative specifications.
2. Add paired full/Micro fixtures for every Discussion Point and text-artifact type, relation direction, inference rule, contextual occurrence, and comment form.
3. Snapshot the normalized graph independently of source syntax.
4. Add regression fixtures for current classic loose and strict behavior before changing production code.
5. Add explicit mixed-mode fixtures proving the default grammar and legacy identifier semantics remain isolated.

Primary locations:

- `packages/argdown-core/README.md`
- `packages/argdown-core/test/fixtures/argdown-plus/`
- `packages/argdown-core/test/fixtures/micro-argdown-plus/`
- `packages/argdown-core/test/adp-model.spec.ts`
- new `packages/argdown-core/test/micro-adp.spec.ts`

Exit criterion: current behavior is captured by passing regressions and the target behavior in Sections 2–7 is represented by reviewed contract tests before production changes begin.

### Phase 1: Prototype Remediation Gate

Complete this phase before implementing the Micro grammar.

#### 1A. Structured diagnostic foundation

1. Add a core diagnostic interface and `response.diagnostics` without changing existing parser-error fields.
2. Provide helpers for parser, model, configuration, and conversion diagnostics with stable codes and source ranges.
3. Map core severities to language-server diagnostics in both Node and browser servers.

Primary files:

- `packages/argdown-core/src/index.ts`
- `packages/argdown-core/src/plugins/ParserPlugin.ts`
- `packages/argdown-core/src/plugins/ModelPlugin.ts`
- `packages/argdown-language-server/src/server-node.ts`
- `packages/argdown-language-server/src/server-browser.ts`

Exit criterion: subsequent remediation tasks can report non-fatal migration and configuration problems through one public API.

#### 1B. Request resolution and syntax isolation

1. Add a preflight frontmatter/config resolver and make every processor consume the resolved request.
2. Pass the resolved syntax to tokenization and parsing.
3. Isolate classic token/rule activation from Argdown+ activation.
4. Guard typed identifier parsing and Argdown+ model listeners by mode.
5. Add mixed-mode tests proving `[?Q]`, extended relations, and `>>` retain legacy behavior or fail in default mode as specified.

Primary files:

- `packages/argdown-core/src/ArgdownApplication.ts`
- `packages/argdown-core/src/plugins/ParserPlugin.ts`
- `packages/argdown-core/src/plugins/DataPlugin.ts`
- `packages/argdown-core/src/lexer.ts`
- `packages/argdown-core/src/parser.ts`
- `packages/argdown-core/src/plugins/ModelPlugin.ts`

Exit criterion: programmatic syntax, frontmatter syntax, and default syntax select the same isolated lexer/parser/model behavior, and explicit loose settings in Argdown+ emit a warning.

#### 1C. Primary normalized model

1. Define `IDiscussionPoint`, `ITextArtifact`, `IExcerpt`, `INormalizedRelation`, `IRelationOccurrence`, `IStructuralInference`, and an explicit `RelationEndpoint` union.
2. Build `discussionPoints` directly during model construction.
3. Derive `statements` and `arguments` compatibility maps afterward.
4. Store DP root definitions and apply the first-non-empty canonical-text policy; store exact normalized Excerpt content with content identity and ID aliases.
5. Route relation-level DP context/data and Excerpt citation selections into relation occurrences.
6. Preserve inference endpoints without placing them in the DP namespace.

Primary files:

- `packages/argdown-core/src/model/model.ts`
- `packages/argdown-core/src/plugins/ModelPlugin.ts`
- `packages/argdown-core/src/deriveImplicitRelations.ts`
- `packages/argdown-core/src/model/toJSON.ts`

Exit criterion: no Argdown+ semantic field is sourced solely from a legacy compatibility object or an AST-only occurrence.

#### 1D. Block and relation conformance

1. In full Argdown+, support optional `>>` blocks for every explicit Discussion Point type and require them for Excerpts; anonymous blocks infer Excerpt.
2. Make all support spellings type-sensitive input and normalize Statement support to `IMPLIES` in Argdown+.
3. Preserve classic strict `ENTAILS` behavior in classic mode for API compatibility.
4. Test presupposition direction, competing neutral texts, Argument contextual text, inference endpoints, Excerpt-only citation, Excerpt equality rejection, and all invalid endpoint combinations.

Primary files:

- `packages/argdown-core/src/lexer.ts`
- `packages/argdown-core/src/parser.ts`
- `packages/argdown-core/src/plugins/ModelPlugin.ts`
- `packages/argdown-core/test/adp-model.spec.ts`

Exit criterion: parser behavior and normalized model match the locked specification decisions in Section 7.4.

#### 1E. Export and map fidelity

1. Include normalized relation occurrences in JSON.
2. Carry entity kind plus DP/Excerpt type on map nodes and contextual occurrence/selection data on map edges.
3. Centralize typed DP formatting for HTML and future serializers.
4. Centralize weak-relation style classification and apply it to DOT, GraphML, and Dagre.
5. Add exporter snapshots that assert typed markers, contextual data, and line styles.

Primary files:

- `packages/argdown-core/src/model/toJSON.ts`
- `packages/argdown-core/src/model/model.ts`
- `packages/argdown-core/src/plugins/MapPlugin.ts`
- `packages/argdown-core/src/plugins/HtmlExportPlugin.ts`
- `packages/argdown-core/src/plugins/DotExportPlugin.ts`
- `packages/argdown-core/src/plugins/GraphMLExportPlugin.ts`
- `packages/argdown-map-views/src/DagreMap.ts`

Exit criterion: JSON and every map/export path preserve or intentionally diagnose all Argdown+ Discussion Point, Excerpt, and contextual relation information.

#### 1F. Server and editor integration

1. Make diagnostics and provider processing use the shared resolved request, including frontmatter and document config.
2. Publish lexer, parser, model, and structured warning diagnostics.
3. Add integration tests through the actual Node and browser server request paths.
4. Replace obsolete TextMate `*`/`~~` relation patterns with `%>`/`<%` and `~=`.
5. Run one canonical symbol fixture through TextMate, Prism, Highlight.js, and CodeMirror tests.

Primary files:

- `packages/argdown-language-server/src/server-node.ts`
- `packages/argdown-language-server/src/server-browser.ts`
- `packages/argdown-vscode/syntaxes/argdown.tmLanguage.json`
- highlighter test suites under `packages/argdown-prism`, `packages/argdown-highlightjs`, and `packages/argdown-codemirror-mode`

Exit criterion: opening the same frontmatter-activated Argdown+ document through the core API and language server yields the same model and diagnostics, and all editors recognize the same symbol set.

### Phase 2: Full Argdown+ Normalization and Migration Lints

1. Preserve classic `argdown` loose/strict behavior unchanged.
2. In `argdown+`, normalize Statement support syntax to `IMPLIES` and Argument-to-Statement support to `JUSTIFIES`.
3. Keep `ENTAILS` as a compatibility model value for classic strict mode initially.
4. Emit the directed-Statement-attack and generic-Argument-attack diagnostics after endpoints have been typed.
5. Verify `^>` and `<^` direction with explicit parent/child tests.
6. Keep `-` and `><` distinct through model deduplication and exporters.

Primary files:

- `packages/argdown-core/src/plugins/ModelPlugin.ts`
- `packages/argdown-core/src/model/model.ts`
- `packages/argdown-core/test/adp-model.spec.ts`

Exit criterion: Argdown+ has one canonical implication relation, preserves classic behavior in classic mode, and reports legacy ambiguity without rejecting compatible input.

### Phase 3: Micro Front End

Implement Micro as a dedicated front end that produces the same normalized entity model, not as a blind textual replacement pass.

1. Extend `parser.syntax` with `"micro-argdown+"` or expose an equivalent dedicated parser entry point.
2. Add Micro header, Markdown-fence, indentation, relation, node, and shared-comment tokenization.
3. Implement the wrapped/anonymous-Excerpt/prose precedence from Section 4; remove bare mentions entirely.
4. Collect explicit definitions document-wide for namespace validation without using them to reinterpret unwrapped prose.
5. Apply relation constraints, drafting defaults, and conflict validation.
6. Store inline contextual text only when an explicit wrapped target is followed by `:`.
7. Add indentation-bounded Excerpt blocks, reject Micro blocks on non-Excerpts, and keep block content opaque to relation/comment tokenization.
8. Merge exact identifier-free DP identities and exact anonymous Excerpt content deterministically.
9. Validate Excerpt-only citation endpoints and contextual Excerpt selections against complete root definitions.

Suggested new modules:

- `packages/argdown-core/src/micro/MicroArgdownLexer.ts`
- `packages/argdown-core/src/micro/MicroArgdownParser.ts`
- `packages/argdown-core/src/micro/normalizeMicroDocument.ts`

Existing integration points:

- `packages/argdown-core/src/plugins/ParserPlugin.ts`
- `packages/argdown-core/src/plugins/ModelPlugin.ts`
- `packages/argdown-core/src/index.ts`

Exit criterion: all valid Micro examples produce the expected shared normalized graph, and ambiguous or conflicting inputs produce the specified diagnostics.

### Phase 4: Canonical Serializers and Converters

1. Add canonical Micro serialization with definitions, discourse roots, wrappers, four-space indentation, explicit directions, mandatory inline contextual colons, and Excerpt-only blocks.
2. Add or extend full Argdown+ serialization for the Micro-to-full conversion target.
3. Implement graph-equivalence comparison for round-trip tests.
4. Reject unsupported full-to-Micro features, including multiline non-Excerpt text and invalid Excerpt relations, with structured diagnostics rather than dropping them.
5. Preserve Excerpt aliases, exact content, and citation selections in graph-equivalence comparison.

Suggested modules:

- `packages/argdown-core/src/micro/MicroArgdownSerializer.ts`
- `packages/argdown-core/src/plugins/ArgdownPlusExportPlugin.ts`
- `packages/argdown-core/src/model/compareNormalizedDocuments.ts`

Exit criterion: Micro → full → graph and supported full → Micro → graph round trips preserve the shared semantic contract.

### Phase 5: Tooling and Documentation

1. Add `micro-argdown+` to configuration schemas and language-server mode selection.
2. Extend completion, hover, symbols, rename, and references to wrapped and text-derived identities; remove bare-identifier navigation behavior.
3. Update TextMate, Prism, Highlight.js, and CodeMirror grammars with the shared comment syntax and Micro mode where applicable.
4. Document migration warnings, canonical replacements, and unsupported full-to-Micro constructs.
5. Add examples for identifier-free drafting, type inference, contrary versus contradiction, and precise attack reconstruction.
6. Correct configuration examples and release notes so they distinguish prototype behavior from verified end-to-end activation and describe `discussionPoints` as primary only after the model migration lands.

Exit criterion: editor behavior, highlighting, and published documentation agree with the core parser and diagnostics.

### Phase 6: Pending Excerpt and Micro Semantic Revision

This phase supersedes the affected parts of the implemented baseline and must land before another completion claim:

1. Remove Micro bare-mention parsing, document-wide capture of unwrapped tokens, bare-ID rename/reference logic, and related warnings.
2. Split `Excerpt` out of `DiscussionPoint` into an exact text-artifact model while retaining a broader relation-endpoint abstraction.
3. Make normalized Excerpt content value-like: merge identical anonymous content, reject conflicting content for one ID, and diagnose duplicate explicit aliases.
4. Restrict Excerpt endpoints to the three citation shapes in Section 2.2; reject Excerpt equality and every other semantic relation.
5. Interpret root Excerpt text as the complete artifact and explicit relation-level Excerpt text as a citation selection requiring a root definition.
6. Add Micro Excerpt blocks and anonymous `>>` inference; reject multiline non-Excerpt Micro content and make block-bearing Micro occurrences leaves.
7. Update serializers, converters, graph comparison, JSON, maps, renderers, language-server providers, highlighting, schemas, examples, and release notes for the revised entity taxonomy.
8. Add migration diagnostics for documents accepted by the implemented baseline but invalid under the revised contract.

Exit criterion: the model no longer reports Excerpts as Discussion Points, every Excerpt edge is a valid citation, Micro has no bare mentions or non-Excerpt multiline text, and supported round trips preserve exact Excerpt content and selections.

### Phase 7: Release Gates

1. Run core parser/model/export tests and classic-mode regressions.
2. Run language-server and syntax-highlighter suites.
3. Validate representative legacy loose documents in Argdown+ mode and review warning quality.
4. Release warning-only normalization changes before considering removal or hard rejection of non-canonical legacy forms.

Exit criterion: no classic Argdown regression, stable normalized graphs across both Argdown+ dialects, and no silent semantic loss in conversion.

## 10. Required Test Matrix

At minimum, cover:

1. `^>` and `<^` normalize to the correct premise/Argument direction.
2. `-` remains contrary and `><` remains contradictory.
3. `->` and `<-` warn only after resolving both endpoints as Statements.
4. generic attacks involving Arguments remain directional and receive a refinement warning.
5. Statement `<+`/`+>` normalizes to implication; Argument source normalizes to justification.
6. `<+ A1` creates an identifier-free Argument even when `<A1>` is defined elsewhere; `<+ <A1>` is the explicit reference.
7. `<+ Storage balances supply.` creates one identifier-free Argument.
8. `<+ <A1>: Short text.` stores occurrence-scoped contextual text, while colons in unwrapped prose remain prose.
9. one-word and multiword unwrapped text follow the same prose rule and never resolve through the explicit ID namespace.
10. identical anonymous DP text merges; explicit DP IDs allow identical wording without merging.
11. explicit definitions resolve wrapped forward references and detect conflicts without capturing text-derived identities.
12. `//`, `/* ... */`, and `<!-- ... -->` work in all variants; `#` is not a Micro comment.
13. `https://...` is never split by line-comment recognition.
14. supported graph round trips are equivalent; unsupported full-to-Micro conversion fails diagnostically.
15. default `argdown` rejects or preserves every Argdown+-only token and treats `[?Q]` as the literal legacy title `?Q`.
16. programmatic and frontmatter `parser.syntax = "argdown+"` produce identical strict settings, models, and diagnostics.
17. an explicitly requested loose model under Argdown+ warns and remains strict.
18. full Argdown+ `>>` works for every explicit Discussion Point type and remains mandatory for Excerpts.
19. multiple root definitions preserve all occurrences, select the first non-empty canonical text, and warn on competing text.
20. relation-level Argument definitions become contextual relation occurrences rather than context-free Argument descriptions.
21. JSON and map edges retain contextual occurrence text/data, and map nodes retain `discussionPointType`.
22. HTML preserves typed wrappers and DOT, GraphML, and Dagre agree on weak-relation styles.
23. actual Node/browser language-server paths honor document activation and publish model errors and warnings.
24. one canonical symbol fixture yields the same current relations in TextMate, Prism, Highlight.js, and CodeMirror.
25. Micro `>>` creates an anonymous Excerpt, accepts explicit `[>E] >>`, and rejects blocks on Statements, Questions, References, and Arguments.
26. Micro rejects multiline non-Excerpt definitions and contextual text; the full-to-Micro converter diagnoses them without folding.
27. identical anonymous Excerpt blocks merge by normalized exact content; a one-character difference creates another artifact.
28. one Excerpt ID with different exact definitions fails; identical content under multiple explicit IDs produces an alias diagnostic.
29. Reference-to-DP, Reference-to-Excerpt, and Excerpt-to-DP citations pass; Excerpt-to-Excerpt and every non-citation Excerpt edge fail.
30. `==` and `~=` reject Excerpt endpoints while retaining same-type DP equality.
31. contextual Excerpt selection requires a root-level complete definition and a citation relation; a normalized substring mismatch warns.
32. JSON, maps, renderers, language-server providers, and converters distinguish Excerpts from Discussion Points and preserve citation selections.
