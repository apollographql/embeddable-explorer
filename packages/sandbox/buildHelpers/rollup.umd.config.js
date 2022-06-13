import { createUMDRollupConfig } from './createRollupConfig';

export default [
  createUMDRollupConfig({
    environment: 'development',
    isExplorer: false,
  }),
  createUMDRollupConfig({
    environment: 'production',
    isExplorer: false,
  }),
];
