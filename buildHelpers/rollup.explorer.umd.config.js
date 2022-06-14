import { createRollupConfig } from './createRollupConfig';

export default [
  createRollupConfig({
    environment: 'development',
    isSandbox: false,
    format: 'umd',
  }),
  createRollupConfig({
    environment: 'production',
    isSandbox: false,
    format: 'umd',
  }),
];
