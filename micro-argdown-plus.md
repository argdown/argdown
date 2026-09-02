# Micro-Argdown+ Syntax

Micro-Argdown+ is a compact drafting dialect of Argdown+. It shares the Argdown+ Discussion Point, Excerpt, and normalized relation ontology, but uses a smaller, indentation-based surface grammar. It is not intended to be parsed directly as full Argdown+ source. Conversion operates through the shared normalized graph described in [ADP-MICRO-ALIGNMENT.md](ADP-MICRO-ALIGNMENT.md).

## Document Structure

Micro-Argdown+ conventionally separates context-free node definitions from one or more discourse trees:

```text
CONTEXT-FREE DEFINITIONS:
[S1]: A claim.
<A1>: A supporting argument.

DISCOURSE TREE:
[S1]
    <+ <A1>
```

The `CONTEXT-FREE DEFINITIONS:` and `DISCOURSE TREE:` headers are optional and case-insensitive. Blank lines, Markdown code-fence lines, and comments are ignored. A document may contain multiple top-level discourse-tree roots.

## Nodes

### Explicit Nodes

Definitions are written at the document's root indentation level:

| Entity type | Inline definition | Mention |
| --- | --- | --- |
| Statement | `[S1]: Text` | `[S1]` |
| Question | `[?Q1]: Text` | `[?Q1]` |
| Argument | `<A1>: Text` | `<A1>` |
| Reference | `[@R1]: Text` | `[@R1]` |
| Excerpt | `[>E1]: Text` | `[>E1]` |

Statements, Questions, Arguments, and References are Discussion Points. Excerpts are exact text artifacts rather than Discussion Points. One-line Excerpts may use the inline form above; multiline Excerpts use `>>` as specified below.

Discussion Point definition text may be empty. A node may be mentioned repeatedly without creating duplicate nodes. Multiple root definitions preserve all definition occurrences; the first non-empty text is canonical. A later different non-empty text is retained and produces a warning.

Node identifiers share one global namespace. Reusing an identifier with a different explicit type is an error. Resolution considers explicit definitions throughout the complete document, including definitions that occur after an earlier mention.

### Identifier-Free Drafting

Nodes may be introduced by writing their actual text without an identifier or wrapper:

```text
Renewable energy reduces long-term costs.
    <? Can it reliably cover peak demand?
    <+ Storage and grid balancing address intermittency.
```

The complete trimmed text is initially used as both context-free text and an implicit document-local identity key. This applies equally to one-word and multiword text: an unwrapped `A1` is prose, never a reference to `<A1>` or `[A1]`. Repeating exactly the same text refers to the same node. Identity is case- and punctuation-sensitive. Authors who need distinct Discussion Points with identical wording, or stable identity while wording changes, must introduce explicit identifiers.

Relation targets are resolved with the following precedence after comments have been removed:

1. A wrapped node such as `[S1]`, `[?Q1]`, or `<A1>` is an explicit mention.
2. An anonymous `>>` block is an Excerpt.
3. Otherwise, the complete remaining text is an identifier-free Discussion Point.
4. A Discussion Point's type is resolved from an explicit wrapper, the relation constraints, a relation-specific drafting default, and finally the Statement fallback, in that order.

This deliberately favors prose when drafting. No unwrapped text is silently reinterpreted as a known identifier, even when it consists of a single token or matches a definition elsewhere in the document.

```text
[S1]
    <+ A1
    <+ Storage balances renewable generation.
    <+ <A1>: A shorter formulation in this context.
```

The first child is an identifier-free Argument whose complete text is `A1`; the second is another identifier-free Argument; the third explicitly refers to the Argument identified by `A1` and supplies contextual text.

Explicit identifiers and text-derived identities occupy distinct identity spaces. A later explicit definition never captures an earlier unwrapped prose node merely because its ID matches that prose.

In particular, an untyped source introduced by `<+` or its `+` shorthand defaults to an Argument, because Statement implication can be expressed unambiguously with `<=`. If a relation permits several Discussion Point types and no drafting default resolves the ambiguity, the type must be explicit.

### Excerpts and Multiline Text

Micro keeps all non-Excerpt content on one physical line. Editors may soft-wrap long lines, but a source newline ends that content. Multiline non-Excerpt definitions and contextual text are invalid.

Only Excerpts use the block operator:

```text
[>E1] >>
    A complete paragraph quoted from a source.
    Its line structure is retained.
```

