import nodeResolve from 'rollup-plugin-node-resolve';
import ts from 'rollup-plugin-typescript';

export default {
  entry: './src/ts/minarai-client.ts',
  dest: './dist/minarai-client.js',
  format: 'cjs',
  plugins: [
    nodeResolve({ jsnext: true }),
    ts(),
  ],
}

