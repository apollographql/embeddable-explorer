import { createUMDRollupConfig } from './createRollupConfig';

export default [
  createUMDRollupConfig({
    environment: 'development',
    isSandbox: true,
  }),
  createUMDRollupConfig({
    environment: 'production',
    isSandbox: true,
  }),
];
