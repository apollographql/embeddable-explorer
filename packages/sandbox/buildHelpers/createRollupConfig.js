import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import { terser } from 'rollup-plugin-terser';
import babel from '@rollup/plugin-babel';
import json from '@rollup/plugin-json';

// type RollupOptions = {
//   format: 'umd' | 'cjs' | 'esm',
//   environment: 'production' | 'development',
// };

export function createRollupConfig(options) {
  if (options.format === 'umd') {
    return createUMDRollupConfig(options);
  } else {
    return createCJS_ESMRollupConfig(options);
  }
}

function createUMDRollupConfig(options) {
  return {
    input: 'src/index-umd.ts',
    output: {
      format: 'umd',
      freeze: false,
      name: 'EmbeddedSandbox',
      exports: 'default',
      sourcemap: true,
      file:
        // we minify production builds using terser - see plugins below
        options.environment === 'production'
          ? `./dist/embeddable-sandbox.umd.production.min.js`
          : `./dist/embeddable-sandbox.umd.development.js`,
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
      babel({
        exclude: 'node_modules/**',
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
        babelHelpers: 'bundled',
      }),
      resolve({
        jsnext: true,
        main: true,
        browser: true,
      }),
      commonjs(),
      json(),
    ],
    context: 'this',
  };
}

function createCJS_ESMRollupConfig(options) {
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
      name: 'embeddable-sandbox',
      exports: 'named',
      sourcemap: false,
      dir: `./dist`,
      entryFileNames:
        // All of our esm files have .mjs extensions
        options.format === 'esm'
          ? '[name].mjs'
          : // we only make production & development builds in cjs, so we need to name the chunks accordingly
          options.environment === 'production'
          ? '[name].production.min.cjs'
          : '[name].development.cjs',
      // we only make production & development builds in cjs, so we need to name the chunks accordingly
      ...(options.format === 'cjs' && {
        chunkFileNames:
          options.environment === 'production'
            ? '[name].production.min.cjs'
            : '[name].development.cjs',
      }),
    },
    external: ['react'],
    plugins: [
      typescript({
        tsconfig: './tsconfig.json',
      }),
      babel({
        exclude: 'node_modules/**',
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
        babelHelpers: 'bundled',
      }),
      json(),
    ],
  };
}
