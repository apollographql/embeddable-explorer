const fs = require('fs-extra');
const packages = [
  './packages/explorer',
  './packages/sandbox',
  './packages/explorer-helpers',
];
async function moveFiles() {
  packages.forEach(async (packageName) => {
    // remove all files except `dist` folder
    await fs.readdir(packageName).then((files) => {
      return Promise.all(
        files
          .filter((file) => file !== 'dist')
          .map((file) => fs.remove(packageName + '/' + file))
      );
    });
    // move all files in the `dist` folder in each package to the root
    // of the package for publish - so we only publish what is in dist
    const dist = packageName + '/dist';
    await fs.readdir(dist).then((files) => {
      files.forEach((file) => {
        const oldLocation = dist + '/' + file;
        const newLocation = packageName + '/' + file;
        fs.move(oldLocation, newLocation, { overwrite: true });
      });
    });
  });
}

moveFiles();
