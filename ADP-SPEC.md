# Argdown+ Technical Specification
**Version:** 1.1.0-draft
**Description:** Argdown+ is a syntactic superset of Argdown designed for comprehensive discourse mapping. It extends standard argument mapping with a strict Discussion Point (DP) ontology, citation artifacts, extended semantic relations, and context-dependent text semantics.

---

## 0. Conformance Mode

Argdown+ is an explicit mode and does not replace default Argdown parsing implicitly.

In Argdown+ mode, semantic interpretation is strict by definition.

If configuration explicitly requests a loose model while selecting Argdown+, the strict invariants still apply and the implementation emits a non-fatal warning. Syntax selection, including selection from frontmatter, must be resolved before lexing and before plugin preparation.

---

## 1. Graph Entities and Identifiers

Argdown+ distinguishes Discussion Points from structural and textual graph entities. Statements, Questions, References, and Arguments are Discussion Points. Excerpts are exact text artifacts: they may be citation endpoints, but they are not themselves claims, questions, sources, or arguments.

| DP Type | Identifier Syntax | Mention Syntax | Description |
| :--- | :--- | :--- | :--- |
| **Statement** | `[ID]` or `[!ID]` | `@[ID]` or `@[!ID]` | A declarative claim. (Default type, `!` prefix is optional). |
| **Question** | `[?ID]` | `@[?ID]` | An interrogative point seeking information. |
| **Reference** | `[@ID]` | `@[@ID]` | A pointer to an external source (e.g., URL or DOI). |
| **Argument** | `<ID>` | `@<ID>` | A self-contained line of reasoning. |

| Text Artifact | Identifier Syntax | Mention Syntax | Description |
| :--- | :--- | :--- | :--- |
| **Excerpt** | `[>ID]` | `@[>ID]` | An exact piece of text quoted from or associated with an external source. |

The public model must therefore distinguish at least these unions:

- `DiscussionPoint = Statement | Question | Reference | Argument`;
- `TextArtifact = Excerpt`;
- `RelationEndpoint = DiscussionPoint | TextArtifact | Inference`.

Inference remains a structural endpoint used by PCS and undercut handling; it is neither a Discussion Point nor a text artifact.

### 1.1. Identifier Namespace and Type Consistency

- Explicit entity identifiers use one global namespace.
- The marker encodes entity type, but an ID may not be reused across different types.
- If the same ID appears with different markers (for example `[S1]` and `[?S1]`), this is a validation error.
- Multiple root-level definitions of the same DP ID are allowed. All definition occurrences are preserved; the first non-empty text is the canonical context-free text. A later different non-empty text is retained as an alternate occurrence and produces a warning. Excerpts instead follow the exact-content rules in Section 1.2.

### 1.2. Excerpt Identity

An Excerpt is identified by its exact normalized text, not by a semantic equality judgment. Normalization removes structural block indentation, normalizes line endings to `\n`, and omits the final structural newline; it otherwise preserves the text.

- identical anonymous Excerpt text denotes the same text artifact;
- any character difference after normalization denotes a different Excerpt;
- multiple References may cite the same Excerpt, which is useful for representing quotation, textual reuse, or possible plagiarism;
- explicit IDs name Excerpts, but two IDs with identical normalized text are aliases for the same artifact and should produce a duplicate-alias diagnostic;
- one explicit Excerpt ID may not be defined with different normalized text.

Because Excerpt identity is intrinsic to exact text, `==` and `~=` never apply to Excerpts.

---

## 2. Extended Semantic Relations

Argdown+ introduces specific directional symbols to explicitly map the semantics of discourse. `DP` below means Statement, Question, Reference, or Argument and deliberately excludes Excerpt.

