---
title: Configuration
meta:
  - name: description
    content: In this guide you will learn how to configure the Argdown software tools.
---

# Configuration

The behaviour of the Argdown parser can be customized in many ways. Most of these configuration options are covered in detail in the guide on [creating argument maps](/guide/creating-argument-maps.html). If you want to get a quick overview, take a look at the [cheat sheet](/guide/configuration-cheatsheet.html) at the end of this guide.

There are two ways to change the settings of an Argdown application and its plugins: You can either create an [external configuration file](/guide/configuration-with-config-files.html) or use the [frontmatter](/guide/configuration-in-the-frontmatter-section.html) element within an Argdown document.

In general it is recommended to create an external configuration file. This has several advantages:

- you can reuse your configuration for any Argdown file
- you keep your Argdown files uncluttered from configuration data
- you leave data and presentation "uncoupled" so that other users can easily swap your configuration with theirs.

## Selecting the parser syntax mode

Choose between classic Argdown, full Argdown+, and the condensed Micro drafting dialect:

- `argdown` (default)
- `argdown+`
- `micro-argdown+`

Set the mode in the parser plugin configuration:

```json
{
  "parser": {
    "syntax": "argdown+"
  }
}
```

Or activate it from a document's frontmatter:

```argdown
===
parser:
  syntax: argdown+
===

[?Q1]: Is this document parsed in Argdown+ mode?
```

Frontmatter is resolved before lexing and plugin preparation. It has priority by default for compatibility. Set `data.frontMatterSettingsMode` to `default` when explicit API or external-config values should win, or to `ignore` to ignore frontmatter settings.

Argdown+ model interpretation is strict by design: its relation-typing constraints and Discussion Point type checks are enforced. Use `micro-argdown+` for documents following the condensed Micro syntax.

For incremental migration, leave existing files in `argdown` mode and switch them one at a time. Classic relation symbols remain accepted in Argdown+; new documents should prefer `%>` (or reverse shorthand `%`) for `isExampleFor` and `~=` for `isPotentiallyEqual`.
