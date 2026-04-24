# Release Notes 2026


## v2.0.x (April 2026)

More than 10 years ago, [Christian Voigt](https://github.com/christianvoigt) presented his idea of "a simple
markup syntax for incorporating argument semantics into online text messages" at COMMA 2014 ([Voigt 2014](https://dblp.org/rec/conf/comma/Voigt14.html)): Argdown was born. Christian has since built an elegant and highly functional ecosystem of tools and plugins around the Argdown syntax—widely recognized, and beloved by its users. ♥️

To make Argdown future-proof and ensure it be available for another 10 years, we, i.e., [Kushal](https://github.com/Kushal12341997), [Hatim](https://github.com/5HATIM5), [Lucas](https://github.com/Morstis) and [Gregor](https://github.com/ggbetz), have been renovating Argdown since the beginning of 2025. Our guiding maxim—at least from a user's perspective—has been: conservation "as found." Christian's Argdown being a mature and polished application suite, we've refrained from adding more features and tinkering with UX, focusing instead on systematically updating deep dependencies, fixing the framework, and refactoring code where required.

In consequence:

* If you use Argdown apps (e.g., the VS Code extension) for argument analysis, you will (ideally) not notice any changes when switching to the new 2.0 release.
* If you're a developer building applications or sites with Argdown, however, some changes and adjustments might be required on your side.

### Breaking changes for developers

#### Argdown Core
If you develop an application that has direct dependencies on @argdown/core the following breaking change has introduced by using @hpcc-js/wasm-graphviz
However, if you depend on @argdown/core indirectly this change should not affect you, because all other argdown application were adjusted.

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


#### Argdown Language Server
The command pattern capabilities were removed from the language server, to remove the @argdown/node dependency from it and allow the language server to be run in full browser environments. If you depend on the command capabilities, look at the @argdown/vs-code extension. Or this PR: https://github.com/argdown/argdown/pull/523

The entrypoints also changed to: server.node.js or server.browser.js

#### Argdown Web Components
The webcomponent was rewritten to svelte. **But the attributes in kebab-case are deprecated!** Please update the arguments to camelCase.
```
initial-view -> initialView
without-zoom -> withoutZoom
without-maximize -> withoutMaximize
without-logo -> withoutLogo
without-header -> withoutHeader
```

#### Markdown It Plugin
The `createArgdownPlugin` function is async now. You should await it, for a consistent experience.
