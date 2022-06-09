const fs = require('fs-extra');

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
