import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import esbuild from 'rollup-plugin-esbuild';

export default {
  input: 'src/index.ts',
  external: ['react'],
  output: {
    file: 'dist/index.iife.js',
    format: 'iife',
    name: 'AsyncApiTryItPlugin',
    globals: {
      react: 'React',
    },
    sourcemap: true,
  },
  plugins: [
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
