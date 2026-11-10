# RFC 0001: Abstract Argdown Data Model

| | |
|---|---|
| **RFC** | 0001 |
| **Title** | Abstract Argdown Data Model |
| **Status** | Draft |
| **Authors** | Gregor Betz |
| **Created** | 2026-11-10 |
| **Related** | planned companion RFCs: RDF/SHACL vocabulary, GraphQL schema, informative AIF mapping |

## 1. Summary

This RFC defines an abstract data model for Argdown that does not depend on any implementation. The model has two kinds of node, statements and arguments, and three kinds of structure:

- a **logical layer**: a directed multi-hypergraph of inferences between statements, plus undirected logical relations;
- a **dialectical layer**: a directed multigraph of support, attack and undercut relations between arguments and statements;
- **debate structures**: subdebates, which are named, nestable and possibly overlapping sets of nodes.

The model is deliberately permissive. It records what has been asserted and leaves derivation to reasoners. Constraints are checked by a separate, two-tier validation.

This RFC fixes only the abstract model. Companion RFCs will encode it in RDF with SHACL, and later in GraphQL.

## 2. Motivation

Argdown's data model is currently defined implicitly by its TypeScript implementation (`packages/argdown-core/src/model/`) and by the JSON export. That causes four problems:

- **No language-neutral reference.** Tools outside the JavaScript ecosystem have nothing to implement against, and neither do datasets (for example in argument mining) or LLM pipelines.
- **The model is mixed up with parsing and presentation.** Examples are title-based equivalence classes, relations derived during parsing, and map-specific nodes.
- **Inferences are not first-class.** They are hidden inside argument-local premise-conclusion structures, so they can't be shared, referenced or annotated on their own.
- **No formal semantics or standard validation.** That makes interoperability, for example with Linked Data and AIF, hard.

A small, explicit, abstract model addresses all four. It separates *what an Argdown debate is* from *how it is written* (syntax and parser), *how it is checked* (validation) and *what follows from it* (reasoning).

## 3. Design principles

