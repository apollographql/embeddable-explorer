import { createRollupConfig } from './createRollupConfig';

export default [
  createRollupConfig({
    format: 'cjs',
  }),
  createRollupConfig({
    format: 'esm',
  }),
];
