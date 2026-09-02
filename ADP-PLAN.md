## Argdown+ (Superset) Monorepo Implementation Plan

### Summary
This plan upgrades the existing Argdown implementation to an explicit `argdown+` mode, keeps legacy Argdown behavior as default, introduces a normalized entity model with Discussion Point compatibility views, and rolls out parser/model/rendering/tooling changes in staged gates across the monorepo.

The corrective work for mode isolation, configuration activation, the normalized model, lossless downstream propagation, canonical Argdown+ normalization, migration diagnostics, the Micro-Argdown+ drafting front end, and bidirectional conversion is specified in [ADP-MICRO-ALIGNMENT.md](ADP-MICRO-ALIGNMENT.md). The baseline after the 2026-09-01 source audit was implemented, but the later Excerpt ontology and Micro grammar decisions reopen the affected stages below.

### Implementation Status (Current)

| Step | Status |
|---|---|
| 1. Spec lock + migration contract | Complete — normative contracts and paired fixtures cover the revised ontology and Micro grammar |
| 2. Mode plumbing and config schema updates | Complete — three isolated syntax modes and preflight frontmatter resolution are wired end to end |
| 3. Lexer extension | Complete — Argdown+ tokens are confined to Argdown+ mode and legacy behavior is regression-tested |
| 4. Parser grammar extension | Complete — full general blocks and Micro Excerpt-only explicit/anonymous blocks are implemented; Micro bare mentions are removed |
| 5. Normalized entity model + compatibility views | Complete — Excerpts are exact text artifacts outside `discussionPoints`, with a broader graph-entity/endpoint model |
| 6. ModelPlugin Argdown+ semantics/validation | Complete — citation-only constraints, exact identity/aliases, and root-backed passage selections are enforced |
| 7. Legacy semantics compatibility in Argdown+ | Complete — type-sensitive normalization and migration warnings are implemented |
| 8. Export/map/render updates | Complete — entity kind and contextual occurrences survive JSON/map/DOT/GraphML paths; aliases survive canonical conversion |
| 9. Language server updates | Complete — wrapped-only Micro references and Excerpt block-safe navigation/rename are covered |
| 10. Syntax highlighting/editor integrations | Complete — current symbols and `>>` are covered and obsolete TextMate `*` relation highlighting is removed |
| 11. Docs/examples/migration guidance | Complete — normative, package, release, syntax, configuration, and example documentation reflects the revised contract |
| 12. End-to-end validation and release gates | Complete for the revised core/tooling scope — core and language-server suites plus editor grammar validation pass |

### Completed Audit Gate

The Micro-Argdown+ implementation was gated on and now includes these prerequisite repairs:

1. resolve request, frontmatter, and external configuration before lexing or plugin preparation;
2. isolate classic and Argdown+ lexer/parser behavior;
3. make `discussionPoints` the primary model and retain legacy maps as derived views;
4. move contextual text/data into the normalized relation-occurrence model;
5. repair JSON, map, HTML, DOT, GraphML, language-server, and TextMate end-to-end paths;
6. establish fixtures and graph-equivalence tests before adding the Micro front end.

### Open Points And Questions To Address (From Draft)
These were the blocking ambiguities in the draft spec and are now locked for implementation:

| Open point from draft | Decision to implement |
|---|---|
| How argdown+ is activated | Resolve API/config/frontmatter in a preflight phase, then select an isolated `parser.syntax = "argdown+"`; default remains `"argdown"`. |
| Whether argdown+ semantics are strict | Argdown+ always forces strict semantics (`model.mode` effectively strict). |
| Direction in relation blocks | `SYM child` = parent→child; `<SYM child` = child→parent; special inverse for implies is `<=`; symmetric `><`, `==`, `~=` stay symmetric. |
| `>>` operator policy | Full Argdown+: required for Excerpts and optional for DPs. Micro: Excerpt-only; anonymous `>>` locally creates an Excerpt and blocks on non-Excerpts fail. |
| Root vs relation-level text semantics | Root DP text is context-free wording. Root Excerpt text is the complete artifact. Relation-level DP text is contextual wording; relation-level Excerpt text is a citation selection requiring a root definition. |
| Competing root definitions | Preserve all occurrences; first non-empty text is canonical and later differing text warns. |
| ID namespace and type conflicts | Single global ID namespace; mixed type markers for same ID are hard validation errors. |
| Explicit statement marker `!` | `[ID]`, `[!ID]`, `@[ID]`, `@[!ID]` are accepted and normalized to Statement type. |
| Anonymous node handling | Deterministic typed generated IDs. Micro has no bare mentions: every unwrapped non-block remainder is prose, including a single token matching an ID. |
| Excerpt ontology | Excerpts are exact text artifacts outside `DiscussionPoint`; normalized exact content supplies value identity and explicit IDs may alias it. |
| Equality semantics | `==` and `~=` are symmetric DP-only relations. Excerpts are deliberately excluded because exact content identity is intrinsic. |
| Excerpt relations | Only Reference→DP, Reference→Excerpt, and Excerpt→DP citation are valid. |
| Legacy symbols in argdown+ | Legacy symbols remain supported; in strict semantics, Statement support maps to `IMPLIES`, statement-source `-`/`->`/`<-` maps to contrariness, and `_` remains undercut. |
| Edge contextual text duplicates | Store per occurrence (directional); keep one semantic relation with many occurrences. |
| Inference objects | Keep structural inferences outside the DP namespace but include them explicitly in the broader relation-endpoint union. |
| Visual strategy | Unique relation styles with group logic; dashed for `~=`, `%>`, `?>`, `@>`; subtle box-like DP node differentiation. |
| Fork naming rollout | Keep current package names initially; defer scope/package rename work. |

