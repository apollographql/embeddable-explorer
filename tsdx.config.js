module.exports = {
  rollup(config, options) {
    config.output.name = 'EmbeddedExplorer';
    config.output.exports = 'default';
    return config;
  },
};
