# Argdown RFCs

This folder holds Requests for Comments (RFCs): design documents for substantial changes to Argdown, such as specifications, data models or new language features.

## Process

1. Create a branch `rfc/NNNN-short-title` and add `rfcs/NNNN-short-title.md`. `NNNN` is the next free four-digit number.
2. Open a pull request. Discussion happens on the PR.
3. The status in the RFC header moves through `Draft` → `Under review` → `Accepted` | `Rejected` | `Withdrawn`. An accepted RFC can later become `Superseded` by another RFC.

## Template

Each RFC starts with a header table (number, title, status, authors, created, related RFCs) and usually has these sections:

- **Summary**: one paragraph.
- **Motivation**: why the change is needed.
- **Design**: the proposal itself. Normative parts use the key words MUST, MUST NOT, SHOULD and MAY as defined in [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119).
- **Alternatives considered**: the options that were rejected, and why.
- **Unresolved questions**: what still has to be decided.

## Index

| RFC | Title | Status |
|---|---|---|
| [0001](0001-argdown-data-model.md) | Abstract Argdown Data Model | Draft |
| [0002](0002-argdown-model-validation.md) | Validation of the Argdown Data Model | Draft |
| [0003](0003-argdown-dialectical-grounding.md) | Dialectical Grounding | Draft |
| [0004](0004-argdown-classical-semantics.md) | Classical Semantics for the Argdown Data Model | Draft |
| 0005 | RDF/SHACL encoding of the data model | Planned |
| [0006](0006-argdown-syntax.md) | Argdown Syntax | Draft |
| [0007](0007-argdown-parser-architecture.md) | Argdown Parser Architecture | Draft |

## Argdown 3.0 roadmap

Argdown 3.0 is a rewrite of the Argdown toolchain. Its central idea is **specification before implementation**. Argdown 2.x is defined by its TypeScript code. Argdown 3.0 is defined by the RFCs in this folder, and the code implements them.

### Goals

1. **Explicit specifications.** The syntax, the data model, validation and reasoning each get their own RFC. Tools in other languages, datasets and LLM pipelines can then implement against the RFCs instead of against `@argdown/core`.
2. **Separation of concerns.** Argdown 2.x mixes parsing, model building, reasoning and presentation. In 3.0, each layer has one job and a defined interface to the next.
3. **Backwards compatibility.** Every document that Argdown 2.x accepts MUST be accepted by Argdown 3.0 (RFC 0006 S1), and SHOULD produce the same argument map. Where 3.0 has to deviate, the deviation is documented, and it is reported to the user as a diagnostic rather than as a hard error (RFC 0006 §9, RFC 0007 §7).
4. **Better tooling.** Incremental, error-tolerant parsing for editors and the language server, and highlighting in common editors.

### Layers

```
 Argdown source text
        │
        ▼
 ┌──────────────┐   RFC 0006: Syntax
 │ Lexer/Parser │   (what a valid document looks like)
 └──────┬───────┘
        ▼  concrete syntax tree (CST)
 ┌──────────────┐   RFC 0007: Parser architecture
 │ Model builder│   (how the CST is mapped to the model)
 └──────┬───────┘
        ▼  data model
 ┌──────────────┐   RFC 0001: Data model
 │    Model     │   RFC 0005: RDF/SHACL encoding (planned)
 └──────┬───────┘
        ▼
 ┌──────────────┐   RFC 0002: Validation
 │  Validation  │   (well-formedness and diagnostics)
 └──────┬───────┘
        ▼
 ┌──────────────┐   RFC 0003: Dialectical grounding
 │  Reasoning   │   RFC 0004: Classical semantics
 └──────┬───────┘
        ▼
  Argument maps, exports, editor features (plugins)
```

The model in the middle does not depend on the syntax. Another syntax, such as a JSON or RDF document, an LLM output format or a graphical editor, can produce the same model. The layers above the model are then reused unchanged.

### Order of work

1. **Specify** (now). Finish RFCs 0001–0004 (Gregor Betz) and RFCs 0006–0007 (Lucas Wiese) to `Under review`.
2. **Conformance corpus.** Extract test cases from the 2.x test suite and documentation into the corpus format of RFC 0006 §10.
3. **Reference parser.** Write a tree-sitter grammar that passes the corpus (RFC 0007).
4. **Model builder and plugins.** Map the CST to the model, then implement validation and reasoning as plugins.
5. **Migrate.** Port the existing exports, map views, the language server and the editor integrations.

No implementation work starts before the RFCs for its layer have reached `Under review`.

## Background: lexing and parsing

This section is an informal introduction for readers who have not worked with grammars before. It explains the terms used in RFC 0006 and RFC 0007.

### From text to tree

A program that reads Argdown has to turn a flat string of characters into structure: which part is a statement, which part is an argument, and which statement supports which. This is traditionally done in two steps.

