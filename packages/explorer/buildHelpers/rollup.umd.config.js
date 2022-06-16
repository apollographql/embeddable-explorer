import { createRollupConfig } from './createRollupConfig';

export default [
  createRollupConfig({
    format: 'umd',
    environment: 'development',
  }),
  createRollupConfig({
    format: 'umd',
    environment: 'production',
  }),
];