---

### Step-By-Step Plan

1. **Spec lock + migration contract (no code behavior changes yet).**
Create a short internal “argdown+ contract” doc and fixtures that codify symbol syntax, direction rules, type constraints, ID rules, and legacy mapping before touching core logic.
Primary files: [docs/syntax/README.md](docs/syntax/README.md), [packages/argdown-core/README.md](packages/argdown-core/README.md), new fixtures under `packages/argdown-core/test/fixtures/argdown-plus/`.
Exit criteria: all contributors can implement from one canonical rule table with no implicit decisions left.

2. **Mode plumbing and config schema updates.**
Add parser setting `syntax: "argdown" | "argdown+" | "micro-argdown+"`; keep default as `argdown`. In both Argdown+ dialects, enforce strict model semantics regardless of loose config, with explicit warning handling.
Primary files: [packages/argdown-core/src/plugins/ParserPlugin.ts](packages/argdown-core/src/plugins/ParserPlugin.ts), [packages/argdown-core/src/index.ts](packages/argdown-core/src/index.ts), [packages/argdown-vscode/syntaxes/argdown-config.schema.json](packages/argdown-vscode/syntaxes/argdown-config.schema.json).
Exit criteria: configuration can switch syntax mode deterministically and tooling schema validates it.

3. **Lexer extension for argdown+ symbols and excerpt blocks.**
Extend tokenization with typed relation symbols (`=>`, `<=`, `^>`, `<^`, `:>`, `<:`, `%>`, `<%`, `?>`, `<?`, `!>`, `<!`, `@>`, `<@`, `==`, `~=`) while preserving legacy tokens and precedence. Add excerpt `>>` block tokenization with indentation-bounded content.
Primary files: [packages/argdown-core/src/TokenNames.ts](packages/argdown-core/src/TokenNames.ts), [packages/argdown-core/src/lexer.ts](packages/argdown-core/src/lexer.ts), [packages/argdown-core/src/ArgdownErrorMessageProvider.ts](packages/argdown-core/src/ArgdownErrorMessageProvider.ts).
Exit criteria: lexer tests pass for both legacy and argdown+ fixtures, including ambiguous symbol edges.

4. **Parser grammar extension for new relations and excerpt `>>` blocks.**
Add parser rules for new relation tokens, direction-aware relation children, and excerpt block definitions in root and relation contexts. Keep legacy grammar paths untouched for `parser.syntax="argdown"`.
Primary files: [packages/argdown-core/src/RuleNames.ts](packages/argdown-core/src/RuleNames.ts), [packages/argdown-core/src/parser.ts](packages/argdown-core/src/parser.ts).
Exit criteria: parser produces AST for mixed legacy+argdown+ documents with correct rule nodes.

5. **Introduce a normalized entity model with compatibility views.**
Keep a DP-centric `discussionPoints` store for Statements, Questions, References, and Arguments; add exact Excerpt text artifacts outside that union; and keep existing `statements`/`arguments` response maps as derived compatibility projections. Define `DiscussionPoint`, `TextArtifact`, and the broader `RelationEndpoint` explicitly.
Primary files: [packages/argdown-core/src/model/model.ts](packages/argdown-core/src/model/model.ts), [packages/argdown-core/src/model/toJSON.ts](packages/argdown-core/src/model/toJSON.ts), [packages/argdown-core/src/plugins/JSONExportPlugin.ts](packages/argdown-core/src/plugins/JSONExportPlugin.ts).
Exit criteria: public response distinguishes DPs, Excerpts, and structural inferences without breaking current consumers of statements/arguments.

