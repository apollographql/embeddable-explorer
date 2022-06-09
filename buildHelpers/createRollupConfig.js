import typescript from '@rollup/plugin-typescript';
import { terser } from 'rollup-plugin-terser';
import rename from 'rollup-plugin-rename';

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

export function createCJS_ESMRollupConfig(options) {
  return {
    input: {
      index: 'src/index.ts',
      'react/index': 'src/react/index.ts',
    },
    output: {
      format: options.format,
      freeze: false,
      esModule: true,
      name: options.isExplorer ? 'embeddable-explorer' : 'embeddable-sandbox',
      exports: 'named',
      sourcemap: true,
      dir: `./dist`,
      entryFileNames:
        options.format === 'esm'
          ? '[name].mjs'
          : options.environment === 'production'
          ? '[name].production.min.js'
          : '[name].development.js',
      ...(options.format === 'cjs' && {
        chunkFileNames:
          options.environment === 'production'
            ? '[name].production.min.js'
            : '[name].development.js',
      }),
    },
    external: ['use-deep-compare-effect', 'react'],
    plugins: [
      typescript({
        tsconfig: './tsconfig.json',
      }),
      rename({
        map: (name) =>
          name
            .replace('src/', '')
            .replace('node_modules/', 'external/')
            .replace('../../external', '../external'),
      }),
      options.environment === 'production' &&
        terser({
          output: { comments: false },
          compress: {
            keep_infinity: true,
            pure_getters: true,
            passes: 10,
          },
          ecma: 2020,
          module: options.format === 'esm',
          toplevel: options.format === 'esm' || options.format === 'cjs',
        }),
    ],
  };
}
