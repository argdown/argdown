# RFC 0006: Argdown Syntax

| | |
|---|---|
| **RFC** | 0006 |
| **Title** | Argdown Syntax |
| **Status** | Draft |
| **Authors** | Lucas Wiese |
| **Created** | 2026-11-11 |
| **Related** | RFC 0001 (data model), RFC 0007 (parser architecture); informative: RFC 0003 §5 (asserted oracle) |

## 1. Summary

This RFC specifies the concrete syntax of Argdown: which character sequences are Argdown documents, and which syntax tree each of them has. The specification has three parts:

- a grammar in W3C EBNF (§5, §7);
- prose rules for the context-sensitive parts, namely line breaks, indentation, line starts and inline formatting (§6);
- a conformance corpus of examples, each an input with its expected syntax tree (§10).

The syntax specified here is the syntax of Argdown 2.x, reconstructed from its parser. The goal is backwards compatibility: every document that Argdown 2.x accepts is a valid Argdown 3.0 document (§9).

This RFC covers syntax only. How a syntax tree is mapped to the data model of RFC 0001 is the parser's decision (RFC 0001, P2), and is specified in RFC 0007.

## 2. Motivation

Argdown's syntax is defined only by its implementation, `packages/argdown-core/src/lexer.ts` and `parser.ts`, and described informally in the documentation (`packages/argdown-docs/docs/syntax/index.md`). That causes four problems:

- **No reference for other implementations.** Editors, highlighters, the language server and parsers in other languages each reimplement the syntax, and drift apart. For example, the documentation shows an argument reference directly followed by its premise-conclusion structure without an empty line, which the 2.x parser rejects (§9.2).
- **Edge cases are undefined.** Whether `a // b` contains a comment, or what a tab counts as in indentation, can only be found out by running the parser.
- **A rewrite needs a target.** Argdown 3.0 replaces the parser (RFC 0007). Without a specification, "compatible with 2.x" has no testable meaning.
- **Language evolution needs a baseline.** New syntax can only be proposed as a change to something written down.

## 3. Design principles

**S1. Backwards compatibility.** Every document accepted by the Argdown 2.x parser (version 2.0, as published on npm) MUST be accepted by a conforming parser, with a syntax tree that has the same structure (Appendix A). Changes to the syntax MUST be additive: they MAY turn invalid documents into valid ones, but MUST NOT reject or reinterpret documents that 2.x accepts. Where 2.x behaviour is surprising, it is kept, and RFC 0007 MAY report a diagnostic for it (§9).

**S2. Syntax only.** This RFC defines the syntax tree, not what it means. Titles, tags, relations and inferences are syntactic elements here. Their meaning is given by RFC 0007 together with RFC 0001.

**S3. Three normative parts.** The grammar, the prose rules and the conformance corpus are all normative. If two of them disagree, that is a defect in this RFC and MUST be fixed here. Implementations MUST NOT resolve such a conflict on their own.

**S4. One name per element.** Every production has a `snake_case` name. Implementations SHOULD use these names for the corresponding syntax tree nodes, so that the corpus, the documentation and the code use the same vocabulary.

## 4. Notation

The grammar uses the EBNF notation of the W3C XML 1.0 specification, §6:

| Notation | Meaning |
|---|---|
| `a ::= …` | production defining `a` |
| `a b` | `a` followed by `b` |
| `a \| b` | `a` or `b` |
| `a?` | optional `a` |
| `a*` | zero or more `a` |
| `a+` | one or more `a` |
| `( … )` | grouping |
| `"x"` | literal characters |
| `[abc]`, `[^abc]`, `[a-z]` | character classes |
| `/* … */` | comment |

Conventions:

- **Lower-case names** (`statement`, `relations`) are syntactic productions. Each produces a node in the syntax tree.
- **Upper-case names** (`NEWLINE`, `STATEMENT_DEFINITION`) are tokens. They are produced by the lexical analysis of §6 and §8, and appear as leaves in the syntax tree.
- Tokens are matched against the source after the comments and the insignificant whitespace of §6.5 have been removed.

Some tokens cannot be defined by a regular expression alone. For those, the token table in §8 gives a pattern *and* a condition on the preceding token. §6 specifies the conditions. Where this RFC gives a token pattern as a regular expression, it uses ECMAScript syntax, and the pattern is anchored at the current position.

## 5. Block grammar

### 5.1 Document

