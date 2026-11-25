// Baut die Oberfläche in ein Skript und eine Stildatei unter js/ (feste Namen, siehe PageController).
// Der Kern wird direkt aus ../../src/core eingebunden und nicht kopiert; deshalb braucht der Build das ganze Repo.
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  build: {
    outDir: 'js',
    emptyOutDir: true,
    cssCodeSplit: false,
    modulePreload: false,
    rollupOptions: {
      input: 'src/main.js',
      output: {
        entryFileNames: 'dorfromantik-main.js',
        assetFileNames: 'dorfromantik-main[extname]',
        inlineDynamicImports: true,
      },
    },
  },
});
