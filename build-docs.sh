./#!/usr/bin/env sh

npm run docs:build

cd ./packages/argdown-core

npm run docs:build

cd ../argdown-node

npm run docs:build

cd ../../

cp ./docs/.vuepress/public/404.html ./docs/.vuepress/dist/404.html

# npm run docs:sitemap