#!/bin/bash

mkdir -p dist
cp index.html dist
cp -r js dist
rm dist/js/index.js
rm dist/js/bundle.js
cp -r img dist
rm dist/img/*.psd
cp -r fonts dist
cp -r data dist
cp -r css dist
rm dist/css/style.css

git add dist && git commit -m "deployment"
git subtree push --prefix dist origin gh-pages