| Relation Name | Symbol | Subject | Object | Semantic Meaning |
| :--- | :--- | :--- | :--- | :--- |
| **Implies** | `=>` | Statement | Statement | DP1 logically entails DP2. |
| **Justifies** | `+>` | Argument | Statement | DP1 justifies DP2. |
| **isPresupposedBy** | `^>` | Statement | DP | DP1 is a necessary foundational premise for DP2. |
| **Contradicts** | `><` | Statement | Statement | DP1 and DP2 are logically/factually incompatible. |
| **Specifies** | `:>` | Question/Statement | Question/Statement | DP1 is a more detailed version of DP2. *(Types must match)* |
| **isExampleFor** | `%>` | Statement | Statement | DP1 illustrates DP2. |
| **Questions** | `?>` | Question | DP | DP1 raises a question regarding DP2. |
| **Answers** | `!>` | Statement | Question | DP1 resolves or addresses DP2. |
| **isCitedBy** | `@>` | Reference or Excerpt | DP, or Excerpt when the subject is a Reference | DP1 is the provenance/citation for DP2. |
| **isEqual** | `==` | DP | DP | DP1 and DP2 are semantically identical. *(Types must match.)* |
| **isPotentiallyEqual**| `~=` | DP | DP | DP1 and DP2 are nearly synonymous. *(Types must match.)* |

The citation constraint expands to three intended configurations:

1. `Reference @> DiscussionPoint`: a source is cited for a Discussion Point;
2. `Reference @> Excerpt`: a source contains or is the provenance of an Excerpt;
3. `Excerpt @> DiscussionPoint`: an exact passage is cited for a Discussion Point.

Excerpt-to-Excerpt citation is invalid. No non-citation relation may use an Excerpt endpoint.

### 2.1. Directional Shorthand in Relation Blocks

Within an indented relation block under a parent entity:

- `SYM [Child]` means `Parent SYM Child`.
- `<SYM [Child]` means `Child SYM Parent`.
- For implication, the inverse shorthand is `<=` (not `<=>`).
- `==`, `~=`, and `><` are symmetric.

Additional reverse-direction shorthand aliases are supported:

| Canonical Reverse Symbol | Shorthand |
| :--- | :--- |
| `<+` | `+` |
| `<^` | `^` |
| `<%` | `%` |
| `<-` | `-` |
| `<?` | `?` |
| `<!` | `!` |
| `<@` | `@` |

All other Argdown+ relations must be written with explicit directional symbols as defined in Section 2.

### 2.2. Symmetry and Identity

- `==` and `~=` are symmetric relations.
- `><` is symmetric.
- Repeated symmetric definitions in opposite directions are semantically deduplicated.
- Equality and potential equality apply only to Discussion Points; Excerpts use exact text identity as defined in Section 1.2.

### 2.3. Object-Level Scope

Argdown+ records the discourse map asserted by a document. It does not generally reify relations so that their authenticity, correctness, or validity can themselves become relation targets. For example, questioning whether an Excerpt is authentic concerns its provenance relation, not the Excerpt as a Question target.

Undercut is a specific structural relation to an inference and does not establish general edge reification. Likewise, a `justifies` edge records that an Argument is presented as justifying a conclusion; it does not certify that the justification succeeds.

### 2.4. Legacy Argdown Relations in Argdown+ Mode

Argdown+ fully parses standard Argdown symbols (`+`, `-`, `_`, `->`, `<-`) to preserve legacy compatibility.

In Argdown+ strict semantics:

- Statement-to-Statement support written with `+`, `+>`, or `<+` is interpreted as implication, with direction determined by the spelling.
- Argument-to-Statement support written with `+`, `+>`, or `<+` is interpreted as justification.
- Statement-source `-` (and directional `->`, `<-`) is interpreted as contrariness.
- `_` is interpreted as undercut.

Canonical Argdown+ output uses `=>` or `<=` for Statement implication and reserves `+>` or `<+` for Argument-to-Statement justification. Legacy Statement support syntax remains valid input but normalizes to the same `implies` relation.

Contrariness and contradiction are distinct:

- Contrariness: both statements cannot be true at the same time.
- Contradiction (`><`): stronger incompatibility (if one is false, the other is true).

Because contrariness is symmetric, the direction of `->` or `<-` is discarded when both endpoints resolve to Statements. Parsers should emit a non-fatal migration warning in this case. Plain `-` is the canonical contrariness symbol and `><` is used exclusively for contradiction.