```ebnf
document     ::= NEWLINE? EMPTYLINE? front_matter? block ( EMPTYLINE block )*
front_matter ::= FRONT_MATTER NEWLINE? EMPTYLINE

block        ::= heading
               | statement
               | argument
               | pcs
               | ordered_list
               | unordered_list
```

A document is a sequence of top-level **blocks**, separated by empty lines. A front matter section MAY precede the first block, and MUST be followed by an empty line.

The document MUST contain at least one block. This requirement is inherited from 2.x. §9.3 proposes to relax it.

### 5.2 Headings

```ebnf
heading ::= HEADING_START statement_content data?
```

`HEADING_START` is one or more `#`, followed by one space, at the start of a line (§8). The number of `#` characters is the heading level. The content of a heading MAY span several lines, until the next empty line.

### 5.3 Statements

```ebnf
statement            ::= ( statement_definition
                         | statement_reference
                         | statement_text )
                         data? relations?

statement_definition ::= STATEMENT_DEFINITION statement_content
statement_reference  ::= STATEMENT_REFERENCE TAG* NEWLINE?
statement_text       ::= statement_content

data                 ::= DATA NEWLINE?
```

- A **statement definition** is a title in square brackets and a colon, followed by text: `[Title]: text`.
- A **statement reference** is a title in square brackets on its own, optionally followed by tags: `[Title] #tag`.
- A **statement text** is text without a title.

A statement MAY be followed by a data element and by a relation list.

### 5.4 Arguments

```ebnf
argument             ::= ( argument_definition
                         | argument_reference )
                         data? relations?

argument_definition  ::= ARGUMENT_DEFINITION statement_content
argument_reference   ::= ARGUMENT_REFERENCE TAG* NEWLINE?
```

- An **argument definition** is a title in angle brackets and a colon, followed by a description: `<Title>: description`.
- An **argument reference** is a title in angle brackets on its own: `<Title>`.

### 5.5 Relations

```ebnf
relations        ::= INDENT relation+ DEDENT

relation         ::= incoming_support
                   | incoming_attack
                   | outgoing_support
                   | outgoing_attack
                   | incoming_undercut
                   | outgoing_undercut
                   | contradiction

incoming_support  ::= INCOMING_SUPPORT  relation_member   /* +>      */
incoming_attack   ::= INCOMING_ATTACK   relation_member   /* ->      */
outgoing_support  ::= OUTGOING_SUPPORT  relation_member   /* + , <+  */
outgoing_attack   ::= OUTGOING_ATTACK   relation_member   /* - , <-  */
incoming_undercut ::= INCOMING_UNDERCUT relation_member   /* _>      */
outgoing_undercut ::= OUTGOING_UNDERCUT relation_member   /* _ , <_  */
contradiction     ::= CONTRADICTION     statement         /* ><      */

relation_member   ::= statement | argument
```

A relation list is a sequence of relations, one per line. Each line is more indented than the element it belongs to (§6.3).

The **parent** of a relation is the statement, argument or inference whose `relations` node contains it. The **child** is the `relation_member` on the same line as the relation symbol. The direction is read from the child's perspective:

- An *outgoing* relation goes from the child to the parent. In `[A]` followed by the line `+ <B>`, `<B>` supports `[A]`.
- An *incoming* relation goes from the parent to the child.

The direction marker `<` of outgoing relations MAY be omitted. `+` and `<+` are the same token, as are `-` and `<-`, and `_` and `<_`.

Because `relation_member` contains `relations`, relation lists nest. A child can have its own children on more deeply indented lines.

### 5.6 Premise-conclusion structures

```ebnf
pcs                 ::= pcs_statement pcs_step+
pcs_step            ::= pcs_statement* inference pcs_statement
pcs_statement       ::= STATEMENT_NUMBER statement

inference           ::= INFERENCE_START
                        ( NEWLINE? inference_rules )?
                        NEWLINE?
                        ( DATA NEWLINE? )?
                        INFERENCE_END NEWLINE
                        inference_relations?
inference_rules     ::= text ( LIST_DELIMITER text )*
inference_relations ::= INDENT outgoing_undercut+ DEDENT
```

A premise-conclusion structure (pcs) is a sequence of numbered statements `(1)`, `(2)`, … with inference markers between some of them. The statement after an inference marker is a conclusion. The last `pcs_statement` is the main conclusion. The grammar guarantees that a pcs ends with an inference followed by a statement.

An inference marker has two forms:

- **Collapsed:** one line of four or more hyphens, `----`. Lexically, this is `INFERENCE_START` (`--`) directly followed by `INFERENCE_END` (`--…`) (§8.3).
- **Expanded:** a line starting with `--`, then optionally a comma-separated list of inference rules and a data element, then a line of two or more hyphens.

  ```argdown
  --
  Modus ponens, Universal instantiation
  {uses: [1, 2]}
  --
  ```

An inference MAY be followed by a relation list, which MAY only contain outgoing undercuts.

The grammar does not require the statement numbers to be consecutive or to start at 1. That is a diagnostic in RFC 0007.

A pcs is a top-level block. Which argument it belongs to is decided by the model builder: the argument of the immediately preceding top-level block, if that block is an argument (RFC 0007 §5.4). The grammar does not connect the two.

### 5.7 Lists

```ebnf
ordered_list        ::= INDENT ordered_list_item+ DEDENT
ordered_list_item   ::= ORDERED_LIST_ITEM ( statement | argument )

unordered_list      ::= INDENT unordered_list_item+ DEDENT
unordered_list_item ::= UNORDERED_LIST_ITEM ( statement | argument )
```

A list is a top-level block whose items start with `*` (unordered) or with a number and a full stop (ordered). Each item is a statement or argument, and MAY have relations.

Nested lists are not supported. A list item line that is more indented than the previous item is invalid (§9.2).

## 6. Layout and context-sensitive rules

This section specifies what EBNF cannot express. The rules are written as a lexer algorithm, but any implementation is conforming that produces the same token sequence.

### 6.1 Line breaks

A **line break** is `\r\n`, `\n` or `\r`. Trailing spaces and tabs before a line break are part of it.

- A single line break produces a `NEWLINE` token.
- Two or more line breaks, with nothing but spaces and tabs between them, produce **one** `EMPTYLINE` token. Further consecutive `EMPTYLINE` tokens are not produced: if an `EMPTYLINE` is followed, after a comment, by another empty line, only the first is kept.
- An `EMPTYLINE` at the end of the document is discarded.

Inside statement content, a `NEWLINE` is part of the content (§7). Statements, descriptions and headings therefore continue across single line breaks and end at an empty line or at a line that starts with a line-start token (§6.2).

### 6.2 Line-start tokens

The following tokens are only recognized **at the start of a line**. A token is at the start of a line if it is the first token of the document, or if the previous token is a `NEWLINE` or an `EMPTYLINE`:

| Token | Pattern | Effect on indentation |
|---|---|---|
| relation tokens (§8.2) | `[ \t]*` followed by the relation symbol | update (§6.3) |
| `INFERENCE_START` | `[ \t]*--` | reset (§6.4) |
| `STATEMENT_NUMBER` | `[ \t]*\(\d+\)` | reset |
| `ORDERED_LIST_ITEM` | `[ \t]*\d+\.` followed by whitespace | update, with width + 1 |
| `UNORDERED_LIST_ITEM` | `[ \t]*\*` followed by whitespace | update, with width + 1 |
| `HEADING_START` | `#+ ` (no leading whitespace) | none |

The leading whitespace is part of the token. Outside line starts, the same characters are ordinary text: `+` and `-` are text, `*` starts emphasis (§7.2), and `#` starts a tag.

A relation token is also recognized after an `EMPTYLINE`. The grammar then rejects the document, because a block cannot start with a relation. This rule exists only so that implementations can report a precise error message.

### 6.3 Indentation

Indentation is tracked with a stack of widths, which initially holds `0`.

The **width** of a line-start token is the number of space and tab characters before its symbol. **A tab counts as one character**, the same as a space. List item tokens use the width + 1, so that a list item without leading whitespace still opens a level.

When a token with the effect *update* is recognized with width `w`:

1. If `w` is greater than the top of the stack, `w` is pushed and an `INDENT` token is produced.
2. If `w` is less than the top of the stack, widths are popped while `w` is less than the top, and one `DEDENT` token is produced per pop.
3. If `w` equals the top of the stack, no token is produced.

The `INDENT` and `DEDENT` tokens are produced *before* the line-start token itself.

Consequences:

- A relation line at width 0 produces no `INDENT`, and is invalid. Relations MUST be indented relative to the stack bottom.
- After a dedent to a width that is not on the stack, step 2 stops at a smaller width, and no `INDENT` follows. The document is invalid, as in Python. Example: a relation at width 4, followed by one at width 2, with nothing at width 2 before.
- Lines that do not start with a line-start token do not change the stack. Continuation lines of statement text MAY therefore be indented freely.