**Lexing** (or tokenizing) cuts the text into **tokens**, the smallest meaningful units, such as words in a sentence. For the Argdown line

```argdown
[Life]: Life moves fast. #movies
```

a lexer produces something like

```
STATEMENT_DEFINITION "[Life]:"   TEXT "Life moves fast"   TEXT "."   TAG "#movies"
```

The lexer only recognizes the pieces. It does not know how they fit together.

**Parsing** checks that the tokens are arranged according to the rules of the language, and builds a **syntax tree** from them:

```
document
└── statement
    └── statement_definition
        ├── title: "Life"
        └── content
            ├── text "Life moves fast."
            └── tag "movies"
```

### Grammars

The rules that a parser checks are written down as a **grammar**. A grammar consists of **productions**, each defining a named element in terms of other elements and tokens. Most language specifications use a notation called **EBNF** (Extended Backus–Naur Form). RFC 0006 uses the variant from the W3C XML specification:

```ebnf
statement   ::= statement_definition | statement_reference
relations   ::= INDENT relation+ DEDENT
```

This reads as follows. A statement is a statement definition or a statement reference. A relation list is an indentation, followed by one or more relations, followed by a dedentation. The operators are `|` (or), `?` (optional), `*` (zero or more), `+` (one or more), and parentheses for grouping.

### Concrete and abstract syntax trees

A **concrete syntax tree (CST)** contains everything in the source: every bracket, colon and line break, with its exact position. Editors need it for highlighting, folding and error messages.

An **abstract syntax tree (AST)** leaves out what only matters for writing. A statement definition, for example, becomes "a statement with title *Life* and text *Life moves fast.*".

Argdown 3.0 goes one step further. The tree is mapped onto the **data model** of RFC 0001, which no longer depends on syntax at all.

### Why Argdown is not easy to parse

The simplest grammars are **context-free**: whether a piece of text is a statement does not depend on what came before. Large parts of Argdown are context-free, but three are not:

- **Indentation.** In
  ```argdown
  [A]: a
      + [B]: b
          - [C]: c
  ```
  the depth of the indentation decides whether `[C]` attacks `[B]` or `[A]`. Python has the same problem. The standard solution is a lexer that remembers the open indentation levels and emits extra tokens: `INDENT` when a line is indented further, and `DEDENT` when it returns to an outer level. The grammar can then treat indentation like brackets.
- **Line starts.** `+`, `-`, `(1)`, `#` and `*` mean something different at the start of a line than in the middle of one.
- **Inline formatting.** Markdown-style `*italic*` and `**bold**` depend on the characters around the asterisks.

These parts cannot be expressed in plain EBNF. RFC 0006 specifies them in prose and with examples (§6). In an implementation they are handled by a small piece of hand-written code inside the lexer.

### How Argdown 2.x does it

Argdown 2.x uses [Chevrotain](https://chevrotain.io), a parser toolkit in TypeScript.

- `packages/argdown-core/src/lexer.ts` defines the tokens. Several of them use custom matcher functions that look at the previous token, which is how line starts are detected. A stack tracks indentation and emits `Indent`/`Dedent` tokens.
- `packages/argdown-core/src/parser.ts` defines the grammar rules in TypeScript code.
- `ArgdownTreeWalker` visits the resulting tree, and plugins such as `ModelPlugin` react to its nodes.

The grammar exists only as code. To know whether a document is valid Argdown, you have to run the parser. That is the gap RFC 0006 closes.

### How Argdown 3.0 will do it

RFC 0007 proposes [tree-sitter](https://tree-sitter.github.io) as the reference parser.

- **Grammar.** The grammar is written in a JavaScript file (`grammar.js`). tree-sitter generates a fast C parser from it, which also runs in browsers through WebAssembly (`web-tree-sitter`).
- **Context-sensitive parts.** Indentation and line starts are handled by an *external scanner*, a small C file, in the same way as in tree-sitter's Python grammar.
- **Editor use.** tree-sitter parses incrementally: after an edit it reparses only what changed. It is error-tolerant: it always produces a tree and marks the broken parts. Neovim, Helix, Zed and GitHub use tree-sitter for highlighting.

`grammar.js` is not written by hand. It is **generated deterministically** from the EBNF in RFC 0006, with one tree-sitter rule per EBNF production and the same names (RFC 0007 §4.5). The candidate tool is [tree-sitter-ebnf-generator](https://github.com/eatkins/tree-sitter-ebnf-generator). If it is not sufficient, a generator script of our own is written. Language models are not used for this step. RFC 0006 is then the only place where the grammar is edited.

The **conformance corpus** of RFC 0006 checks the result, including the hand-written scanner. It is a set of examples, each consisting of an input and its expected syntax tree, and it uses tree-sitter's own test format. If the specification and the parser disagree on an example, one of them has a bug.
