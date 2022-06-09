import typescript from '@rollup/plugin-typescript';
import { terser } from 'rollup-plugin-terser';

// type RollupOptions = {
//   format: 'umd' | 'cjs' | 'esm',
//   isExplorer: boolean,
//   environment: 'production' | 'development',
// };

export function createUMDRollupConfig(options) {
  return {
    input: `src/${
      options.isExplorer ? 'embeddedExplorer' : 'embeddedSandbox'
    }/index-umd.ts`,
    output: {
      format: 'umd',
      freeze: false,
      name: options.isExplorer ? 'EmbeddedExplorer' : 'EmbeddedSandbox',
      exports: 'default',
      sourcemap: true,
      file:
        options.environment === 'production'
          ? `dist/${
              options.isExplorer ? 'embeddable-explorer' : 'embeddable-sandbox'
            }.umd.production.min.js`
          : `dist/${
              options.isExplorer ? 'embeddable-explorer' : 'embeddable-sandbox'
            }.umd.development.js`,
    },
    plugins: [
      typescript({ tsconfig: './tsconfig-umd.json' }),
      options.environment === 'production' &&
        terser({
          output: { comments: false },
          compress: {
            keep_infinity: true,
            pure_getters: true,
            passes: 10,
          },
          ecma: 2020,
          module: false,
          toplevel: false,
        }),
    ],
  };
}
