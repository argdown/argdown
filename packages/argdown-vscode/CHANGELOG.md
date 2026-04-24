# Release Notes 2025

## 2.0.0

### Major Changes

- PR: https://github.com/argdown/argdown/pull/523
- update so version 2.0
- the language server exports .js files and not .cjs now. It also isn't a module now, because it should be an application
- completely remove webpack
- add dev script, thats start esbuild in watch mode for all the platforms. Therefore the developer can change code and refresh the vscode extension host for faster development. the "sandbox" script starts a vscode server at localhost:3000 for faster browser development (combine with yarn run dev)
- remove @argdown/node
- moved files, for a better overview
- remove some wildcard imports of vscode (this probably wasn't necessary, because vscode does not get bundles, but I think it helps code readability)
- Most exports can be done via the command pallet now (exports of dagre maps are an exception)
- The Argdownconfig was abstracted into a class that only needs a resource, and not a whole webview context -> With this change we can use the existing ArgdownEngine to export most things that @argdown/core can also export.
- Exporting pdfs is done by inserting the svg into a pdf like described above.
- the .vscodeignore file was edited to reduce the package size significantly (from 13mb to 8mb)
- In an production environment we don't export .map files anymore
- packaging node_modules does not work in yarn. So we copy the required files manually (see copy:* scripts)

### Patch Changes

- Updated dependencies
  - @argdown/markdown-it-plugin@2.0.0
  - @argdown/language-server@2.0.0
  - @argdown/map-views@2.0.0
  - @argdown/core@2.0.0
  - @argdown/web-components@2.0.0

## v2.0.x (December 2025)

More than 10 years ago, [Christian Voigt](https://github.com/christianvoigt) presented his idea of "a simple
markup syntax for incorporating argument semantics into online text messages" at COMMA 2014 ([Voigt 2014](https://dblp.org/rec/conf/comma/Voigt14.html)): Argdown was born. Christian has since built an elegant and highly functional ecosystem of tools and plugins around the Argdown syntax—widely recognized, and beloved by its users. ♥️

To make Argdown future-proof and ensure it be available for another 10 years, we, i.e., [Kushal](https://github.com/Kushal12341997), [Hatim](https://github.com/5HATIM5) and [Gregor](https://github.com/ggbetz), have been renovating Argdown since the beginning of 2025. Our guiding maxim—at least from a user's perspective—has been: conservation "as found." Christian's Argdown being a mature and polished application suite, we've refrained from adding more features and tinkering with UX, focusing instead on systematically updating deep dependencies, fixing the framework, and refactoring code where required.

In consequence:

- If you use Argdown apps (e.g., the VS Code extension) for argument analysis, you will (ideally) not notice any changes when switching to the new 2.0 release.
- If you're a developer building applications or sites with Argdown, however, some changes and adjustments might be required on your side. Most notably, Argdown 2.0 is, firstly, a pure `esm` library (with some standard `commonjs` apps) and is, secondly, now requiring Node 22 to work properly.

Our maintenance commitment for the future includes:

- Fix upcoming future bugs
- Replace problematic dependencies (e.g., outdated, unmaintained, or vulnerable ones) step by step
- Add features as opportunities arise (low hanging fruits)
