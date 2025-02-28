import path from 'node:path';
import { defineConfig } from 'vite';
import { externalizeDeps } from 'vite-plugin-externalize-deps';
import pkg from './package.json';

export default defineConfig({
  plugins: [externalizeDeps()],
  build: {
    lib: {
      entry: path.resolve(import.meta.dirname, 'src/index.ts'),
      formats: ['cjs', 'es'],
    },
    rollupOptions: {
      input: {
        sharpstate: path.resolve(import.meta.dirname, 'src/index.ts'),
      },
      output: {
        preserveModules: true,
        entryFileNames: ({ name: filename }) => {
          return `${filename}.[format].js`;
        },
      },
    },
  },
});
