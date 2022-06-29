import { createRollupConfig } from './createRollupConfig';

export default [
  createRollupConfig({
    environment: 'production',
    format: 'cjs',
  }),
  createRollupConfig({
    environment: 'development',
    format: 'cjs',
  }),
  createRollupConfig({
    environment: 'production',
    format: 'esm',
  }),
];
