# Bernie's Bills

A portal to help citizens lobby their government for bills introduced by Senator Bernie Sanders

## Dependencies

- node.js
- browserify globally installed
- minify gloablly installed
- clean-css globally installed

## Project setup

### OS X, Linux, & Bash on Windows

`npm install` to install dependency packages

`./build.sh` to run the build toolchain.  the toolchain bundles dependencies into `js/bundle.js`, combines json bill datasets, and minifies bundled javascript source.

## Deployment

`./deploy.sh` to create a distribution `dist` folder, and push the distribution to the `origin/gh-pages` branch