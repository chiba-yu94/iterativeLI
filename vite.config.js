// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';

export default defineConfig({
  plugins: [
    svgr(),    // ← allows `import { ReactComponent as Logo } from './logo.svg'`
    react(),   // ← your existing React plugin
  ],
});
