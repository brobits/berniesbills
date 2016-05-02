#!/bin/bash

browserify js/index.js > js/bundle.js
minify js/bundle.js >js/min.js
cleancss -o css/style.min.css css/style.css
./combine.bat
