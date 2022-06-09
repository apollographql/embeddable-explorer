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
      // we need to specify that this is a default export so that
      // EmbeddedExplorer or EmbeddedSandbox will be exposed on window
      name: options.isExplorer ? 'EmbeddedExplorer' : 'EmbeddedSandbox',
      exports: 'default',
      sourcemap: true,
      file:
        // we minify production builds using terser - see plugins below
        options.environment === 'production'
          ? `./dist/${
              options.isExplorer ? 'embeddable-explorer' : 'embeddable-sandbox'
            }.umd.production.min.js`
          : `./dist/${
              options.isExplorer ? 'embeddable-explorer' : 'embeddable-sandbox'
            }.umd.development.js`,
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
    input: {
      // We have two entry files - the vanilla js class export (index.js) and
      // the react export which is exported from its own file.
      // This allows folks to skip bundling with react if they just want to use the vanilla js class
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
      sourcemapPathTransform: (relativeSourcePath, sourcemapPath) => {
        // will replace relative paths with absolute paths
        return relativeSourcePath
          .replace('src/', '')
          .replace('node_modules/', 'external/')
          .replace('../../external', '../external');
      },
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
