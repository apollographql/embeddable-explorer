import typescript from '@rollup/plugin-typescript';
import babel from '@rollup/plugin-babel';
import json from '@rollup/plugin-json';

export function createRollupConfig(options) {
  return {
    input: {
      index: 'src/index.ts',
    },
    output: {
      format: options.format,
      freeze: false,
      esModule: true,
      name: 'explorer-helpers',
      exports: 'named',
      sourcemap: false,
      dir: `./dist`,
      entryFileNames:
        // All of our esm files have .mjs extensions
        options.format === 'esm' ? '[name].mjs' : '[name].production.min.cjs',
      ...(options.format === 'cjs' && {
        chunkFileNames: '[name].production.min.cjs',
      }),
    },
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
