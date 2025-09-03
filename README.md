<div align="center">

# Argdown

![Argdown logo](./argdown-arrow.png?raw=true "Argdown logo")

[📑 Documentation](https://argdown.org) | [🕹️ Playground](https://argdown.org/sandbox) | [💬 Discord Server](https://discord.gg/rFe7nuDbzs)

</div>

[Argdown](https://argdown.org) is a simple syntax for analyzing complex argumentation.

- Listing pros & cons in Argdown is as simple as writing a twitter message. You don't have to learn anything new, except a few simple rules that will feel very natural.
- With these simple rules you will be able to define more complex relations between arguments or dive into the details of their logical premise-conclusion structures.
- Argdown can even be used within Markdown! Your code is transformed into an <a href="https://en.wikipedia.org/wiki/Argument_map">argument map</a> while you are typing. When your are ready, you can publish your analysis as pdf, embed it as a web-component in a webpage or simply export your map as an image.

Start with [the docs](https://argdown.org) or try it out in the [Browser Sandbox](https://argdown.org/sandbox).

If you want to start working right away, you should install the [Argdown VS Code extension](https://argdown.org/guide/installing-the-vscode-extension).

<img src="./screenshots/argdown-vscode-greenspan-1.png?raw=true" width="30%"></img> <img src="./screenshots/argdown-vscode-greenspan-2.png?raw=true" width="30%"></img> <img src="./screenshots/argdown-vscode-semmelweis-1.png?raw=true" width="30%"></img> <img src="./screenshots/argdown-sandbox-soft-drugs-1.png?raw=true" width="30%"></img> <img src="./screenshots/argdown-sandbox-greenspan-1.png?raw=true" width="30%"></img> <img src="./screenshots/argdown-sandbox-censorship-1.png?raw=true" width="30%"></img>

## Credits and license

The development of Argdown and Argdown-related tools is funded by the [DebateLab](http://debatelab.philosophie.kit.edu/) at KIT, Karlsruhe.

All code is published under the MIT license. The optional Argvu font is published under a [Free License](https://github.com/christianvoigt/argdown/tree/master/packages/argvu/LICENSE.md).

## About this repository

This repository is a [Monorepo](https://en.wikipedia.org/wiki/Monorepo) containing all packages of the Argdown project. We use [yarn-workspaces](https://yarnpkg.com/features/workspaces) to manage their internal dependencies. You can find all packages in the `packages/` folder.

For further information about the code, consult the [API section](https://argdown.github.io/argdown/api/) of the documentation.

To install this Monorepo

- install requirements (`node>=22.11.0`, `yarn>=4.9.4` via `corepack`)
- clone this repository and cd into project dir
- activate yarn with `yarn set version berry`
- run `yarn install` in the main folder to install the dependencies of all packages. This will install all the libraries for all the argdown packages.
- run `yarn workspaces foreach -A --topological-dev --exclude . run build`.
- run `yarn workspaces foreach -A --topological-dev --exclude . run test` for tests
- run `yarn workspace @argdown/docs run docs:dev` to deploy website locally.

