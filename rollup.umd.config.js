import { createRollupConfig } from './createRollupConfig';

export default [
  createRollupConfig({
    environment: 'development',
    format: 'umd',
    isExplorer: false,
  }),
  createRollupConfig({
    environment: 'production',
    format: 'umd',
    isExplorer: false,
  }),
  createRollupConfig({
    environment: 'development',
    format: 'umd',
    isExplorer: true,
  }),
  createRollupConfig({
    environment: 'production',
    format: 'umd',
    isExplorer: true,
  }),
];
