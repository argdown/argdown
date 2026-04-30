#! /usr/bin/env sh

npm run build

cd ../argdown-core

npm run docs:build

cd ../argdown-node

npm run docs:build

cd ../argdown-sandbox

npm run build

cp -r dist ../argdown-docs/docs/.vitepress/dist/sandbox

cd ../argdown-docs

cp ./docs/public/404.html ./docs/.vitepress/dist/404.html

# npm run docs:sitemap
