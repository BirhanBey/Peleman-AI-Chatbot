import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    'process.env': {} // Prevent crash on process.env access in browser
  },
  build: {
    // Output to a 'dist' folder inside the peleman-chatbot plugin structure
    outDir: 'peleman-chatbot/dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.tsx'),
      },
      output: {
        entryFileNames: 'peleman-chat.js',
        assetFileNames: 'peleman-chat.[ext]', // For CSS
        // Ensure we don't split files, we want one bundle for WP
        manualChunks: undefined,
      },
    },
  },
});