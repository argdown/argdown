# @argdown/remark-plugin

![Argdown logo](https://raw.githubusercontent.com/argdown/argdown/HEAD/argdown-arrow.png "Argdown logo")

This package is part of the [Argdown project](https://argdown.org) and adds Argdown support to the Remark Markdown processor.

For a more detailed documentation, read the guide on [how to use Argdown in Markdown](https://argdown.org/guide/use-argdown-in-markdown.html).

Here are the basics:

### How to add Argdown support to Remark

Install the required packages:

```sh
npm install remark @argdown/remark-plugin
```

#### Basic Usage (Raw HTML Output)

```javascript
import { remark } from "remark";
import { remarkArgdownPlugin } from "@argdown/remark-plugin";

const processor = remark().use(remarkArgdownPlugin);

const markdownInput = `
# Argdown in Markdown

\`\`\`argdown-map
[Statement]: This is a sample statement.
    <- <Argument>: This is a counter-argument.
\`\`\`
`;

const result = await processor.process(markdownInput);
console.log(String(result)); // Raw HTML with <argdown-map> web components
```

#### Recommended Usage (Processed HTML Output)

For proper HTML processing that preserves web components, use the rehype pipeline:

```sh
npm install remark-rehype rehype-raw rehype-stringify
```

```javascript
import { remark } from "remark";
import { remarkArgdownPlugin } from "@argdown/remark-plugin";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeStringify from "rehype-stringify";

const processor = remark()
  .use(remarkArgdownPlugin)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw)
  .use(rehypeStringify);

const markdownInput = `
# Argdown in Markdown

\`\`\`argdown-map
[Statement]: This is a sample statement.
    <- <Argument>: This is a counter-argument.
\`\`\`
`;

const result = await processor.process(markdownInput);
console.log(String(result)); // Properly processed HTML
```

### Code Fence Types

The plugin supports two code fence languages:

- `argdown`: Creates an Argdown component with source view as default
- `argdown-map`: Creates an Argdown component with map view as default

### Configuration

You can configure the plugin by passing options:

```javascript
const processor = remark()
  .use(remarkArgdownPlugin, {
    argdownConfig: {
      webComponent: {
        withoutHeader: true,
        addGlobalStyles: false,
        addWebComponentScript: false,
        addWebComponentPolyfill: false
      }
    }
  });
```
