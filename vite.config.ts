import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'api-server-middleware',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (req.url && req.url.startsWith('/api/live-exam')) {
            try {
              const { default: handler } = await import('./api/live-exam.ts');
              await handler(req, res);
            } catch (err: any) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err?.message || 'Internal Server Error' }));
            }
            return;
          }
          next();
        });
      }
    }
  ],
  define: {
    __APP_VERSION__: JSON.stringify('3.1.7'),
    __APP_BUILD_TIME__: JSON.stringify(1761386400000)
  },
  server: {
    port: 3000,
    host: '0.0.0.0'
  }
});
