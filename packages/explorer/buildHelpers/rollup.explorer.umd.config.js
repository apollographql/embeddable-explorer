import { createUMDRollupConfig } from './createRollupConfig';

export default [
  createUMDRollupConfig({
    environment: 'development',
    isExplorer: true,
  }),
  createUMDRollupConfig({
    environment: 'production',
    isExplorer: true,
  }),
];