An anonymous `>>` block creates an anonymous Excerpt locally and deterministically:

```text
[S1]
    <@ >>
        A complete anonymous excerpt cited for S1.
```

`>>` is therefore an Excerpt type marker in Micro, not a general multiline container. It is invalid after an explicitly typed non-Excerpt node. No colon is used with `>>`.

Block content begins on the following line, is indented one unit beyond the block header, and continues until dedent. Structural indentation and the final structural newline are removed; line endings are normalized to `\n`, while all other content is preserved. Relation symbols and comment markers inside a block are literal text. A block-bearing occurrence is a leaf in its Micro discourse tree; additional relations involving the same explicit Excerpt start from another root/reference occurrence. This avoids an ambiguous boundary between block content and nested relations.

Anonymous Excerpts use their normalized exact text as identity. Identical anonymous blocks merge; any character difference after normalization creates a different Excerpt. Explicit Excerpt IDs name the same value-like artifacts. Two explicit IDs with identical normalized text are aliases and should produce a duplicate-alias diagnostic; defining one Excerpt ID with different normalized text is an error.

## Discourse Trees

An unindented wrapped mention, identifier-free Discussion Point, or anonymous Excerpt block starts a tree root. An indented relation line has one of these shapes:

```text
<indent><relation-symbol> <child-node-or-text> [ // comment]
<indent><relation-symbol> >>
<block-content-indent><anonymous-excerpt-text>
```

Nesting attaches each child to the node at the preceding indentation level:

```text
[S1]
    <? [?Q1]: A contextual version of the question
    <+ <A1>: A contextual version of the argument
        <^ [S2]
```

The canonical indentation unit is four spaces. For compatibility, the parser also accepts a consistent two-space unit. The first relation determines the unit for the document. Shared outer indentation around the complete input is removed before parsing.

## Relations

In the following table, `P` is the parent occurrence and `C` is its indented child.

| Symbol | Normalized relation |
| --- | --- |
| `=>` | P `implies` C |
| `<=` | C `implies` P |
| `+>` | P `justifies` C, or P `implies` C when both are Statements |
| `<+` | C `justifies` P, or C `implies` P when both are Statements |
| `^>` | P `isPresupposedBy` C |
| `<^` | C `isPresupposedBy` P |
| `><` | P `contradicts` C |
| `:>` | P `specifies` C |
| `<:` | C `specifies` P |
| `%>` | P `isExampleFor` C |
| `<%` | C `isExampleFor` P |
| `!>` | P `answers` C |
| `<!` | C `answers` P |
| `?>` | P `questions` C |
| `<?` | C `questions` P |
| `@>` | P `isCitedBy` C |
| `<@` | C `isCitedBy` P |
| `==` | P `isEqual` C |
| `~=` | P `isPotentiallyEqual` C |
| `+` | Same as `<+` |
| `-` | P is `contrary` to C |

`><`, `-`, `==`, and `~=` are symmetric. Contrariness means that two Statements cannot both be true but may both be false. Contradiction is stronger: contradictory Statements can neither both be true nor both be false. Consequently, `><` is used exclusively for contradiction and `-` exclusively for contrariness.

Support symbols are resolved after node types are known. An Argument-to-Statement relation normalizes to `justifies`. A Statement-to-Statement relation normalizes to `implies`; its canonical spelling is `=>` or `<=`, not a support symbol. The one-character `+` form is input shorthand for `<+`.

### Relation Type Constraints

`DP` below includes Statements, Questions, Arguments, and References. It deliberately excludes Excerpts.

| Normalized relation | Subject | Object |
| --- | --- | --- |
| `implies` | Statement | Statement |
| `justifies` | Argument | Statement |
| `isPresupposedBy` | Statement | DP |
| `contradicts` | Statement | Statement |
| `contrary` | Statement | Statement |
| `specifies` | Statement or Question | Same type as subject |
| `isExampleFor` | Statement | Statement |
| `answers` | Statement | Question |
| `questions` | Question | DP |
| `isCitedBy` | Reference | DP or Excerpt |
| `isCitedBy` | Excerpt | DP |
| `isEqual` | DP | Same type as subject |
| `isPotentiallyEqual` | DP | Same type as subject |

After explicit types and drafting inferences have been resolved, a relation that violates these constraints is an error. Excerpts may occur only in `isCitedBy`; Excerpt-to-Excerpt citation is invalid, and equality relations deliberately exclude Excerpts.

### Legacy Attacks

