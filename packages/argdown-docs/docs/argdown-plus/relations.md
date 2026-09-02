---
title: Argdown+ semantic relations
meta:
  - name: description
    content: Symbols, direction, endpoint types, and meaning of Argdown+ semantic relations.
---

# Semantic relation reference

Read every canonical expression as `subject symbol object`. Inside an indented relation block, the unprefixed symbol starts at the parent. A symbol beginning with `<` reverses that direction: the child becomes the subject and the parent becomes the object.

For example, these two blocks describe the same `Argument → Statement` justification:

```argdown
<A1>
  +> [S1]

[S1]
  <+ <A1>
```

## Relation matrix

`DP` means a Statement, Question, Reference, or Argument. It deliberately excludes Excerpts.

| Relation | Canonical / reverse | Permitted direction | Meaning |
| :--- | :--- | :--- | :--- |
| implies | `=>` / `<=` | Statement → Statement | The subject entails the object |
| justifies | `+>` / `<+` | Argument → Statement | The Argument gives reasons for the Statement |
| is presupposed by | `^>` / `<^` | Statement → DP | The Statement is a necessary presupposition of the object |
| contradicts | `><` | Statement ↔ Statement | The Statements are contradictory |
| specifies | `:>` / `<:` | Statement → Statement or Question → Question | The subject is a more specific version of the object |
| is example for | `%>` / `<%` | Statement → Statement | The subject illustrates the object |
| questions | `?>` / `<?` | Question → DP | The Question raises an issue about the object |
| answers | `!>` / `<!` | Statement → Question | The Statement addresses the Question |
| is cited by | `@>` / `<@` | Reference → DP/Excerpt or Excerpt → DP | The subject supplies provenance for the object |
| is equal | `==` | Same DP type ↔ same DP type | The Discussion Points are semantically identical |
| is potentially equal | `~=` | Same DP type ↔ same DP type | The Discussion Points may be synonymous |

Equality, potential equality, and contradiction are symmetric. Their source spelling does not create a semantic direction.

## Citation patterns

Citation is the only semantic relation that accepts an Excerpt endpoint. These configurations are valid:

- `Reference @> Discussion Point`: a source is cited for a point.
- `Reference @> Excerpt`: a source contains or provides the passage.
- `Excerpt @> Discussion Point`: an exact passage is cited for a point.

Excerpt-to-Excerpt citation is invalid. Equality and potential equality also never apply to Excerpts because their identity comes from exact normalized text.

## Contextual text

Text on a root definition is the entity's context-free label. Text added to the target inside a relation block belongs to that occurrence of the edge:

```argdown
[S-General]: Tree canopy reduces urban heat.

[S-General]
  <: [S-Street]: On this unshaded street, afternoon surface temperatures fall most.
```

Here the longer text is contextual wording for the `S-Street :> S-General` occurrence. It does not replace `S-Street`'s root-level definition.

## Legacy symbols

Classic `+`, `-`, `_`, `->`, and `<-` syntax remains accepted for incremental migration. In strict Argdown+ semantics:

- Statement-to-Statement support becomes `implies`.
- Argument-to-Statement support becomes `justifies`.
- Statement attack becomes symmetric contrariness, which is distinct from contradiction.
- `_` remains an undercut of an inference.

Use the canonical symbols in the matrix when authoring new Argdown+ documents. They communicate intent and allow endpoint types to be checked precisely.

The graph renders potentially equal, example, question, and citation relations with dashed strokes. Other semantic families use distinct colors and arrowheads; the source model remains authoritative when a visual style is customized.
