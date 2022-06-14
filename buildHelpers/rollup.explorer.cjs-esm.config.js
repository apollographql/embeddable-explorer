import { createCJS_ESMRollupConfig } from './createRollupConfig';

export default [
  createCJS_ESMRollupConfig({
    environment: 'production',
    format: 'cjs',
    isSandbox: false,
  }),
  createCJS_ESMRollupConfig({
    environment: 'development',
    format: 'cjs',
    isSandbox: false,
  }),
  createCJS_ESMRollupConfig({
    environment: 'production',
    format: 'esm',
    isSandbox: false,
  }),
];
