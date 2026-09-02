---
title: Argdown+
meta:
  - name: description
    content: Get started with typed discussion points, semantic relations, excerpts, and Micro-Argdown+.
---

# Argdown+

Argdown+ extends classic Argdown for discourse maps in which the kind of a point and the meaning of a relation need to be explicit. It adds typed Questions and References, exact Excerpt artifacts, semantic relations, contextual edge text, and a condensed Micro drafting syntax.

Argdown+ is opt-in. Existing Argdown documents continue to use the classic parser unless they select another mode.

## Quickstart

This small map asks a question, answers it with a Statement, justifies that answer with an Argument, and attaches an exact cited Excerpt:

```argdown
===
parser:
  syntax: argdown+
===

[?Q-Heat]: Should the city expand its tree canopy?

[S-Cooling]: The city should expand its tree canopy.
  !> [?Q-Heat]
  <+ <A-Shade>
  <@ [>E-Review]

<A-Shade>: Trees reduce dangerous street-level heat through shade and evapotranspiration.

[@R-Review]: https://doi.org/10.1016/j.buildenv.2021.107777

[>E-Review] >>
    Urban trees can produce measurable local cooling.
  <@ [@R-Review]
```

Open **Argdown+ Quickstart** from the Examples menu in the [Sandbox](/sandbox/map/viz-js) to edit it and inspect its map. The Sandbox shows the active syntax mode and reports lexer, parser, and semantic diagnostics together.

In either map renderer, open **Legend** to see the entity and relation semantics present in the current graph. Select a node or edge to inspect its canonical text, endpoints, tags, aliases, and source occurrences. **Show in source** moves the editor to its definition; moving the editor cursor over a mapped definition or relation highlights that graph element in return. Graph targets support keyboard focus and selection with <kbd>Enter</kbd> or <kbd>Space</kbd>.

## Typed entities

| Entity | Definition | Mention | Role |
| :--- | :--- | :--- | :--- |
| Statement | `[S1]` or `[!S1]` | `@[S1]` | A declarative Discussion Point |
| Question | `[?Q1]` | `@[?Q1]` | An interrogative Discussion Point |
| Reference | `[@R1]` | `@[@R1]` | A source Discussion Point |
| Argument | `<A1>` | `@<A1>` | A reason-giving Discussion Point |
| Excerpt | `[>E1]` | `@[>E1]` | An exact text artifact, not a Discussion Point |

An identifier has one type throughout a document. Excerpts are identified by their normalized exact text and may participate only in citation relations.

## Choose a syntax mode

| Mode | Use it for |
| :--- | :--- |
| `argdown` | Existing documents and classic argument maps |
| `argdown+` | Full typed syntax, document structure, metadata, and premise-conclusion structures |
| `micro-argdown+` | Fast, indentation-based drafting that normalizes to the same semantic graph |

Select a mode in frontmatter as shown above, in external parser configuration, or with the Sandbox mode selector. Frontmatter has priority by default. The Sandbox disables its selector and displays a **document** badge when the source declares the mode itself.

## Where to go next

- Use the [semantic relation reference](./relations) to choose a relation and check its permitted endpoints.
- Open **Micro-Argdown+ Primer** in the Sandbox to compare the condensed surface syntax.
- Read [configuration](/guide/configuration) for API and frontmatter precedence.
- Consult the [complete syntax reference](/syntax/#argdown-and-argdown-modes) for contextual text, Excerpt blocks, and migration syntax.
- See the [formal specification](https://github.com/argdown/argdown/blob/main/ADP-SPEC.md) for normative details.

## Migration in brief

Classic relation symbols remain accepted in Argdown+, so migration can happen one document at a time. Prefer canonical semantic symbols in new material. In particular, Statement support normalizes to implication, while Argument-to-Statement support normalizes to justification. The parser reports migration information and warnings where a classic symbol loses semantic precision.
