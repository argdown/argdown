# @argdown/core

![Argdown logo](https://raw.githubusercontent.com/argdown/argdown/HEAD/argdown-arrow.png "Argdown logo")

The package contains

- the parser and lexer for the [Argdown argumentation syntax](https://argdown.org), using the [Chevrotain DSL](https://github.com/SAP/chevrotain).
- the basic ArgdownApplication class that manages plugins
- and the plugins for all central tasks, including the ParserPlugin, ModelPlugin, MapPlugin, HtmlExportPlugin, JSONExportPlugin, DotExportPlugin.

This package is part of the [Argdown project](https://argdown.org).

For more information about this package visit the [API documents](https://argdown.org/argdown-core/index.html).

## Installing

If you want to use the package in your own software, use `npm install @argdown/core`.

<!-- Commenting below line since there is no bootstrap script. -->
<!-- If you want to check out the code, fork this repository and run `npm run bootstrap`. -->

## Testing

`yarn test`

## Argdown+ modes

`ParserPlugin` defaults to classic `argdown`. Extended syntax is opt-in:

```ts
const request = {
  input,
  process: ["parse-input", "build-model"],
  parser: { syntax: "argdown+" }
};
```

Set `parser.syntax` to `micro-argdown+` for the compact drafting dialect. Both extended modes produce a normalized entity graph, relation occurrences, and structured diagnostics; the classic `statements` and `arguments` maps remain compatibility views. `discussionPoints` contains Statements, Questions, References, and Arguments, while exact Excerpt text artifacts are exposed separately through `excerpts`.

Syntax can also be selected in a document's `===` YAML frontmatter, which is resolved before tokenization and plugin preparation. The normative contracts are [ADP-SPEC](../../ADP-SPEC.md), [Micro-Argdown+](../../micro-argdown-plus.md), and the [alignment and conversion contract](../../ADP-MICRO-ALIGNMENT.md).

## Building

`yarn build`