### 6.4 Indentation resets

When an `INFERENCE_START` or a `STATEMENT_NUMBER` is recognized, or when an `EMPTYLINE` is produced that is not at the end of the document, the stack is reset to `0`. One `DEDENT` token is produced per removed width, before the token that caused the reset. At the end of the document, the stack is reset in the same way.

This is why the relations of a pcs statement end at the next inference or pcs statement, and why every top-level block starts at indentation 0.

### 6.5 Insignificant whitespace

Sequences of spaces and tabs between tokens are skipped, except where a pattern includes them. Text tokens contain internal spaces (§8.4). Several inline tokens absorb one trailing space or tab (§8), so that the space is not lost when the text is reassembled.

### 6.6 Comments

Comments are removed and do not appear in the syntax tree. There are three forms:

- `/* … */`, which MAY span lines;
- `<!-- … -->`, which MAY span lines;
- `// …` up to the end of the line. The comment MUST be followed by a line break: at the very end of the document, `//` is ordinary text (§9.2).

Comments are recognized before any other token, at any position, including inside statement text. As a consequence, a URL such as `https://example.org` that is not inside a link starts a line comment at `//` (§9.2).

To keep the block structure intact, a comment also removes line breaks that follow it:

- after an `EMPTYLINE`, it removes all following line breaks;
- after a `NEWLINE`, it removes the following line break, unless that line break starts an empty line.

A line that consists only of a comment therefore neither separates nor joins blocks.

### 6.7 Escaping

A backslash followed by any character produces an `ESCAPED_CHAR` token. The escaped character is ordinary text and never starts another token. Spaces after the escaped character are part of the token.

### 6.8 Inference mode

Between `INFERENCE_START` and `INFERENCE_END`, the lexer is in **inference mode**. In this mode only the following tokens are recognized:

- comments, `NEWLINE`, `ESCAPED_CHAR`, `SPECIAL_CHAR`;
- `INFERENCE_END` (`-{2,}`), `DATA`, `LIST_DELIMITER` (`,`);
- text (`FREESTYLE`, `UNUSED_CONTROL_CHAR`).

`INFERENCE_END` returns to the default mode. There are no line-start tokens in inference mode. That is why a line `(2)` before the closing `--` is text and not a pcs statement.

### 6.9 Emphasis delimiters

Bold and italic use the delimiters `**`, `__` (bold) and `*`, `_` (italic). Whether a delimiter opens or closes a range depends on context. The lexer keeps a stack of open ranges:

- A **closing** delimiter is recognized only if all of the following hold:
  - the innermost open range has the same delimiter;
  - the delimiter directly follows the previous token, with no skipped whitespace in between;
  - it is followed by a space or tab (which becomes part of the token), or by a line break, the end of the document, or one of `) } _ . , ! ? ; : - *`.
  
  Recognizing it closes the range.
- An **opening** delimiter is recognized if it is not followed by whitespace. Recognizing it opens a range.

Closing delimiters are tried before opening ones, and two-character delimiters before one-character ones. An unclosed range makes the document invalid. Ranges are not closed automatically at empty lines.

Example: `**a**b` is invalid. The second `**` is directly followed by `b`, so it cannot close the range, and is read as a second opening delimiter instead.

## 7. Inline grammar

### 7.1 Statement content

```ebnf
statement_content ::= ( text
                      | LINK
                      | bold
                      | italic
                      | TAG
                      | ARGUMENT_MENTION
                      | STATEMENT_MENTION
                      | NEWLINE )+

text              ::= ( FREESTYLE
                      | UNUSED_CONTROL_CHAR
                      | ESCAPED_CHAR
                      | SPECIAL_CHAR )+
```

Statement content is used by statement definitions and texts, argument descriptions and headings.

`text` is maximal: adjacent text tokens always form one `text` node. Text is split into several tokens only so that other tokens get a chance to match. The text of a `text` node is the concatenation of its tokens.

Statement content ends at the first token that it cannot contain: an `EMPTYLINE`, a line-start token, `DATA`, `INDENT`/`DEDENT`, or a definition or reference token.

### 7.2 Emphasis