A legacy attack involving an Argument remains a directional, generic dialectical attack rather than contrariness. Such attacks are accepted for migration but are non-canonical in Argdown+: a precise reconstruction should target a premise or conclusion with contrariness/contradiction, or represent an undercut of the inference. Parsers should warn rather than silently guess the intended target.

---

## 3. Semantic Context: Root-Level vs. Relation-Level Definitions

Argdown+ utilizes standard Argdown syntax for defining elements (`[ID]: Text`). However, the **semantic target** of the text changes based on where the definition occurs in the document tree.

### 3.1. Root-Level Definitions (Context-Free Text)
If a DP is defined at the root level (no indentation), the text is assigned as the **neutral, context-free label** of the Discussion Point itself. A root-level Excerpt definition instead establishes the complete exact text artifact.

```argdown
[S1]: Universal Basic Income (UBI) reduces overall poverty rates.

[S2]: Funding a UBI program requires significant increases in income tax.

[S3]: UBI programs reduce child poverty by providing a safety net for families.
```

### 3.2. Relation-Level Definitions (Contextualized Text)
If a DP is defined within a relation block (indented), the text is assigned to the **Edge** (the connection between the nodes) as Contextualized Text.

Contextualized text should not be a meta-statement about the relationship (e.g., "S3 specifies S1"). It should be the DP's statement itself, reduced or shortened to omit information that a reader can easily infer from the surrounding context. This is a normative writing guideline.

Contextualized text is directional and occurrence-scoped. If both directions of a semantic relation are defined explicitly, each direction may carry its own contextualized text.

```argdown
[S1]
    // The text here belongs to the EDGE (S3 :> S1), not to the DP S3.
    // S3 is structurally linked, and we provide a shortened text
    // that makes sense specifically in the context of S1.
    <: [S3]: Specifically reduces child poverty.

    // DP S2 might not have a root-level definition yet.
    // If so, it lacks a context-free text entirely, but this edge
    // still successfully captures the contextualized contradiction.
    >< [S2]: Requires significant tax increases.
```

### 3.3. Contextual Excerpt Selections

Contextual text on an explicitly identified Excerpt has a narrower meaning: it selects the exact passage quoted by that citation occurrence from the complete root-level Excerpt.

```argdown
[>E1] >>
    The complete paragraph from the source. It may contain several claims and
    provides the surrounding context needed to interpret the quoted passage.

[S1]
    <@ [>E1]: The complete paragraph from the source.
```

The following invariants apply:

- contextual Excerpt text is permitted only on an `isCitedBy` occurrence;
- the explicitly identified Excerpt must have a root-level definition somewhere in the document;
- the Excerpt must be the explicitly wrapped relation child carrying the contextual text; when an Excerpt cites a DP, write the inverse `<@ [>E]` form beneath that DP;
- the contextual selection does not replace the complete Excerpt or create a competing definition;
- parsers should warn when the selection cannot be found in the complete Excerpt after structural whitespace normalization; quotation ellipses and editorial brackets prevent this check from being a hard error;
- an anonymous relation-level Excerpt block defines the complete anonymous Excerpt; it is not a selection from an absent root definition.

---

## 4. The Block Operator (`>>`)

The `>>` operator explicitly defines a multi-line text block and is mandatory for Excerpt definitions in full Argdown+.

*   **Syntax:** An optional typed entity identifier followed by `>>` and an indented text block.
*   **Boundary:** A `>>` block continues until dedent to the parent indentation level.
*   **Requirement:** Mandatory for Excerpt definitions and optional for every Discussion Point type, including Arguments.
*   **Usage:** Can be used at the root level for definitions, or at the relation level for multi-line contextualized text.
*   **Anonymous typing:** `>>` without an identifier creates an anonymous Excerpt.
*   **Block contents:** Relation symbols and comment markers inside block content are literal text.

```argdown
// Root-level Excerpt Definition
[>E1] >>
    "This is a verbatim quote from a source.
    It can span multiple lines without escaping characters."
```

---

## 5. Anonymous Nodes & Type Inference

