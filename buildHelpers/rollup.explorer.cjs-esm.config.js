import { createRollupConfig } from './createRollupConfig';

export default [
  createRollupConfig({
    environment: 'production',
    format: 'cjs',
    isSandbox: false,
  }),
  createRollupConfig({
    environment: 'development',
    format: 'cjs',
    isSandbox: false,
  }),
  createRollupConfig({
    environment: 'production',
    format: 'esm',
    isSandbox: false,
  }),
];
