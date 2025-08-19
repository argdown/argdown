#! /usr/bin/env sh

npm run docs:build

cd ../argdown-core

npm run docs:build

cd ../argdown-node

npm run docs:build

cd ../argdown-sandbox

npm run build

cd ../argdown-docs

cp ./docs/.vuepress/public/404.html ./docs/.vuepress/dist/404.html

# npm run docs:sitemap