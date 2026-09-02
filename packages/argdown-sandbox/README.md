# Argdown Sandbox

![Argdown logo](../../argdown-arrow.png?raw=true "Argdown logo")

The [Argdown](https://argdown.org) browser editor supports Classic Argdown,
Argdown+, and Micro-Argdown+. Try it at the
[Argdown Sandbox](https://argdown.org/sandbox/).

## Features

- Live HTML preview and semantic diagnostics
- Interactive argument maps rendered with
  [Dagre-D3](https://github.com/dagrejs/dagre-d3) or Graphviz
- Graph legend, type filters, keyboard selection, and node/edge inspection
- Bidirectional navigation between source occurrences and graph elements
- DOT, GraphML, JSON, SVG, and PNG export
- Bundled Classic Argdown, Argdown+, and Micro-Argdown+ examples

The Sandbox uses [Vue](https://vuejs.org/) and is intended as an accessible
place to learn and experiment with Argdown. See the
[Argdown+ guide](https://argdown.org/argdown-plus/) for its typed discussion
points, semantic relations, excerpts, and condensed drafting syntax.

For the complete editing workflow, install the
[VS Code extension](https://argdown.org/guide/installing-the-vscode-extension.html).

## Development

From the repository root:

```sh
corepack yarn install
corepack yarn workspace @argdown/sandbox dev
```

The development server is available at `http://localhost:5173/sandbox/`.

## Verification

```sh
corepack yarn workspace @argdown/sandbox test
corepack yarn workspace @argdown/sandbox lint
corepack yarn workspace @argdown/sandbox build
corepack yarn workspace @argdown/sandbox test:e2e
```

The browser suite starts its own Vite server. Install its Chromium runtime once
with `corepack yarn workspace @argdown/sandbox exec playwright install chromium`
if it is not already present.