```ebnf
bold   ::= ASTERISK_BOLD_START     statement_content? ASTERISK_BOLD_END
         | UNDERSCORE_BOLD_START   statement_content? UNDERSCORE_BOLD_END
italic ::= ASTERISK_ITALIC_START   statement_content? ASTERISK_ITALIC_END
         | UNDERSCORE_ITALIC_START statement_content? UNDERSCORE_ITALIC_END
```

Emphasis nests, for example `__*bold italic*__`, and MAY span line breaks. The delimiter rules are in §6.9.

## 8. Tokens

### 8.1 Priority

At each position, the lexer tries the tokens of the current mode **in the order given below**, and the **first** token that matches wins. This is *not* longest-match. The order is normative, because several patterns overlap. For example, a link has to be tried before a statement reference, and `--` before `-`.

Default mode, in order:

1. `COMMENT` (skipped; §6.6)
2. `FRONT_MATTER`
3. `DATA`
4. `ESCAPED_CHAR`
5. `SPECIAL_CHAR`
6. `EMPTYLINE`
7. `NEWLINE`
8. `INFERENCE_START`
9. `INCOMING_SUPPORT`
10. `INCOMING_ATTACK`
11. `OUTGOING_SUPPORT`
12. `OUTGOING_ATTACK`
13. `CONTRADICTION`
14. `INCOMING_UNDERCUT`
15. `OUTGOING_UNDERCUT`
16. `HEADING_START`
17. `STATEMENT_NUMBER`
18. `ORDERED_LIST_ITEM`
19. `UNORDERED_LIST_ITEM`
20. the four closing emphasis delimiters, bold before italic
21. the four opening emphasis delimiters, bold before italic
22. `LINK`
23. `TAG`
24. `STATEMENT_DEFINITION`
25. `STATEMENT_REFERENCE`
26. `STATEMENT_MENTION`
27. `ARGUMENT_DEFINITION`
28. `ARGUMENT_REFERENCE`
29. `ARGUMENT_MENTION`
30. whitespace (skipped)
31. `FREESTYLE`
32. `UNUSED_CONTROL_CHAR`

`INDENT` and `DEDENT` have no pattern. They are produced by §6.3 and §6.4.

Inference mode, in order: `COMMENT`, `NEWLINE`, `ESCAPED_CHAR`, `SPECIAL_CHAR`, `INFERENCE_END`, `DATA`, `LIST_DELIMITER`, whitespace, `FREESTYLE`, `UNUSED_CONTROL_CHAR`.

### 8.2 Line-start tokens

All of these are subject to §6.2. `W` stands for the indentation `[ \t]*`.

| Token | Pattern | Notes |
|---|---|---|
| `INFERENCE_START` | `W--` | |
| `INCOMING_SUPPORT` | `W\+>` | |
| `INCOMING_ATTACK` | `W->` | |
| `OUTGOING_SUPPORT` | `W<?\+` | |
| `OUTGOING_ATTACK` | `W<?-` | |
| `CONTRADICTION` | `W><` | |
| `INCOMING_UNDERCUT` | `W_>` | |
| `OUTGOING_UNDERCUT` | `W(<_\|_(?=\s))` | |
| `HEADING_START` | `#+ ` | no indentation allowed |
| `STATEMENT_NUMBER` | `W\(\d+\)` | |
| `ORDERED_LIST_ITEM` | `W\d+\.(?=\s)` | |
| `UNORDERED_LIST_ITEM` | `W\*(?=\s)` | |

### 8.3 Block-level tokens

| Token | Pattern | Notes |
|---|---|---|
| `NEWLINE` | `[ \t]*(\r\n\|\n\|\r)` | |
| `EMPTYLINE` | `([ \t]*(\r\n\|\n)){2,}` | see §6.1 |
| `FRONT_MATTER` | `===+[\s\S]*?===+` | content is YAML (§8.6) |
| `DATA` | `{((?!}\s[^,}])(.\|\n))*}(?!\s*(,\|}))` | content is YAML (§8.6) |
| `INFERENCE_END` | `-{2,}` | inference mode only |
| `LIST_DELIMITER` | `,` | inference mode only |

### 8.4 Inline tokens