6. **ModelPlugin refactor for argdown+ semantics and validation.**
Implement ID/type parsing (`[ID]`, `[!ID]`, `[?ID]`, `[@ID]`, `[>ID]`, `<ID>`), type conflict validation, anonymous typed ID generation, relation type constraints, and root-vs-relation text routing. Add exact Excerpt normalization/aliasing, citation-only endpoint validation, and occurrence-scoped passage selections backed by complete root definitions.
Primary files: [packages/argdown-core/src/plugins/ModelPlugin.ts](packages/argdown-core/src/plugins/ModelPlugin.ts), [packages/argdown-core/src/deriveImplicitRelations.ts](packages/argdown-core/src/deriveImplicitRelations.ts).
Exit criteria: strict validation errors are precise; relation occurrences carry directional contextual text/selection plus metadata; Excerpts cannot leak into DP-only relations.

7. **Legacy semantics compatibility in argdown+ strict mode.**
Apply the agreed legacy mapping in argdown+ mode: Statement support => `IMPLIES`, statement-source `-`/`->`/`<-` => contrariness, `_` => undercut, while preserving existing strict behavior for Argument-involving edges.
Primary files: [packages/argdown-core/src/plugins/ModelPlugin.ts](packages/argdown-core/src/plugins/ModelPlugin.ts), [packages/argdown-core/src/model/model.ts](packages/argdown-core/src/model/model.ts).
Exit criteria: legacy files parse without regressions; semantic mapping matches the locked contract.

8. **Export/map/render pipeline update for new entity/relation types.**
Extend map edge/node typing and renderer/exporter logic for all new relation types, DP distinctions, and Excerpt text artifacts, with unique color groups and dashed weak-relation styles (`~=`, `%>`, `?>`, `@>`). Preserve Excerpt aliases and citation selections or diagnose intentional loss.
Primary files: [packages/argdown-core/src/plugins/MapPlugin.ts](packages/argdown-core/src/plugins/MapPlugin.ts), [packages/argdown-core/src/plugins/ColorPlugin.ts](packages/argdown-core/src/plugins/ColorPlugin.ts), [packages/argdown-core/src/plugins/DotExportPlugin.ts](packages/argdown-core/src/plugins/DotExportPlugin.ts), [packages/argdown-core/src/plugins/GraphMLExportPlugin.ts](packages/argdown-core/src/plugins/GraphMLExportPlugin.ts), [packages/argdown-core/src/plugins/HtmlExportPlugin.ts](packages/argdown-core/src/plugins/HtmlExportPlugin.ts), [packages/argdown-map-views/src/DagreMap.ts](packages/argdown-map-views/src/DagreMap.ts), [packages/argdown-map-views/src/argdown-dagre.css](packages/argdown-map-views/src/argdown-dagre.css).
Exit criteria: all outputs render meaningful distinctions for relation, DP, and Excerpt types without presenting Excerpts as Discussion Points.

9. **Language server update for navigation, hover, references, rename, symbols.**
Update relation symbol generation, token handling, document symbols, completions, and rename/reference behavior for typed IDs, Excerpt artifacts, and new relation classes. Remove Micro bare-ID resolution and rename/reference behavior.
Primary files: [packages/argdown-language-server/src/providers/utils.ts](packages/argdown-language-server/src/providers/utils.ts), [packages/argdown-language-server/src/providers/DocumentSymbolPlugin.ts](packages/argdown-language-server/src/providers/DocumentSymbolPlugin.ts), [packages/argdown-language-server/src/providers/provideCompletion.ts](packages/argdown-language-server/src/providers/provideCompletion.ts), [packages/argdown-language-server/src/providers/provideRenameWorkspaceEdit.ts](packages/argdown-language-server/src/providers/provideRenameWorkspaceEdit.ts), [packages/argdown-language-server/src/providers/findReferences.ts](packages/argdown-language-server/src/providers/findReferences.ts).
Exit criteria: VS Code language features remain stable and support argdown+ syntax.

10. **Syntax highlighting grammars and editor integrations.**
Update all bundled grammars/modes for new relations, typed IDs, full blocks, and Micro Excerpt-only block syntax: TextMate, Highlight.js, Prism, CodeMirror, and associated CSS classes.
Primary files: [packages/argdown-vscode/syntaxes/argdown.tmLanguage.json](packages/argdown-vscode/syntaxes/argdown.tmLanguage.json), [packages/argdown-highlightjs/src/index.ts](packages/argdown-highlightjs/src/index.ts), [packages/argdown-prism/index.js](packages/argdown-prism/index.js), [packages/argdown-codemirror-mode/index.js](packages/argdown-codemirror-mode/index.js).
Exit criteria: highlighted output matches parser semantics across editors.

11. **Docs, examples, and user-facing migration guidance.**
Add Argdown+ syntax sections, legacy compatibility examples, strict validation examples, Excerpt artifact/citation examples, no-bare-mention Micro guidance, conversion diagnostics, and “argdown vs argdown+ mode” configuration guidance.
Primary files: [docs/syntax/README.md](docs/syntax/README.md), [docs/guide/configuration.md](docs/guide/configuration.md), [examples/argdown-primer.argdown](examples/argdown-primer.argdown), plus new argdown+ examples in `examples/`.
Exit criteria: users can author argdown+ and migrate legacy files without guessing.

