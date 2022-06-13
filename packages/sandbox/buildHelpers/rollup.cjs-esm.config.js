import { createCJS_ESMRollupConfig } from './createRollupConfig';

export default [
  createCJS_ESMRollupConfig({
    environment: 'production',
    format: 'cjs',
    isExplorer: true,
  }),
  createCJS_ESMRollupConfig({
    environment: 'development',
    format: 'cjs',
    isExplorer: true,
  }),
  createCJS_ESMRollupConfig({
    environment: 'production',
    format: 'esm',
    isExplorer: true,
  }),
];
