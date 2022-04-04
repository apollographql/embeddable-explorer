module.exports = {
  rollup(config, options) {
    if (config.output.format === 'umd') {
      // eslint-disable-next-line no-param-reassign
      config.output.name = 'EmbeddedExplorer';
      // eslint-disable-next-line no-param-reassign
      config.output.exports = 'default';
    }
    return config;
  },
};
