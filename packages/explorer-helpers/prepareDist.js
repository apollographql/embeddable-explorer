const fs = require('fs-extra');

// We copy the package.json to the dist folder, since when we publish we
// publish from inside the dist folder (see prepareForPublish node script).
const packageJson = require('./package.json');
packageJson.type = 'module';

// Remove package.json items that we don't need to publish
delete packageJson.scripts;
delete packageJson.bundlesize;
delete packageJson.engines;

// The root package.json points to the CJS/ESM source in "dist", to support
// on-going package development (e.g. running tests, supporting npm link, etc.).
// When publishing from "dist" however, we need to update the package.json
// to point to the files within the same directory.
const distPackageJson =
  JSON.stringify(
    packageJson,
    (_key, value) => {
      if (typeof value === 'string' && value.startsWith('dist/')) {
        const parts = value.split('/');
        parts.splice(0, 1); // remove dist
        return './' + parts.join('/');
      }
      return value;
    },
    2
  ) + '\n';

// Save the modified package.json to "dist"
fs.writeFileSync(`./dist/package.json`, distPackageJson);

// Copy supporting files into "dist"
const destDir = `dist`;
fs.copyFileSync(`README.md`, `${destDir}/README.md`);
fs.copyFileSync(`LICENSE`, `${destDir}/LICENSE`);