Micro-Argdown+ does not use the directed legacy attack symbols `->` and `<-`. When importing full Argdown+:

- a directed attack between two Statements normalizes to symmetric `contrary`; the discarded direction should produce a warning;
- an attack involving an Argument remains a generic dialectical attack and cannot be refined automatically;
- generic Argument attacks are non-canonical because a strict reconstruction should target a premise or conclusion with contrariness/contradiction, or represent an undercut of the inference;
- a full Argdown+ document containing a generic attack or undercut lies outside the lossless Micro profile unless an extension represents it.

## Contextual Text

Contextual text belongs only to a child occurrence and is introduced by `:` after an explicitly wrapped target:

```text
[S1]
    <+ <A1>: A shorter formulation in this context.
```

The wrapper and colon are mandatory when inline contextual text is present. A wrapped node without a colon is only a reference; a colon elsewhere in unwrapped prose is ordinary text:

```text
[S1]
    <+ Storage balances renewable generation.
```

Here the complete child line is a new identifier-free Argument.

Depending on relation direction, contextual text is stored as the logical subject's or object's occurrence text. It never replaces the node's context-free definition.

Contextual text for an explicitly identified Excerpt is a special case: it selects the exact passage used by that citation occurrence from the complete root-level Excerpt.

```text
[>E1] >>
    The complete paragraph from the source. It contains the exact sentence
    directly quoted in support of the claim as well as surrounding context.

[S1]
    <@ [>E1]: It contains the exact sentence directly quoted in support of the claim.
```

Such a selection is valid only on a citation relation and only if the complete Excerpt has a root-level definition somewhere in the document. The Excerpt must be the explicitly wrapped child carrying the contextual text; when an Excerpt cites a DP, use the inverse `<@ [>E1]` form beneath that DP. A multiline selection may use `[>E1] >>` on the citation occurrence. It remains occurrence text and does not redefine the Excerpt. Implementations should warn, rather than fail, when a selection is not found after structural whitespace normalization because quotation ellipses and editorial brackets may prevent an exact substring match.

## Comments

Micro-Argdown+ uses the same comments as Argdown and Argdown+:

```text
// A line comment

[S1]: Main claim. // An inline comment

/*
A multiline C-style comment.
*/

<!-- A Markdown-compatible comment. -->
```

`//` begins a comment only at the start of input or when preceded by whitespace, so URLs such as `https://example.com` remain intact. The `#` character does not introduce a comment; it remains available for compatibility with Argdown headings and tags.

Comments are not part of the normalized graph. Source-aware tools may preserve them, but graph conversion and canonical serialization are not required to do so. Inside `>>` content, comment markers are literal Excerpt text rather than comments.

## Complete Example

```text
CONTEXT-FREE DEFINITIONS:
[S1]: Renewable energy can reduce long-term costs.
[?Q1]: Can it reliably cover peak demand?
<A1>: Storage and grid balancing address intermittency.
[S2]: Battery costs have declined.
[@R1]: https://example.com/report
[>E1] >>
    Storage deployment increased substantially over the reporting period,
    especially where grid interconnections were expanded.

DISCOURSE TREE:
[S1]
    <? [?Q1]: Can renewable energy cover demand at all times?
    <+ <A1>: Storage can balance variable generation.
        <^ [S2]
        <@ [>E1]: Storage deployment increased substantially.

[@R1]
    @> [>E1]
```

## Canonical Output

The serializer emits both section headers, one canonical definition for every entity, additional identical definitions for explicit Excerpt aliases, wrapped identifiers, four-space indentation, `:` before inline contextual text, `>>` for multiline Excerpts, and explicit directional relation symbols.

It emits `=>` or `<=` for implication and `+>` or `<+` for justification, never the `+` shorthand. Because contrariness and contradiction are distinct symmetric relations, canonical output preserves `-` for contrariness and uses `><` exclusively for contradiction.

Identifier-free Discussion Points and anonymous Excerpts receive deterministic, type-appropriate generated identifiers in canonical output, skipping identifiers already used explicitly. Their original prose or exact Excerpt content is emitted as the root-level definition. Other drafting and compatibility forms are accepted as input but are not canonical output.

Micro-to-full conversion is total and lossless for every valid Micro document. Full-to-Micro conversion is lossless only when non-Excerpt text is single-line and the other declared Micro profile restrictions are satisfied. Multiline non-Excerpt content must produce a conversion diagnostic rather than being silently folded.
