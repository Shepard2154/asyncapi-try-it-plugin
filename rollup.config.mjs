import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';
import esbuild from 'rollup-plugin-esbuild';

export default {
  input: 'src/index.ts',
  output: {
    file: 'dist/index.iife.js',
    format: 'iife',
    name: 'AsyncApiTryItPlugin',
    sourcemap: true,
  },
  plugins: [
    replace({
      'process.env.NODE_ENV': JSON.stringify('production'),
      preventAssignment: true,
    }),
    resolve({
      extensions: ['.mjs', '.js', '.json', '.ts', '.tsx'],
    }),
    commonjs(),
    esbuild({
      target: 'es2020',
      jsx: 'transform',
      jsxFactory: 'React.createElement',
      jsxFragment: 'React.Fragment',
      minify: true,
      sourceMap: true,
      tsconfig: 'tsconfig.json',
    }),
  ],
};
