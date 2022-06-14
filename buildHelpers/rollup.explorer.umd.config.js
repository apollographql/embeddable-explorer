import { createUMDRollupConfig } from './createRollupConfig';

export default [
  createUMDRollupConfig({
    environment: 'development',
    isSandbox: false,
  }),
  createUMDRollupConfig({
    environment: 'production',
    isSandbox: false,
  }),
];