Argdown+ supports rapid drafting by omitting identifiers. When an anonymous entity is created on a relation line, the parser infers its Discussion Point or Excerpt type from syntax and relation context.

**Inference Rules (in order of precedence):**
1.  **Block Operator Match:**
    *   Uses `>>` with no preceding identifier -> **Excerpt**. Its contents are opaque exact text, so a leading `? ` or `@ ` inside the block is literal content.
2.  **Inline Prefix Matches:**
    *   Starts with `? ` -> **Question**
    *   Starts with `@ ` -> **Reference**
3.  **Relation Context Match:**
    *   Reverse `<+` (Justifies), where the anonymous node is the source -> **Argument**
    *   Forward `=>` (Implies), where the anonymous node is the target -> **Statement**
    *   Forward `!>` (Answers), where the anonymous node is the target -> **Question**
4.  **Fallback:**
    *   If no other rules match -> **Statement**

Anonymous entities receive deterministic generated document-local IDs.

**Drafting Example:**
```argdown
[S1]: Electric vehicles (EVs) significantly improve urban air quality.

    // Infers Question (due to outgoing '!>' resolving a target)
    !> Does EV adoption affect local pollution?

    // Infers Argument (due to incoming '<+' Justifies relation)
    <+ The Tailpipe Emission Elimination Argument

    // Infers Statement (due to outgoing '=>' Implies relation)
    => Respiratory illness rates decline.

    // Infers Reference (due to explicit '@' prefix)
    <@ @ https://doi.org/10.1038/s41562
```

---

## 6. Argument PCS (Premise-Conclusion Structure) Mapping

Argdown+ supports the standard Argdown PCS syntax for arguments `(1) ... ---- (2)`. However, it maps these structural elements directly into Extended Semantic Relations to maintain a unified graph ontology.

**Argdown+ Input:**
```argdown
<A1>: The Spectrometer Argument
    (1) [S1]: The reading is 475nm.
    (2) [S2]: Spectrometers are reliable.
    ----
    (3) [S3]: The sky is blue.
```

**Parser Interpretation (Underlying Graph):**
1. Creates `[S1] ^> <A1>`  *(Premise 1 isPresupposedBy Argument 1)*
2. Creates `[S2] ^> <A1>`  *(Premise 2 isPresupposedBy Argument 1)*
3. Creates `<A1> +> [S3]`  *(Argument 1 Justifies Conclusion)*

Inference objects created by PCS reconstruction are structural graph objects, not Discussion Points and not members of the global entity identifier namespace. They may remain explicit relation endpoints for undercuts. APIs must distinguish `DiscussionPoint`, `TextArtifact`, and the broader `RelationEndpoint` union.

---

## 7. Metadata and YAML Frontmatter
Argdown+ remains fully compliant with standard Argdown YAML configurations.
*   **Frontmatter:** Bounded by `===` at the start of the document.
*   **Inline Data:** Bounded by `{}` at the end of a definition or relation line. Metadata attached to a relation-level definition belongs to the Edge.

---

## 8. Comments

Argdown+ uses the same comment syntax as classic Argdown:

- `//` for line and inline comments;
- `/* ... */` for C-style block comments;
- `<!-- ... -->` for HTML/Markdown block comments.

`//` starts a comment only at the beginning of input or after whitespace, preserving URLs such as `https://example.com`. The `#` character is not a comment marker because it is used by Argdown headings and tags.

---

## 9. Micro-Argdown+ Profile

[Micro-Argdown+](micro-argdown-plus.md) is a compact drafting dialect that shares this graph ontology but uses a smaller surface grammar, wrapped references, and identifier-free prose. It deliberately has no bare-identifier mentions. Micro permits multiline content only for Excerpts; full-to-Micro conversion therefore diagnoses multiline non-Excerpt text. It is not a literal source subset. Conversion is defined over the normalized graph, with lossless Micro-to-full conversion and diagnostic full-to-Micro conversion for unsupported constructs.

The shared normalization, migration warnings, and implementation plan are specified in [ADP-MICRO-ALIGNMENT.md](ADP-MICRO-ALIGNMENT.md).
