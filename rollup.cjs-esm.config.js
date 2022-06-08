import { createRollupConfig } from './createRollupConfig';

export default [
  createRollupConfig({
    environment: 'production',
    format: 'cjs',
    isExplorer: true,
  }),
  createRollupConfig({
    environment: 'development',
    format: 'cjs',
    isExplorer: true,
  }),
  createRollupConfig({
    environment: 'production',
    format: 'esm',
    isExplorer: true,
  }),
];
