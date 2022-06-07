module.exports = {
  rollup(config, options) {
    if (config.output.format === 'umd') {
      if (options.name === 'embeddable-explorer') {
        config.output.name = 'EmbeddedExplorer';
      }
      if (options.name === 'embeddable-sandbox') {
        config.output.name = 'EmbeddedSandbox';
      }
      config.output.exports = 'default';
    }
    if (options.format === 'esm') {
      config = { ...config, preserveModules: true };
      config.output = {
        ...config.output,
        dir: 'dist/',
        entryFileNames: '[name].esm.js',
      };
      delete config.output.file;
    }
    return config;
  },
};
