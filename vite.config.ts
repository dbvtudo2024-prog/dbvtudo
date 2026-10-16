import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  define: {
    __APP_VERSION__: JSON.stringify('3.1.2'),
    __APP_BUILD_TIME__: JSON.stringify(1760627500000)
  },
  server: {
    port: 3000,
    host: '0.0.0.0'
  }
});
