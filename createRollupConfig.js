import typescript from '@rollup/plugin-typescript';
import { terser } from 'rollup-plugin-terser';

// type RollupOptions = {
//   format: 'umd' | 'cjs' | 'esm',
//   isExplorer: boolean,
//   environment: 'production' | 'development',
// };

export function createRollupConfig(options) {
  return {
    input:
      options.format === 'umd'
        ? `src/${
            options.isExplorer ? 'embeddedExplorer' : 'embeddedSandbox'
          }/index-umd.ts`
        : 'src/index.ts',
    output: {
      format: options.format,
      name:
        options.format === 'umd'
          ? options.isExplorer
            ? 'EmbeddedExplorer'
            : 'EmbeddedSandbox'
          : options.isExplorer
          ? 'embeddable-explorer'
          : 'embeddable-sandbox',
      exports: options.format === 'umd' ? 'default' : 'named',
      sourcemap: true,
      ...(options.format === 'umd' && {
        file:
          options.environment === 'production'
            ? `dist/${
                options.isExplorer
                  ? 'embeddable-explorer'
                  : 'embeddable-sandbox'
              }.umd.production.min.js`
            : `dist/${
                options.isExplorer
                  ? 'embeddable-explorer'
                  : 'embeddable-sandbox'
              }.umd.development.js`,
      }),
      ...(options.format !== 'umd' && {
        dir: 'dist',
      }),
    },
    plugins: [
      typescript({ tsconfig: './tsconfig.json' }),
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