**P1. Asserted content only.** The model stores what has been asserted. It does not store what follows from it. Closure properties (for example transitivity of equivalence or of inference), consistency between the logical and dialectical layers, and derived structures (for example a subdebate's induced subgraph) are not part of the model. P1 constrains what the model *stores*, not what processing may *compute*: validation (§5) MAY compute derived structure on the fly, and reasoners MAY derive further content, without either becoming part of the model.

**P2. Parsers decide what gets asserted.** The model takes no position on how source text maps to entities. For example, whether two Argdown statements with the same title are linked by an equivalence relation is decided by the parser, not by the model.

**P3. Permissive core, separate validation.** The model can represent any state that is meaningful but incomplete or flawed. Constraints are checked afterwards by validation (§5). One test decides what the model admits:

> A state is admitted by the model if and only if it is a meaningful state that people actually produce (for example, an argument that has not been reconstructed yet). States that are meaningless (for example, undercutting a statement) are excluded by conformance constraints.

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
| *I* | inferences | logical |
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
- `mainConclusion`: optionally, one statement.

A statement's role within an argument (premise, intermediate conclusion, main conclusion) is not stored. It can be derived from the referenced inferences.

### 4.5 Inferences

An inference *i* ∈ *I* is a directed hyperedge with:

- `premises`: a non-empty, finite set of statements;
- `conclusion`: exactly one statement.

The logical layer is a **directed multi-hypergraph**:

- **Duplicates are allowed.** Distinct inferences MAY have the same premises and conclusion, for example because they carry different properties.
- **Inferences can be shared.** An inference MAY be referenced by any number of arguments.
- **Inferences can stand alone.** An inference MAY be referenced by no argument at all. For example, a single-premise inference {*A*} → *B* can express that *A* entails *B*.

Properties of an inference, such as the inference rule it applies, belong to the inference itself. An argument's reference to an inference carries no properties. If two arguments disagree about such properties, they reference different inferences.

### 4.6 Logical relations

A logical relation *l* ∈ *L* is an **undirected** binary relation between two statements. It has a `type` and two `members`:

| `type` | Intended reading |
|---|---|
| `equivalent` | *A* ↔ *B* |
| `contradictory` | *A* ↔ ¬*B* |
| `contrary` | ¬(*A* ∧ *B*) |

Logical relations are entities (P5). Duplicates are allowed.

Logical relations have no direction. The roles of attacker and attacked belong to the dialectical layer.

The relations above are enough to express other connectives. For example, subcontrariety (*A* ∨ *B*) can be expressed with a statement *A′*, a contradictory relation between *A* and *A′*, and an inference {*A′*} → *B*. Subcontrariety is therefore not a primitive type.

### 4.7 Dialectical relations

A dialectical relation *r* ∈ *R* is a **directed** edge with a `type`, a `source` and a `target`:

| `type` | `source` | `target` |
|---|---|---|
| `support` | argument or statement | argument or statement |
| `attack` | argument or statement | argument or statement |
| `undercut` | argument or statement | argument |

The dialectical layer is a **directed multigraph**: dialectical relations are entities (P5), and duplicates are allowed. This multigraph corresponds to what is drawn as an argument map.

**Dialectical relations are primitives.** They are not derived from the logical layer. Whether a dialectical relation agrees with the logical relations and inferences is a question for reasoning (P1).

**An undercut targets the argument as a whole.** It does not say which of the argument's inferences it challenges. An undercut is meaningful even for an argument that references no inferences at all. Identifying the inference that is challenged is left to reasoners.

### 4.8 Subdebates

A subdebate *g* ∈ *G* has:

- `label`: an optional string;
- `members`: a finite set of nodes (arguments and statements);
- `parents`: a finite set of subdebates, which MAY be empty.

Subdebates MAY overlap, because a node can belong to several of them. They MAY nest, through `parents`, and a subdebate can have several parents. Relations are not members. A subdebate's subgraph is the one induced by its members, and that is derived, not stored.

### 4.9 Properties and tags

Every entity, including the debate, MAY carry arbitrary properties (P6). `tag` is a predefined, multi-valued string property of nodes.

## 5. Validation

Validation is separate from the model (P3) and has two tiers.

**Conformance** (severity: *error*). A model that violates a conformance constraint is not a valid instance of this model at all. Conformance constraints include:

- C1. The sets of §4.1 are pairwise disjoint, and every entity has a unique identifier.
- C2. A statement has a `label`, a `text`, or both.
- C3. Every inference has a non-empty premise set of statements and exactly one conclusion statement.
- C4. Logical relations connect exactly two statements and have one of the types in §4.6.
- C5. Dialectical relations respect the type, source and target table in §4.7. In particular, an undercut targets an argument.
- C6. Subdebate members are nodes, and subdebate parents are subdebates.
- C7. The model holds exactly one debate.
- C8. No relation, logical or dialectical, connects a statement to itself.

**Well-formedness** (severity: *warning*). A model that violates a well-formedness check is valid but incomplete or flawed. The candidate checks below are not final:

- W1. An argument has no `label`.
- W2. The inferences an argument references are disconnected, cyclic, or do not have exactly one final conclusion (a single sink).
- W3. An argument references at least one inference, and its `mainConclusion` is missing or is not the conclusion of any of those inferences.
- W4. The `parents` relation between subdebates contains a cycle.
- W5. An inference's conclusion is also one of its premises.
- W6. A dialectical relation connects an argument to itself.

The specific checks of each tier, and how they are expressed (for example as SHACL shapes with `sh:Violation` and `sh:Warning`), will be fixed in the RDF companion RFC.

## 6. Mapping from Argdown syntax (informative)

This section is not normative (P2). It illustrates how a parser might map Argdown source text to the model.

- **Same title, different texts.** `[A]: text 1` and `[A]: text 2` produce two statements with the label `A`. The parser MAY also add an `equivalent` relation between them.
- **Relation between statements.** `[A] +> [B]` MAY produce both a single-premise inference {*A*} → *B* and a `support` relation from *A* to *B*.
- **Premise-conclusion structure.** An argument's premise-conclusion structure produces one inference per inference step, and the argument references each of them.
- **Sections.** Headings produce subdebates, and nested headings produce `parents` links.
- **Tags and data.** `#tags` become `tag` values, and YAML data blocks become properties.

## 7. Out of scope

- **Presentation:** layout, colours, map-only nodes and other display settings.
- **Provenance:** source positions, and which source text produced which entity.
- **Premise order** within an argument.
- **Reasoning:** closure, consistency checks, deriving dialectical relations, and identifying the inference that an undercut challenges.
- **Dialogue structure:** speakers and locutions.

These may be covered later by separate annotation vocabularies.

## 8. Alternatives considered

**Statements as equivalence classes.** In Argdown today, all occurrences that share a title form one statement, with several texts. This RFC instead makes statements atomic and turns equivalence into an explicit relation (§4.3, §4.6). That keeps identity simple and makes each assumption that two texts say the same thing visible.

**Argument-local inferences.** Inferences could exist only inside an argument. Making them global, shareable entities lets several arguments share an inference step. It also lets inferences carry properties, and gives an inference an identity that can be referenced.

**Directed contrariety.** Argdown's `->` between statements has a direction, but contrariety is logically symmetric. Direction is kept in the dialectical layer only.

**Undercut targeting an inference.** Argdown's implementation allows a relation to target a single inference. This RFC keeps undercut argument-level, so that undercuts can be expressed without any reconstruction, and so that the challenged inference can be left unspecified.

**Dialectical relations derived from, or linked to, logical relations.** Rejected under P1. Matching the two layers is reasoning.

**A strict model without separate validation.** Rejected under P3. Incomplete reconstructions are normal, meaningful states of the data.

**The encoding framework.** RDF with SHACL (using the n-ary relation pattern for inferences and relations) was compared with the alternatives:

- **RDF-star / triple terms:** binary only, so unsuitable for hyperedges.
- **OWL:** open-world reasoning, and no validation severities.
- **Labeled property graphs (GQL, Cypher):** no hyperedges and no formal semantics.
- **JSON Schema:** no severities.
- **TypeDB:** weak interoperability.
- **HIF:** no semantics.

RDF with SHACL fits best: it supports reified hyperedges, validation severities, formal semantics and interoperability. LinkML remains an option as an authoring layer that generates RDF, SHACL, JSON Schema and GraphQL. Both will be evaluated in the companion RFC.

**Aligning with AIF.** The logical layer corresponds closely to AIF:

- statements map to I-nodes;
- inferences map to RA-nodes;
- logical conflict maps to pairs of CA-nodes, because AIF's CA-nodes are directed.

AIF has nothing that corresponds to argument nodes, gists or subdebates. AIF is therefore kept out of the normative specification. A mapping to AIF may be published as a separate, informative document.

## 9. Unresolved questions

1. **Identifier scheme.** How are entity identifiers minted (for example, IRIs that are stable across re-parsing)?
2. **Structured metadata.** How are nested metadata values (for example, from YAML data) represented?
3. **Final validation checks.** What exactly belongs in each validation tier?
4. **Annotation vocabularies.** If there is to be an annotation layer for provenance and premise order, what is its scope?
5. **Authoring approach.** Should the companion specifications be authored with LinkML, or by hand?
6. **GraphQL mapping.** How do the validation tiers map onto GraphQL's closed-world type system (for example, conformance as non-null types and well-formedness as diagnostics)?

## 10. Related work

- Argdown core model: `packages/argdown-core/src/model/model.ts`
- JSON Schema for the Argdown JSON export (unmerged branch `cue-schema`)
- AIF specification: Bex, Reed et al. (2011), <https://arg-tech.org/wp-content/uploads/2011/09/aif-spec.pdf>
- W3C RDF 1.2 Concepts: <https://www.w3.org/TR/rdf12-concepts/>
- W3C SHACL: <https://www.w3.org/TR/shacl/>
