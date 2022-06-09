const fs = require('fs-extra');

// This file is responsible for writing the entry point for our cjs build.
// The cjs build has a production & development version, and we serve
// one or the other based on the process.env.NODE_ENV
const name = process.argv[2];
const baseLine = `module.exports = require('./${name}`;
const contents = `
  'use strict'
  if (process.env.NODE_ENV === 'production') {
    ${baseLine}.production.js')
  } else {
    ${baseLine}.development.js')
  }
  `;
fs.outputFile('dist/index.cjs', contents);
fs.outputFile('dist/react/index.cjs', contents);