| Token | Pattern | Notes |
|---|---|---|
| `STATEMENT_DEFINITION` | `\[.+?\]:` | title is between the brackets |
| `STATEMENT_REFERENCE` | `\[[^-].*?\]` | |
| `STATEMENT_MENTION` | `@\[.+?\][ \t]?` | |
| `ARGUMENT_DEFINITION` | `<.+?>:` | |
| `ARGUMENT_REFERENCE` | `<[^-].*?>` | |
| `ARGUMENT_MENTION` | `@<.+?>[ \t]?` | |
| `LINK` | `\[[^\]]+?\]\([^)]+?\)[ \t]?` | Markdown link `[text](url)` |
| `TAG` | `#(\([^)]+\)\|[A-z0-9\- -퟿豈-﷏ﷰ-￯]+)[ \t]?` | `#tag` or `#(tag text)`; see §9.2 on `A-z` |
| `ESCAPED_CHAR` | `\\.( )*` | |
| `SPECIAL_CHAR` | `\.[^\s]+?\.[ \t]?\|:[^\s]+?:[ \t]?` | shortcodes such as `.~.` or `:happy:` |
| `FREESTYLE` | `[^\\@#*_\[\],.:</>(){}\r\n;-]+` | |
| `UNUSED_CONTROL_CHAR` | `[@#*_\[\],.:</>(){};-][ \t]?` | |
| emphasis delimiters | `\*\*`, `__`, `\*`, `_` | see §6.9 |

Titles are single-line, because `.` does not match a line break, and the shortest possible match is taken. A title in definitions MAY start with `-`, but a title in references MUST NOT. Otherwise `<-` and `[-` would be ambiguous with relation and text.

### 8.5 Text reconstruction

`FREESTYLE` stops at every character that might start another token. When no other token matches, such a character is lexed as `UNUSED_CONTROL_CHAR`. The original text of a `text` node is the concatenation of its tokens' images, including the trailing whitespace that tokens absorb (§6.5). Skipped whitespace between tokens of the same `text` node is not part of any token. Implementations SHOULD reconstruct it from source positions.

### 8.6 Embedded YAML

The content of `FRONT_MATTER` (between the `===` lines) and of `DATA` is YAML, and is opaque to this grammar. Implementations parse it with a YAML 1.2 parser.

- If a `DATA` element's opening brace is directly followed by a line break, the content between the braces is parsed as YAML block style.
- Otherwise the whole element, braces included, is parsed as YAML flow style.

An invalid YAML payload does not make the Argdown document invalid. It is a diagnostic in RFC 0007.

### 8.7 Preprocessing

`@include(path)` directives are replaced textually before lexing, by tools that support them (in 2.x, `argdown-node`). They are not part of this grammar.

## 9. Backwards compatibility

### 9.1 Rule

The 2.x parser is the reference for S1. A conforming parser MUST accept exactly the documents the 2.x parser accepts, except where §9.3 explicitly extends the language. For each document, its syntax tree MUST correspond to the 2.x syntax tree under the mapping of Appendix A.

### 9.2 Documented 2.x behaviour

The following behaviours of 2.x are surprising, but they are part of the language under S1. RFC 0007 SHOULD report a diagnostic where noted.

