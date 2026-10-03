import { defineConfig } from 'vite';
export default defineConfig({
  base: './',
  build: {
    target: 'es2022',
    rollupOptions: {
      input: { index: 'index.html', search: 'search.html', background: 'src/background.ts' },
      output: { entryFileNames: '[name].js', chunkFileNames: 'assets/[name]-[hash].js' },
    },
  },
});
