import { defineConfig } from 'vite';

// Use './' so asset URLs are relative — works on GitHub Pages subdirectory
// *and* on a custom domain served from root, with no changes needed.
export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
});