12. **End-to-end validation and staged release gates.**
Run package-level tests and add cross-package regression tests for parser/model/export/language-server/highlighting behavior; release in staged tags (core first, then tooling packages, then VSCode extension).
Primary commands: monorepo `yarn test` + targeted package tests for core/language-server/vscode/highlighters.
Exit criteria: no regressions in legacy mode; argdown+ scenarios green across all affected packages.

### Revised-Contract Execution Order

The reopened work should be implemented in this dependency order:

1. update contract fixtures and add failing tests for no-bare Micro parsing, Excerpt-only citation, DP-only equality, exact Excerpt identity, and citation selections;
2. split `IExcerpt`/`TextArtifact` from `IDiscussionPoint` and update normalized graph comparison/serialization types;
3. enforce the revised full Argdown+ relation and Excerpt-definition invariants in `ModelPlugin`;
4. simplify the Micro parser by removing bare-ID resolution, then add Excerpt-only `>>` blocks and block-aware comment handling;
5. update Micro/full serializers and converters, diagnosing multiline non-Excerpt content and all unsupported artifact structures;
6. propagate entity-kind and selection data through JSON, maps, HTML, DOT, GraphML, and Dagre;
7. remove bare-ID language-server behavior and add Excerpt block navigation, diagnostics, symbols, and editor highlighting;
8. update examples, package documentation, release notes, and configuration guidance;
9. run core, converter, export, language-server, highlighter, and classic-mode regression gates before marking the reopened stages complete.

---

### Important Public API / Interface / Type Additions

1. Add `parser.syntax?: "argdown" | "argdown+" | "micro-argdown+"` to parser settings and config schema.
2. Keep the unified DP response surface (`discussionPoints`) for Statements, Questions, References, and Arguments; add an Excerpt/text-artifact surface and a broader relation-endpoint union while keeping compatibility fields (`statements`, `arguments`).
3. Extend relation typing to include extended semantic relations and per-occurrence contextual text/data.
4. Extend color/style config to include new relation types and weak-relation line-style controls.
5. Keep package names unchanged in this rollout; no immediate npm scope rename.

---

### Test Cases And Scenarios

1. Mixed-mode regression: same file parsed in `argdown` mode and `argdown+` mode with expected semantic differences.
2. ID typing: valid typed IDs, invalid cross-type reuse, `[!ID]` normalization, mention variants (`@[ID]`, `@[!ID]`).
3. Relation direction: `SYM` and `<SYM` behavior including `=>`/`<=`, symmetry of `><`, `==`, `~=`.
4. Constraint validation: all allowed/disallowed DP combinations plus the three valid citation shapes; every other Excerpt edge and Excerpt equality fails.
5. Block parsing: full Argdown+ keeps general blocks and requires them for Excerpts; Micro accepts `>>` only for explicit/anonymous Excerpts and keeps block contents opaque.
6. Root vs relation-level text: root DP text updates neutral wording; root Excerpt text defines exact content; relation-level Excerpt text is a citation selection requiring the root artifact.
7. Anonymous inference: question/reference/argument/statement defaults, local anonymous-Excerpt `>>` inference, deterministic ID generation, and no bare-ID lookup in Micro.
8. Legacy strict mapping: `+`, `-`, `->`, `<-`, `_` behavior under argdown+ strict semantics.
9. Rendering snapshot tests: HTML/DOT/GraphML/Dagre for relation/DP/Excerpt styles, artifact identity, selections, and dashed weak relations.
10. Language-server scenarios: hover, references, rename, document symbols with typed IDs and new relations; unwrapped Micro tokens remain prose.
11. Highlighting snapshots: TextMate/Prism/Highlight.js/CodeMirror tokenization for new syntax.
12. Backward-compat suite: existing Argdown examples and core tests stay green in default mode.

---

### Explicit Assumptions And Defaults Chosen

1. `argdown` remains the default syntax mode; argdown+ is opt-in via parser setting.
2. Argdown+ always uses strict semantic interpretation.
3. Relation contextual text is occurrence-scoped and directional. For DPs it is contextual wording; for an explicit Excerpt it is a citation passage selection backed by the complete root artifact.
4. “No meta-statement contextual text” is documentation guidance, not enforced semantic lint in first rollout.
5. Package scope/name migration for branding `argdown+` is deferred to a later release track.
6. Micro deliberately trades universal full-to-Micro conversion for concision: multiline non-Excerpt content is rejected or diagnosed, never silently folded.
7. Exact normalized Excerpt content supplies artifact identity; equality relations remain semantic and DP-only.
