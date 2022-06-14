import typescript from '@rollup/plugin-typescript';
import { terser } from 'rollup-plugin-terser';

// type RollupOptions = {
//   format: 'umd' | 'cjs' | 'esm',
//   isSandbox: boolean,
//   environment: 'production' | 'development',
// };

export function createUMDRollupConfig(options) {
  return {
    input: `src/${
      options.isSandbox ? 'embeddedSandbox' : 'embeddedExplorer'
    }/index-umd.ts`,
    output: {
      format: 'umd',
      freeze: false,
      // we need to specify that this is a default export so that
      // EmbeddedExplorer or EmbeddedSandbox will be exposed on window
      name: options.isSandbox ? 'EmbeddedSandbox' : 'EmbeddedExplorer',
      exports: 'default',
      sourcemap: true,
      file:
        // we minify production builds using terser - see plugins below
        `./dist/${
          options.isSandbox ? 'embeddable-sandbox' : 'embeddable-explorer'
        }.umd.${
          options.environment === 'production'
            ? 'production.min'
            : 'development'
        }.js`,
    },
    plugins: [
      // we override outDir for the umd build since we are outputting to files, not dirs
      // if we pass outDir: 'dist' here the ts files will be put in a nested dist dir inside dist
      typescript({ tsconfig: './tsconfig.json', outDir: '' }),
      options.environment === 'production' &&
        // terser is for minifying
        // see https://www.npmjs.com/package/rollup-plugin-terser#options
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
    input: 'src/index.ts',
    output: {
      format: options.format,
      freeze: false,
      esModule: true,
      name: options.isSandbox ? 'embeddable-sandbox' : 'embeddable-explorer',
      exports: 'named',
      sourcemap: true,
      dir: `./dist`,
      entryFileNames:
        // All of our esm files have .mjs extensions
        options.format === 'esm'
          ? '[name].mjs'
          : // we only make production & development builds in cjs, so we need to name the chunks accordingly
          options.environment === 'production'
          ? '[name].production.min.js'
          : '[name].development.js',
      // we only make production & development builds in cjs, so we need to name the chunks accordingly
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
      options.environment === 'production' &&
        // terser is for minifying
        // see https://www.npmjs.com/package/rollup-plugin-terser#options
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
