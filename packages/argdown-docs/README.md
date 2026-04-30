# @argdown/docs

![Argdown logo](../../argdown-arrow.png?raw=true "Argdown logo")

[Argdown](https://argdown.org) documentation website built using the [VuePress](https://vuepress.vuejs.org/) library.

## Features:

- API documentation for [Argdown-Core](https://github.com/argdown/argdown/tree/master/packages/argdown-core) and [Argdown-Node](https://github.com/argdown/argdown/tree/master/packages/argdown-node), made with the help of the [TypeDoc](https://typedoc.org/) library.
- Guides on the Argdown Argumentation syntax: [Syntax](https://argdown.org/guide/creating-argument-maps.html).
- Guides on publishing argument maps: [Publish](https://argdown.org/guide/creating-argument-maps.html).
- Guides on configuring the Argdown parser: [Configuration](https://argdown.org/guide/configuration.html).
- Guides on extending Argdown with additional functionalities: [Extend](https://argdown.org/guide/extending-argdown.html).
- Access to the Argdown demo editor: [Demo Editor](http://argdown.org/sandbox/).

## Installation

`yarn install`

## Development

`yarn run docs:dev`

## Building

Only the vitepress site:
`yarn run build`

Everything for deployment: 
`yarn run build:all`

## Deployment
1. Init the github pages branch inside of the dist folder
2. build the docs with `yarn run build:all`
3. force push to gh-pages branch

```bash
cd docs/.vitepress/dist
git clone -b gh-pages https://github.com/argdown/argdown.git .
yarn run build:all
git add -A
git commit -m "update docs"
git push --force-with-lease
```
