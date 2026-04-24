## 2.0.0

### Breaking Changes
- if you want to display argdown with graphviz, you need to load the graphviz ahead of time. If you use the argdown application provided by this package, you need to call the `init()` function to load graphviz. If you create a own Argdown Application you need to provide an sync implementation of graphviz:

**Using the argdown application from package**
```ts
  import { argdown, init } from "@hpcc-js/wasm-graphviz";
  
  await init();
  argdown.run(...);
```

**Own argdown application**
```ts
  import { Graphviz } from "@hpcc-js/wasm-graphviz";

  export const argdown = new ArgdownApplication();
  const graphviz = await Graphviz.load();
  argdown.addPlugin(new SyncDotToSvgExportPlugin(graphviz), "export-svg");
  // Other plugins you want to use
```


If you really really need a fully sync environment you still can provide graphviz synchronously (e.g. with aduh95/viz.js). A code snippet can be found here: https://github.com/argdown/argdown/pull/492#issuecomment-3724418415

### Major Changes

- update so version 2.0
- removed the static implementation of graphviz. The user needs to load graphviz wasm ahead of time. This can be done by calling the `init` function.
- more information: https://github.com/argdown/argdown/pull/492
- remove unnecessary dependencies and updated scripts

### Patch Changes

- Updated dependencies
  - @argdown/highlightjs@2.0.0
