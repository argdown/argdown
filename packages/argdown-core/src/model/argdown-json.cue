// argdown-json.cue
//
// Schema for JSON produced by JSONExportPlugin in @argdown/core.
// This is intentionally close to the TypeScript model interfaces:
//
//   IArgument, IStatement, IEquivalenceClass, IInference, IRelation,
//   IMap, IMapNode, IMapEdge, ISection, and the top-level JSONExportPlugin
//   layout.
//
// It is designed for documentation and validation of Argdown JSON exports.
//
// See also:
//   - model.ts
//   - toJSON.ts
//   - ../plugins/JSONExportPlugin.ts

package argdownjson

// -----------------------------------------------------------------------------
// Core enums (mirroring ArgdownTypes / RelationType / StatementRole / RangeType)
// -----------------------------------------------------------------------------

ArgdownType: "equivalence-class" |
             "statement" |
             "statement-reference" |
             "argument" |
             "relation" |
             "inference" |
             "statement-map-node" |
             "argument-map-node" |
             "group-map-node" |
             "map-edge" |
             "section" |
             "rule-node" |
             "token-node"

RelationType: "attack" |
              "support" |
              "entails" |
              "contrary" |
              "contradictory" |
              "undercut"

StatementRole: "premise" |
               "intermediary-conclusion" |
               "main-conclusion" |
               "argument-description" |
               "top-level-statement" |
               "relation-statement"

RangeType: "bold" |
           "italic" |
           "link" |
           "tag" |
           "statement-mention" |
           "argument-mention" |
           "special-char"

MapNodeType: "statement-map-node" |
             "argument-map-node" |
             "group-map-node"

// -----------------------------------------------------------------------------
// Shared building blocks
// -----------------------------------------------------------------------------

HasTitle: {
  title?: string
}
HasText: {
  text?: string
  // Ranges for formatting, mentions, tags, etc.
  ranges?: [...Range]
}
HasTags: {
  tags?: [...string]
}
HasLocation: {
  startLine?:   int
  endLine?:     int
  startColumn?: int
  endColumn?:   int
  startOffset?: int
  endOffset?:   int
}
HasColor: {
  color?: string
}
HasFontColor: {
  fontColor?: string
}
HasData: {
  // Arbitrary plugin data; kept unconstrained.
  data?: _
}
// A formatted text range (mirrors IRange).
Range: {
  type: RangeType
  start: int
  stop:  int
  title?: string
  url?:   string
  tag?:   string
}

// -----------------------------------------------------------------------------
// Statements, equivalence classes, inferences, relations
// -----------------------------------------------------------------------------

// Base statement occurrence in the document (IStatement / IPCSStatement).
// NOTE: `section` is always a section id string in JSON (never an embedded
// section object). For arguments and equivalence classes, `section` may be
// removed entirely if `json.exportSections` is false.
Statement: HasTitle & HasText & HasTags & HasLocation & HasData & {
  type: "statement"
  role?: StatementRole
  // True if this is a reference (no text; points back to a canonical definition).
  isReference?: bool
  // True if this is a standalone paragraph at top level.
  isTopLevel?: bool
  // Section id (string) as produced by toJSON (section object replaced by its id).
  section?: string | null
}

// Statement used in a pcs (premise–conclusion structure).
PCSStatement: Statement & {
  // Role is restricted inside pcs.
  role: "premise" | "intermediary-conclusion" | "main-conclusion"
  // Title of the argument whose pcs this belongs to.
  argumentTitle?: string
  // Present only on conclusion statements in the pcs (main or intermediary
  // conclusions).
  inference?: Inference
}

// Statement used as an argument description (IArgumentDescription).
ArgumentDescription: Statement & {
  role: "argument-description"
  pcs?: [...PCSStatement]
}

// Inference attached to a conclusion in a pcs (IInference).
// NOTE: In JSON, `section` is a full Section object (not normalized to
// a section id) and is not removed by `json.exportSections`.
Inference: HasTitle & HasData & HasLocation & {
  type: "inference"
  // Inference rules, if any (e.g. "Modus Ponens").
  inferenceRules?: [...string]
  // Argument title whose pcs this inference belongs to.
  argumentTitle?:   string
  // Index of the conclusion in the argument's pcs.
  conclusionIndex?: int
  // Optional embedded section object.
  section?: Section | null
}

// Logical/dialectical relation between Argdown elements, in *JSON form*.
// This corresponds to prepareRelationForJSON in toJSON.ts.
Relation: {
  // ArgdownTypes.RELATION
  type: "relation"
  // Logical or dialectical relation type.
  relationType: RelationType
  // Source and target are serialized by title (or argumentTitle for inferences).
  from?: string
  fromType?: ArgdownType
  to?: string
  toType?: ArgdownType
  // Present if the target is an inference; then `to` is the argumentTitle.
  conclusionIndex?: int
}

// -----------------------------------------------------------------------------
// Argument / equivalence class / sections
// -----------------------------------------------------------------------------