| # | Behaviour | Status in 3.0 |
|---|---|---|
| Q1 | An argument reference followed directly by a pcs, with no empty line between them, is a syntax error. The documentation shows this form as valid. | Kept as an error. Proposed extension in §9.3 E2. |
| Q2 | `https://…` outside a link starts a line comment at `//`. | Kept. Diagnostic: "possible URL truncated by comment". |
| Q3 | `//` at the very end of the document, with no line break after it, is text, not a comment. | Kept. Fixing this would not be additive (S1), because such text currently ends up in the output. |
| Q4 | A tab counts as one character of indentation. Mixing tabs and spaces can produce unexpected dedents. | Kept. Diagnostic on mixed indentation. |
| Q5 | `TAG` uses the range `A-z`, which also includes `[ \ ] ^ _` and the backtick. `#a_b` is therefore one tag. | Kept. |
| Q6 | Nested lists are invalid. | Kept as an error. |
| Q7 | A continuation line of statement text that starts with a line-start token (§8.2) ends the text and starts another element, usually causing an error. Examples: `+`, `-`, `_ `, `# ` (with a space), `* `, `1. `, `(1)`. A line starting with `#tag` (no space) is fine. | Kept. Use `\` to escape. |
| Q8 | `---` (three hyphens) is not a collapsed inference. It is `--` followed by the text `-`, and the inference is unterminated. | Kept. Diagnostic suggesting `----`. |
| Q9 | `a.b.c` and `e.g.` contain `SPECIAL_CHAR` tokens (`.b.`, `.g.`). Unknown shortcodes are rendered as text, so the output is unchanged. | Kept. |
| Q10 | Closing emphasis delimiters must be followed by whitespace or punctuation (§6.9), so `**a**b` is invalid. | Kept. |
| Q11 | An empty document, or a document consisting only of front matter or comments, is invalid. | Proposed extension in §9.3 E1. |
| Q12 | Inference-level relations MAY only be outgoing undercuts. | Kept. |

### 9.3 Proposed additive extensions

These extensions only accept documents that 2.x rejects (S1). Each one needs a decision before this RFC reaches `Under review`.

- **E1. Empty documents.** Accept documents without blocks:
  ```ebnf
  document ::= NEWLINE? EMPTYLINE? ( front_matter_only | front_matter? block ( EMPTYLINE block )* )?
  front_matter_only ::= FRONT_MATTER NEWLINE? EMPTYLINE?
  ```
- **E2. Pcs directly after an argument.** Accept an argument definition or reference followed by a pcs without an empty line between them, as the documentation already shows. The `pcs` is then a child of the `argument` node, which also makes the assignment of §5.6 syntactic. 2.x documents keep their tree, because in 2.x this form is an error.
## 10. Conformance corpus

The grammar (§5, §7) and the prose rules (§6) leave room for interpretation, especially around indentation, emphasis and comments. As in the CommonMark specification, a set of binding examples removes that room. The examples also make backwards compatibility (S1) testable, because each case records what the 2.x parser does with its input.

The corpus is therefore a normative part of this specification (S3). It is planned to live in `rfcs/0006-corpus/` (see §12, question 5), with one file per section of this RFC. It uses the test format of tree-sitter (`test/corpus/*.txt`), so that the reference parser can run it directly. Each case is a title, the input, and the expected tree:

```
==================
Statement definition with tag
==================

[Life]: Life moves fast. #movies

---

(document
  (statement
    (statement_definition
      (STATEMENT_DEFINITION)
      (statement_content (text) (TAG)))))
```

A case is read as follows:

- The title is framed by `===` lines.
- The input follows the title, and the expected tree comes after the `---` line.
- The tree is an S-expression: `(name child …)` is a node with its children.
- Lower-case names are productions (§5, §7), and upper-case names are tokens (§8).
- Token text and source positions are not part of the tree.

Invalid documents are marked with the tree-sitter attribute `:error`. Their expected tree is not normative. Only the fact that they are rejected is.

The corpus MUST contain:

1. every example from the syntax documentation (`packages/argdown-docs/docs/syntax/index.md`), with the expected result of the 2.x parser;
2. the lexer and parser fixtures of the 2.x test suite (`packages/argdown-core/test/*.argdown`);
3. at least one valid and one invalid case per production of §5 and §7, and per rule of §6;
4. one case for each behaviour in §9.2.

Expected trees are generated by running the 2.x parser and mapping its tree with Appendix A. Where the result disagrees with this RFC, the disagreement is resolved in this RFC before the case is added (S3).

The corpus does not exist yet. It is built in step 2 of the roadmap (`rfcs/README.md`, "Order of work"). The script that generates the expected trees is implementation work. Like the grammar generator of RFC 0007 §4.5, it MUST be deterministic.

## 11. Alternatives considered

**ISO/IEC 14977 EBNF.** This is the formal standard, but it is rarely used in practice, and its syntax (`,` for sequence, `{ }` for repetition) is unfamiliar to most readers. W3C EBNF is better known, from the XML, XPath and SPARQL specifications, and maps directly onto the combinators of tree-sitter and of parser generators.

**ABNF (RFC 5234).** The IETF standard, designed for protocols and defined over bytes. It has no notation for character-class negation, which Argdown's text tokens need, and it is less readable for a document-oriented language.

**PEG.** PEGs describe ordered choice, which is close to how Argdown 2.x behaves (§8.1). But a PEG is a description of a parser rather than of a language, and two PEGs are hard to compare. The ordered choice of the lexer is kept, in §8.1, but the grammar itself is unordered EBNF.

**A parser-generator grammar as the specification** (ANTLR `.g4`, tree-sitter `grammar.js`, Langium). This gives an executable specification, but ties it to one tool and its quirks. In tree-sitter, for example, precedence and conflict declarations would become part of the specification. Instead, the grammar of the reference parser is generated deterministically from the EBNF of this RFC (RFC 0007 §4.5), and the corpus checks the result.

**Prose and examples only,** as in the CommonMark specification. This is the most readable approach for Markdown-like languages. But it gives no compact overview of the structure, and Argdown's block structure is more regular than Markdown's. This RFC combines a grammar for the regular part with prose and a corpus for the rest.

**Fixing the 2.x quirks now.** Several behaviours in §9.2 are clearly unintended. Fixing them would reinterpret existing documents and break S1. They are therefore kept, and reported as diagnostics, and can be revisited in a later version of the syntax if that is ever versioned.

## 12. Unresolved questions

1. **Extensions.** Should E1 and E2 (§9.3) be adopted?
2. **Syntax versioning.** Should documents be able to declare a syntax version, for example in front matter, so that the quirks of §9.2 can be fixed in a future version without breaking S1?
3. **Tab width.** Should a future version count a tab as more than one column (Q4)?
4. **Tree shape.** Should the syntax tree expose the title, text and number inside tokens as separate fields? For example, `STATEMENT_DEFINITION` could have a `title` child instead of the raw image `[Title]:`. This would change Appendix A, but not the accepted language.
5. **Corpus location.** Should the corpus live in `rfcs/0006-corpus/`, or in the repository of the reference parser, with this RFC pointing to a tagged version?
6. **Strict/loose mode.** Strict and loose mode are model-level settings in 2.x (RFC 0007 §5.3), not syntax. Should a document be able to select one of them in front matter? It already can in 2.x, through the `model.mode` setting.

## Appendix A. Correspondence with Argdown 2.x

This appendix maps the productions of this RFC to the rules in `packages/argdown-core/src/parser.ts` (`RuleNames.ts`) and the tokens in `lexer.ts` (`TokenNames.ts`).

### A.1 Productions

| 3.0 production | 2.x rule | Notes |
|---|---|---|
| `document` | `argdown` | 2.x does not wrap front matter in its own node. |
| `front_matter` | none | 2.x: a `FrontMatter` token directly under `argdown`. |
| `heading` | `heading` | |
| `statement` | `statement` | |
| `statement_definition` | `statementDefinition` | Created inside `statement` in 2.x. |
| `statement_reference` | none | 2.x: a `StatementReference` token directly under `statement`. |
| `statement_text` | none | 2.x: `statementContent` directly under `statement`. |
| `argument` | `argument` | |
| `argument_definition` | none | 2.x: the `ArgumentDefinition` token and `statementContent` directly under `argument`. |
| `argument_reference` | none | 2.x: the `ArgumentReference` token directly under `argument`. |
| `data` | none | 2.x: a `Data` token. |
| `relations` | `relations` | |
| `incoming_support` | `incomingSupport` | |
| `incoming_attack` | `incomingAttack` | |
| `outgoing_support` | `outgoingSupport` | |
| `outgoing_attack` | `outgoingAttack` | |
| `incoming_undercut` | `incomingUndercut` | |
| `outgoing_undercut` | `outgoingUndercut` | |
| `contradiction` | `contradiction` | |
| `relation_member` | none | Hidden in 2.x; the child is the statement or argument directly. |
| `pcs` | `pcs` | |
| `pcs_step` | `pcsTail` | |
| `pcs_statement` | `pcsStatement` | |
| `inference` | `inference` | |
| `inference_rules` | `inferenceRules` | |
| `inference_relations` | `inferenceRelations` | 2.x creates it with the name `relations`. |
| `ordered_list` | `orderedList` | |
| `ordered_list_item` | `orderedListItem` | |
| `unordered_list` | `unorderedList` | |
| `unordered_list_item` | `unorderedListItem` | |
| `statement_content` | `statementContent` | |
| `text` | `freestyleText` | |
| `bold` | `bold` | |
| `italic` | `italic` | |

"Same structure" in S1 means: after introducing the 3.0 wrapper nodes marked "none" above, and dropping `relation_member`, the two trees have the same nodes in the same order, with the same token images.

### A.2 Tokens

Each 3.0 token corresponds to the 2.x token with the same name in `PascalCase`, for example `STATEMENT_DEFINITION` and `StatementDefinition`. The only exceptions:

- `COMMENT` and whitespace are skipped in both versions.
- 2.x's `Spaces` corresponds to the skipped whitespace of §6.5.
- In 2.x, `Dedent` tokens are consumed by the parser but not stored in the tree. A 3.0 tree MAY keep them.
