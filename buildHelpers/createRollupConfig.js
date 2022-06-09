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
        // terser is for minifying production builds
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
