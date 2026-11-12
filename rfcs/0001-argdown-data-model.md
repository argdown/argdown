# RFC 0001: Abstract Argdown Data Model

| | |
|---|---|
| **RFC** | 0001 |
| **Title** | Abstract Argdown Data Model |
| **Status** | Draft |
| **Authors** | Gregor Betz |
| **Created** | 2026-11-10 |
| **Related** | RFC 0002 (validation), RFC 0003 (dialectical grounding), RFC 0004 (classical semantics); planned: RFC 0005 (RDF/SHACL encoding), GraphQL schema, informative AIF mapping |

## 1. Summary

This RFC defines an abstract data model for Argdown that does not depend on any implementation. The model has two kinds of node, statements and arguments, three layers and debate structures:

- an **inferential layer**: a directed multi-hypergraph of inferences between statements;
- a **logical layer**: an undirected multi-hypergraph of logical relations (equivalence, contradiction, exclusivity, exhaustiveness) between statements;
- a **dialectical layer**: a directed multigraph of support, attack and undercut relations between arguments and statements;
- **debate structures**: subdebates, which are named and possibly overlapping sets of nodes.

The model is deliberately permissive. It records what has been asserted and leaves derivation to reasoners. Validation (RFC 0002), dialectical grounding (RFC 0003) and classical semantics (RFC 0004) are specified separately.

This RFC fixes only the abstract model. Companion RFCs will encode it in RDF with SHACL, and later in GraphQL.

## 2. Motivation

Argdown's data model is currently defined implicitly by its TypeScript implementation (`packages/argdown-core/src/model/`) and by the JSON export. That causes four problems:

- **No language-neutral reference.** Tools outside the JavaScript ecosystem have nothing to implement against, and neither do datasets (for example in argument mining) or LLM pipelines.
- **The model is mixed up with parsing and presentation.** Examples are title-based equivalence classes, relations derived during parsing, and map-specific nodes.
- **Inferences are not first-class.** They are hidden inside argument-local premise-conclusion structures, so they can't be shared, referenced or annotated on their own.
- **No formal semantics or standard validation.** That makes interoperability, for example with Linked Data and AIF, hard.

A small, explicit, abstract model addresses all four. It separates *what an Argdown debate is* from *how it is written* (syntax and parser), *how it is checked* (validation) and *what follows from it* (reasoning).

## 3. Design principles

