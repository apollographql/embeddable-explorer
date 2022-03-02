module.exports = {
  rollup(config, options) {
    if (config.output.format === 'umd') {
      config.output.name = 'EmbeddedExplorer';
      config.output.exports = 'default';
    }
    return config;
  },
};
