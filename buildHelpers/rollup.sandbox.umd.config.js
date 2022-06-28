import { createRollupConfig } from './createRollupConfig';

export default [
  createRollupConfig({
    environment: 'development',
    isSandbox: true,
    format: 'umd',
  }),
  createRollupConfig({
    environment: 'production',
    isSandbox: true,
    format: 'umd',
  }),
];
