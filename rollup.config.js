import dts from 'rollup-plugin-dts';
import esbuild from 'rollup-plugin-esbuild';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';

import package_json from './package.json' assert { type: 'json' };

const bundle = config => ({
  ...config,
  input: 'src/index.ts',
  external: id => !/^[./]/.test(id),
});

export default [
  bundle({
    plugins: [esbuild()],
    output: [
      {
        file: package_json.main,
        format: 'cjs',
        sourcemap: true,
      },
      {
        file: package_json.module,
        format: 'es',
        sourcemap: true,
      },
      {
        name: 'easy-poll',
        file: package_json.browser,
        format: 'umd',
        plugins: [resolve(), commonjs(), terser()],
      },
    ],
  }),
  bundle({
    plugins: [dts()],
    output: {
      file: package_json.types,
      format: 'es',
    },
  }),
];