**P1. Asserted content only.** The model stores what has been asserted. It does not store what follows from it. Closure properties (for example transitivity of equivalence or of inference), consistency between the dialectical layer and the inferential and logical layers, and derived structures (for example a subdebate's induced subgraph) are not part of the model. P1 constrains what the model *stores*, not what processing may *compute*: validation (§5) MAY compute derived structure on the fly, and reasoners MAY derive further content, without either becoming part of the model.

**P2. Parsers decide what gets asserted.** The model takes no position on how source text maps to entities. For example, whether two Argdown statements with the same title are linked by an equivalence relation is decided by the parser, not by the model.

**P3. Permissive core, separate validation.** The model can represent any state that is meaningful but incomplete or flawed. Constraints are checked afterwards by validation (§5). One test decides what the model admits:

> A state is admitted by the model if and only if it is a meaningful state that people actually produce (for example, an argument that has not been reconstructed yet). States that are meaningless (for example, undercutting a statement) are excluded by well-formedness constraints.

**P4. Identity is separate from labels.** Every entity has its own identifier. Labels are display names. They are optional and need not be unique.

**P5. Uniform reification.** Every relation is an entity with its own identifier: inferences, logical relations and dialectical relations alike. Relations can therefore carry properties and occur multiple times. Plain binary shortcuts, such as a direct triple between two statements, MAY be offered as derived conveniences.

**P6. Open properties.** Every entity MAY carry arbitrary additional properties (metadata).

## 4. The abstract model

### 4.1 Overview

A model *M* holds exactly one **debate** and consists of the following disjoint sets of entities:

| Set | Entities | Layer |
|---|---|---|
| *S* | statements | nodes |
| *A* | arguments | nodes |
| *I* | inferences | inferential |
| *L* | logical relations | logical |
| *R* | dialectical relations | dialectical |
| *G* | subdebates | debate structure |

*N* = *S* ∪ *A* is the set of **nodes**. Every entity has a unique identifier. The sets are pairwise disjoint; in particular, no entity is both a statement and an argument.

### 4.2 Debate

The debate is the single top-level container of a model. It carries document-level metadata such as title, authors and date, as open properties (P6). A collection of several debates is a collection of several models.

### 4.3 Statements

A statement *s* ∈ *S* is atomic. It has:

- `label`: an optional string. Labels are not unique (P4).
- `text`: an optional string, which MAY contain inline Markdown. The model gives the text no further structure: mentions, links and formatting stay inside the string, and parsers or reasoners MAY extract them.

At least one of `label` and `text` MUST be present.

Statements are atomic in the strict sense: two formulations are two statements. Whether they are equivalent is expressed, if at all, by an explicit equivalence relation (§4.6).

### 4.4 Arguments

An argument *a* ∈ *A* has:

- `label`: an optional string.
- `gist`: an optional string, which MAY contain inline Markdown.
- `inferences`: a finite set of inferences, which MAY be empty. These are the inferences the argument references, and together they form its *premise-conclusion structure*. An argument with an empty set is *sketched* (unreconstructed).
- `mainConclusion`: one statement, present if and only if `inferences` is non-empty. It is a final conclusion of the argument's inferences (RFC 0002, C9 and C10).

A statement's role within an argument (premise, intermediate conclusion, main conclusion) is not stored. It can be derived from the referenced inferences.

### 4.5 Inferential layer

An inference *i* ∈ *I* is a directed hyperedge with:

- `premises`: a non-empty, finite set of statements;
- `conclusion`: exactly one statement.

The inferences form the inferential layer, a **directed multi-hypergraph** on *S*:

- **Duplicates are allowed.** Distinct inferences MAY have the same premises and conclusion, for example because they carry different properties.
- **Inferences can be shared.** An inference MAY be referenced by any number of arguments.
- **Inferences can stand alone.** An inference MAY be referenced by no argument at all. For example, a single-premise inference {*A*} → *B* can express that *A* entails *B*.

Properties of an inference, such as the inference rule it applies, belong to the inference itself. An argument's reference to an inference carries no properties. If two arguments disagree about such properties, they reference different inferences.

**Inferences are uninterpreted.** The model does not say whether an inference is deductive or defeasible. Readings are left to reasoners (RFC 0003, RFC 0004).

### 4.6 Logical layer

A logical relation *l* ∈ *L* is an **undirected** relation between statements. It has a `type` and a set of `members`:

| `type` | `members` | Intended reading |
|---|---|---|
| `equivalent` | exactly 2 | both have the same truth value: *A* ↔ *B* |
| `contradictory` | exactly 2 | exactly one is true: *A* ↔ ¬*B* |
| `exclusive` | 2 or more | at most one is true |
| `exhaustive` | 2 or more | at least one is true |

The logical relations form the logical layer, an **undirected multi-hypergraph** on *S*. Logical relations are entities (P5). Duplicates are allowed.

Logical relations have no direction. The roles of attacker and attacked belong to the dialectical layer.

Unlike inferences, the types of logical relations have a fixed intended reading, and they express truth-value constraints without relying on how inferences are read. For example:

- **Contrariety** ¬(*A* ∧ *B*) is `exclusive` with two members.
- **Subcontrariety** *A* ∨ *B* is `exhaustive` with two members.
- **Mutually exclusive and collectively exhaustive** statements *A1*, …, *An* are members of both an `exclusive` and an `exhaustive` relation.

`contradictory` is redundant: it says the same as `exclusive` plus `exhaustive` over the same two members. It is kept as a primitive because contradiction is a common, single assertion that should be one entity.

`equivalent` is binary. Equivalence among several statements is expressed by several `equivalent` relations; their transitive closure is derived, not stored (P1).

**Strict entailment is not a logical relation.** That *A* entails *B* is expressed by an inference {*A*} → *B* (§4.5).

### 4.7 Dialectical relations

A dialectical relation *r* ∈ *R* is a **directed** edge with a `type`, a `source` and a `target`:

| `type` | `source` | `target` |
|---|---|---|
| `support` | argument or statement | argument or statement |
| `attack` | argument or statement | argument or statement |
| `undercut` | argument or statement | argument |

The dialectical layer is a **directed multigraph**: dialectical relations are entities (P5), and duplicates are allowed. This multigraph corresponds to what is drawn as an argument map.

**Dialectical relations are primitives.** They are not derived from the inferential or logical layer. Whether a dialectical relation agrees with the logical relations and inferences is a question for reasoning (P1); see RFC 0003.

**An undercut targets the argument as a whole.** It does not say which of the argument's inferences it challenges. An undercut is meaningful even for an argument that references no inferences at all. Identifying the inference that is challenged is left to reasoners.

### 4.8 Subdebates

A subdebate *g* ∈ *G* has:

- `label`: an optional string;
- `members`: a finite set of nodes (arguments and statements).

Subdebates MAY overlap, because a node can belong to several of them. Relations are not members. A subdebate's subgraph is the one induced by its members, and that is derived, not stored.

Nesting is not stored either. A subdebate *g* is nested in a subdebate *h* if the members of *g* are a proper subset of the members of *h*. This derived relation is a strict partial order, so it cannot contain cycles, and a subdebate can be nested in several others.

### 4.9 Properties and tags

Every entity, including the debate, MAY carry arbitrary properties (P6). `tag` is a predefined, multi-valued string property of nodes.

## 5. Validation

Validation is separate from the model (P3). Validation checks are specified in RFC 0002.

## 6. Mapping from Argdown syntax (informative)

This section is not normative (P2). It illustrates how a parser might map Argdown source text to the model.

- **Same title, different texts.** `[A]: text 1` and `[A]: text 2` produce two statements with the label `A`. The parser MAY also add an `equivalent` relation between them.
- **Support between statements.** `[A] +> [B]` MAY produce both a single-premise inference {*A*} → *B* and a `support` relation from *A* to *B*.
- **Attack between statements.** `[A] -> [B]` MAY produce both an `exclusive` relation with members *A* and *B* and an `attack` relation from *A* to *B*.
- **Contradiction.** `[A] >< [B]` produces a `contradictory` relation with members *A* and *B*.
- **Further logical syntax.** Parsers MAY add syntax for the other logical relations, for example `[A] == [B]` for `equivalent`, a disjunction operator for `exhaustive`, and list syntax for mutually exclusive and collectively exhaustive statements (one `exclusive` and one `exhaustive` relation). Symbols with an established logical meaning should be avoided where it differs: `|` is the Sheffer stroke (NAND, i.e. contrariety), and chained `^` (XOR) is parity, not "exactly one".
- **Premise-conclusion structure.** An argument's premise-conclusion structure produces one inference per inference step, and the argument references each of them.
- **Sections.** Each heading produces a subdebate. Its members are all nodes in its section, including the nodes under nested subheadings, so that the derived nesting (§4.8) reproduces the heading hierarchy.
- **Tags and data.** `#tags` become `tag` values, and YAML data blocks become properties.

## 7. Mapping from the legacy model (informative)

This section is not normative. It relates the model of the current implementation (`packages/argdown-core/src/model/model.ts`) to this RFC.

| Legacy | This RFC |
|---|---|
| Equivalence class (one title, several member statements with texts) | One statement per member, with the title as `label`, plus `equivalent` relations between them (pairwise, as RFC 0003 §5 assumes) |
| Argument title | Argument `label` |
| Argument descriptions | Argument `gist` (one description per argument; further descriptions MAY become properties) |
| Premise-conclusion structure (`pcs`) | One inference per inference step, referenced by the argument; the last conclusion becomes `mainConclusion` |
| Statement roles (premise, intermediary conclusion, main conclusion) | Not stored; derived from the inferences (§4.4) |
| Inference rules and inference data | Properties of the inference |
| `entails` (`[A] +> [B]`) | Single-premise inference {*A*} → *B*, optionally with a `support` relation |
| `contrary` (`[A] -> [B]`, merged in both directions) | `exclusive` relation with two members, optionally with an `attack` relation |
| `contradictory` (`[A] >< [B]`) | `contradictory` relation |
| `support`, `attack` | `support`, `attack` |
| `undercut` targeting an inference | `undercut` targeting the inference's argument |
| Relations derived implicitly from equivalence classes and arguments | Not stored (P1); computed by grounding (RFC 0003) |
| Sections and groups | Subdebates (§6) |
| Tags, data | `tag` values, properties |
| Text ranges (bold, italic, mentions, links) | Kept inside `text` or `gist` as inline Markdown (§4.3) |
| Source locations | Out of scope (provenance, §8) |
| Map nodes, map edges, colours | Out of scope (presentation, §8) |

## 8. Out of scope

- **Presentation:** layout, colours, map-only nodes and other display settings.
- **Provenance:** source positions, and which source text produced which entity.
- **Premise order** within an argument.
- **Document structure:** the order of headings and the exact shape of the document outline.
- **Reasoning:** specified separately (RFC 0003, RFC 0004).
- **Dialogue structure:** speakers and locutions.

These may be covered later by separate annotation vocabularies.

## 9. Alternatives considered

**Statements as equivalence classes.** In Argdown today, all occurrences that share a title form one statement, with several texts. This RFC instead makes statements atomic and turns equivalence into an explicit relation (§4.3, §4.6). That keeps identity simple and makes each assumption that two texts say the same thing visible.

**Argument-local inferences.** Inferences could exist only inside an argument. Making them global, shareable entities lets several arguments share an inference step. It also lets inferences carry properties, and gives an inference an identity that can be referenced.

**One logical layer for inferences and logical relations.** Inferences and logical relations could form a single layer, as both live on statements. They are kept apart because they differ in structure (directed versus undirected hyperedges), in role (only inferences make up arguments) and in interpretation (inferences are uninterpreted, while logical relations have a fixed intended reading). RFC 0004 already treats them separately (*T_L* versus *T_D*).

**Binary-only logical relations.** With binary relations only, *A* ∨ *B* can be expressed only through an auxiliary statement and an inference read deductively, and "at least one of *A1*, …, *An*" cannot be expressed without auxiliary statements at all. `exclusive` and `exhaustive` are therefore n-ary. `equivalent` and `contradictory` stay binary.

**Contrariety and contradiction as the only conflict types.** The legacy model has `contrary` and `contradictory`. This RFC generalises contrariety to `exclusive` and adds `exhaustive`. `contradictory` is kept although it is redundant (§4.6).

**Strict entailment as a logical relation.** A directed `entails` type in *L* would break the undirectedness of the logical layer and duplicate single-premise inferences. Entailment is expressed by inferences (§4.5); see §10 for marking inferences as strict.

**Directed contrariety.** Argdown's `->` between statements has a direction, but contrariety is logically symmetric. Direction is kept in the dialectical layer only.

**Undercut targeting an inference.** Argdown's implementation allows a relation to target a single inference. This RFC keeps undercut argument-level, so that undercuts can be expressed without any reconstruction, and so that the challenged inference can be left unspecified.

**Dialectical relations derived from, or linked to, logical relations.** Rejected under P1. Matching the two layers is reasoning.

**Explicit subdebate nesting.** Subdebates could carry a `parents` property. That would store structure which can be derived from membership (P1), and it would allow cycles, which validation then has to catch. Deriving nesting from member inclusion avoids both. The price is that empty subdebates, and subdebates with the same members, have no position in the hierarchy, and a node set that happens to fall inside another counts as nested. A deliberate outline belongs to document structure (§8).

**A strict model without separate validation.** Rejected under P3. Incomplete reconstructions are normal, meaningful states of the data.

**The encoding framework.** RDF with SHACL (using the n-ary relation pattern for inferences and relations) was compared with the alternatives:

- **RDF-star / triple terms:** binary only, so unsuitable for hyperedges.
- **OWL:** open-world reasoning, and no validation severities.
- **Labeled property graphs (GQL, Cypher):** no hyperedges and no formal semantics.
- **JSON Schema:** no severities.
- **TypeDB:** weak interoperability.
- **HIF:** no semantics.

RDF with SHACL fits best: it supports reified hyperedges, validation severities, formal semantics and interoperability. LinkML remains an option as an authoring layer that generates RDF, SHACL, JSON Schema and GraphQL. Both will be evaluated in RFC 0005.

**Aligning with AIF.** The inferential and logical layers correspond closely to AIF:

- statements map to I-nodes;
- inferences map to RA-nodes;
- binary conflict (`contradictory`, and `exclusive` with two members) maps to pairs of CA-nodes, because AIF's CA-nodes are directed.

AIF has nothing that corresponds to argument nodes, gists, subdebates, or n-ary `exclusive` and `exhaustive` relations. AIF is therefore kept out of the normative specification. A mapping to AIF may be published as a separate, informative document.

## 10. Unresolved questions

1. **Identifier scheme.** How are entity identifiers minted (for example, IRIs that are stable across re-parsing)?
2. **Structured metadata.** How are nested metadata values (for example, from YAML data) represented?
3. **Annotation vocabularies.** If there is to be an annotation layer for provenance and premise order, what is its scope?
4. **Authoring approach.** Should the companion specifications be authored with LinkML, or by hand?
5. **GraphQL mapping.** How does validation (RFC 0002) map onto GraphQL's closed-world type system (for example, well-formedness as non-null types and diagnostics as a separate result)?
6. **Strict inferences.** Should an inference be markable as strict (deductive), for example by a predefined property, so that strict entailment can be expressed independently of how inferences are read in general?

## 11. Related work

- Argdown core model: `packages/argdown-core/src/model/model.ts`
- JSON Schema for the Argdown JSON export (unmerged branch `cue-schema`)
- AIF specification: Bex, Reed et al. (2011), <https://arg-tech.org/wp-content/uploads/2011/09/aif-spec.pdf>
- W3C RDF 1.2 Concepts: <https://www.w3.org/TR/rdf12-concepts/>
- W3C SHACL: <https://www.w3.org/TR/shacl/>