// An argument with pcs and descriptions (IArgument).
// NOTE: `section` is serialized as a section id string if `json.exportSections`
// is true; otherwise it may be omitted entirely. Embedded `relations` can be
// removed via `json.removeEmbeddedRelations`.
Argument: HasTitle & HasTags & HasLocation & HasColor & HasFontColor & HasData & {
  type: "argument"
  // Premise–conclusion structure.
  pcs: [...PCSStatement]
  // All descriptions and references with this argument's title.
  members: [...ArgumentDescription]
  // Relations involving this argument’s main conclusion, unless removed
  // via json.removeEmbeddedRelations.
  relations?: [...Relation]
  // Section id (if sections were exported).
  section?: string | null
}

// An equivalence class of logically equivalent statements (IEquivalenceClass).
// NOTE: `section` is serialized as a section id string if `json.exportSections`
// is true; otherwise it may be omitted entirely. Embedded `relations` can be
// removed via `json.removeEmbeddedRelations`.
EquivalenceClass: HasTitle & HasTags & HasLocation & HasColor & HasFontColor & HasData & {
  type: "equivalence-class"
  members: [...Statement]
  relations?: [...Relation]
  // Usage flags as computed by the model plugin.
  isUsedAsPremise?:                bool
  isUsedAsMainConclusion?:         bool
  isUsedAsIntermediaryConclusion?: bool
  isUsedAsTopLevelStatement?:      bool
  isUsedAsRelationStatement?:      bool
  section?: string | null
}

// Section in the document hierarchy (ISection, in JSON form after prepareSectionForJSON).
Section: HasTitle & HasTags & HasText & HasLocation & HasColor & HasFontColor & HasData & {
  type: "section"
  // Automatically generated id, unique among sections in a document.
  id: string
  // Heading level (1 for H1, 2 for H2, ...).
  level: int
  // Children sections (with parent rewritten to ids).
  children: [...Section]
  // Parent section id, if any.
  parent?: string
  // If true, this section is used as a group node in the map.
  isGroup?:  bool
  isClosed?: bool
}

// -----------------------------------------------------------------------------
// Map nodes and edges
// -----------------------------------------------------------------------------

// Base map node, after prepareMapNodeForJSON / prepareGroupMapNodeForJSON.
// NOTE: label ranges and images are not part of the exported JSON, only
// simple label strings and basic styling information.
MapNode: StatementMapNode | ArgumentMapNode | GroupMapNode
StatementMapNode: HasTitle & HasTags & HasColor & HasFontColor & {
  type: "statement-map-node"
  id: string
  // Labels used in the visualization.
  labelTitle?: string
  labelText?:  string
}
ArgumentMapNode: HasTitle & HasTags & HasColor & HasFontColor & {
  type: "argument-map-node"
  id: string
  labelTitle?: string
  labelText?:  string
}
GroupMapNode: HasTitle & HasColor & HasFontColor & {
  type: "group-map-node"
  id: string
  // Hierarchy of child nodes (group or non-group).
  children?: [...MapNode]
  // Parent group id, if any.
  parent?: string
  level?:    int
  isClosed?: bool
  labelTitle?: string
  labelText?:  string
}

// Map edge, as produced by prepareMapEdgeForJSON.
MapEdge: {
  type: "map-edge"
  id: string
  from: string  // map node id
  to:   string  // map node id
  // Relation type that this edge visualizes.
  relationType: RelationType
  // Optional equivalence class titles, if edge is derived from a relation
  // whose source/target is a statement equivalence class.
  fromEquivalenceClass?: string
  toEquivalenceClass?:   string
  // NOTE: Edge color is not exported to JSON by the current implementation.
}

// The map itself (IMap JSON representation).
Map: {
  nodes: [...MapNode]
  edges: [...MapEdge]
}

// -----------------------------------------------------------------------------
// Tags
// -----------------------------------------------------------------------------

// NOTE: The TypeScript model does not currently define a dedicated TagInfo
// interface and JSONExportPlugin does not normalize tag data. `response.tags`
// is emitted as-is. For portability we therefore keep the shape of `tags`
// unconstrained here.
//
// If a future Argdown version introduces a concrete TagInfo type, this
// section can be tightened accordingly.
TagInfo: _

// -----------------------------------------------------------------------------
// Top-level JSON layout for JSONExportPlugin
// -----------------------------------------------------------------------------

// This is the object that JSONExportPlugin passes into stringifyArgdownData.
// All fields are present or absent according to json.* settings.
//
// - `arguments` and `statements` and `relations` are always required by the
//   plugin before export, but downstream tools might remove some of them.
//   For robustness, `statements`, `relations`, `map`, `sections`, `tags`
//   are modelled as optional here.

ArgdownJSON: {
  // Map from argument title to Argument.
  arguments: [string]: Argument
  // Map from statement title to equivalence class node.
  statements?: [string]: EquivalenceClass
  // Logical/dialectical relations between arguments/statements/inferences.
  relations?: [...Relation]
  // Optional argument map (if json.exportMap is true and map data is present).
  map?: Map
  // Optional list of sections (if json.exportSections is true).
  sections?: [...Section]
  // Optional tag metadata (if json.exportTags is true). Shape is currently
  // implementation-defined and therefore left unconstrained.
	tags?: [string]: TagInfo
}
